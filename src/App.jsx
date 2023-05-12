import React from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import Login from './login';

const socket = io('http://localhost:3000', { autoConnect: false });

async function login(email, password) {
  const bodyJSON = { email, password };
  const res = await fetch('/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyJSON),
  });
  const json = await res.json();
  return json;
}

async function fetchChats() {
  const res = await fetch('auth/chats');
  const chats = await res.json();
  return chats;
}

async function fetchUsers() {
  const res = await fetch('auth/users');
  const users = await res.json();
  return users;
}

async function fetchMsgsByChatID(id) {
  const res = await fetch(`auth/messages?chat_id=${id}`);
  const chat = await res.json();
  return chat;
}

async function fetchMyUser() {
  const res = await fetch('auth/users/me');
  return res;
}

async function postJSON(endpoint, JSONData) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSONData),
  });
  const json = await res.json();
  return json;
}

function NewChat({ onChangeName, onChangeMembers, onClickSaveNewchat }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Name"
        onChange={(e) => {
          const name = e.target.value;
          onChangeName(name);
        }}
      />
      <input
        type="text"
        placeholder="User email"
        onChange={(e) => {
          const email = e.target.value;
          onChangeMembers(email);
        }}
      />
      <button type="button" onClick={onClickSaveNewchat}>
        <span>Save</span>
      </button>
    </div>
  );
}

NewChat.propTypes = {
  onChangeName: PropTypes.func.isRequired,
  onChangeMembers: PropTypes.func.isRequired,
  onClickSaveNewchat: PropTypes.func.isRequired,
};

function ChatTile({ chatName, chatID, onClick }) {
  return (
    <button type="button" className="ChatTile" onClick={() => onClick(chatID)}>
      <span className="chat-name">{chatName}</span>
    </button>
  );
}

ChatTile.propTypes = {
  chatName: PropTypes.string.isRequired,
  chatID: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,

};

function LoadingMessage() {
  return (
    <div className="LoadingMessage">
      Loading chats
    </div>
  );
}

function ChatList({
  chatsArray,
  usersArray,
  tileClickHandler,
  myUser,
}) {
  const [chatsToShow, setChatsToShow] = React.useState(chatsArray);
  const [showModal, setShowModal] = React.useState(false);
  const [newChatName, setNewChatName] = React.useState(null);
  const [newChatMemberEmails, setNewChatMemberEmails] = React.useState(null);
  const ref = React.useRef(null);

  React.useCallback(
    () => {
      socket.emit('chats join', chatsToShow.map((chat) => chat.id));
    },
    [chatsToShow],
  );

  React.useEffect(() => {
    if (showModal && !(ref.current.open)) ref.current.showModal();
  }, [showModal]);

  const onClickSaveNewchat = async () => {
    if (newChatName && newChatMemberEmails) {
      const memberIds = usersArray.filter((user) => user.email === newChatMemberEmails)[0].id;
      const newChat = await postJSON('/auth/chats', {
        name: newChatName,
        members: [myUser.id, memberIds],
      });
      chatsToShow.push(newChat[0]);
      setChatsToShow(chatsToShow.slice());
      if (ref.current.open) ref.current.close();
    }
  };

  return (
    <div className="ChatList">
      <button
        type="button"
        onClick={() => setShowModal(true)}
      >
        <span>New Chat</span>
      </button>
      <div className="list-container">
        {
          chatsToShow.map((chat) => (
            <ChatTile
              key={chat.id}
              chatName={chat.name}
              chatID={chat.id}
              onClick={tileClickHandler}
            />
          ))
        }
      </div>
      <dialog ref={ref}>
        <NewChat
          onChangeName={setNewChatName}
          onChangeMembers={setNewChatMemberEmails}
          onClickSaveNewchat={onClickSaveNewchat}
        />
      </dialog>
    </div>
  );
}

ChatList.propTypes = {
  chatsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
  usersArray: PropTypes.arrayOf(PropTypes.object).isRequired,
  tileClickHandler: PropTypes.func.isRequired,
  myUser: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    display_name: PropTypes.string,
  }).isRequired,
};

function App() {
  const [myUser, setMyUser] = React.useState(null);
  const [chats, setChats] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [currentChat, setCurrentChat] = React.useState(null);
  const [currentChatMessages, setCurrentChatMessages] = React.useState([{ loading: true }]);

  const onClickSendMessage = async (text, chatID, image = null) => {
    const message = {
      created_by: myUser.id,
      chat_id: chatID,
      content: {
        text,
        image,
      },
    };
    socket.emit('message to server', message);
    console.log(`socket ${socket.id} sending message to server`);

    currentChatMessages.push(message);
    setCurrentChatMessages(currentChatMessages.slice());
  };

  const authenticateUser = async (email, password) => {
    const authUser = await login(email, password);
    setMyUser(authUser.user);
    if (!socket.connected) socket.connect();
  };

  const openChat = (chatID) => {
    setCurrentChat(chats.filter((chat) => chat.id === chatID)[0]);
    fetchMsgsByChatID(chatID).then((fetchedMessages) => {
      setCurrentChatMessages(fetchedMessages);
    });
  };

  socket.on('message to client', (message) => {
    currentChatMessages.push(message);
    setCurrentChatMessages(currentChatMessages.slice());
  });

  React.useEffect(() => {
    // cancels if chats have already been fetched, or if the user has not been set
    // need to know the user to know what chats to fetch.
    if (myUser) {
      Promise.all([fetchChats(), fetchUsers()]).then(([chatsPromise, usersPromise]) => {
        setUsers(usersPromise);
        setChats(chatsPromise);
        socket.emit(
          'chats join',
          { chatIds: chatsPromise.map((chat) => `chat_id_${chat.id}`) },
        );
      });
    }
  }, [myUser]);

  if (!myUser) {
    fetchMyUser()
      .then((res) => {
        if (res.status === 403) throw new Error('unauthorised request');
        return res.json();
      })
      .then((user) => setMyUser(user))
      .then(() => {
        if (!socket.connected) socket.connect();
      })
      .catch((err) => console.error(err));
  }

  function showView() {
    if (!myUser) return (<Login loginCallback={authenticateUser} />);

    return (
      <div className="App">
        <div className="ChatList-ChatView-container">
          {
            (chats)
              ? (
                <ChatList
                  chatsArray={chats}
                  usersArray={users}
                  tileClickHandler={openChat}
                  myUser={myUser}
                />
              )
              : <LoadingMessage />
          }
          {
            (currentChat)
              ? (
                <ChatView
                  chat={currentChat}
                  myUser={myUser}
                  onClickSendMessage={onClickSendMessage}
                  chatMessages={currentChatMessages}
                />
              )
              : null
          }
        </div>
      </div>
    );
  }

  return showView();
}

export default App;
