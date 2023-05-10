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
  userMe,
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
        members: [userMe.id, memberIds],
      });
      chatsToShow.push(newChat);
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
  userMe: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    display_name: PropTypes.string,
  }).isRequired,
};

function InputArea({ onClick }) {
  const [text, setText] = React.useState(null);
  return (
    <div className="InputArea">
      <input
        type="text"
        onChange={(e) => setText(e.target.value)}
      />
      <button
        disabled={!text}
        type="button"
        onClick={() => {
          if (!text) return;
          onClick(text);
        }}
      >
        Send
      </button>
    </div>
  );
}

InputArea.propTypes = {
  onClick: PropTypes.func.isRequired,
};

function ChatView({ chat, onClickBack, userMe }) {
  const [messages, setMessages] = React.useState(null);

  const onClickSend = async (text, image = null) => {
    const message = {
      created_by: userMe.id,
      chat_id: chat.id,
      content: {
        text,
        image,
      },
    };
    socket.emit('message to server', message);

    messages.push(message);
    setMessages(messages.slice());
  };

  React.useEffect(() => {
    if (messages) return;
    fetchMsgsByChatID(chat.id).then((fetchedMessages) => {
      setMessages(fetchedMessages);
    });
  }, [chat.id]);

  socket.on('message to client', (message) => {
    messages.push(message);
    setMessages(messages.slice());
  });

  return (
    <div className="ChatView">
      <header>
        <button type="button" onClick={onClickBack}>Back</button>
        {chat.name}
      </header>
      {
        messages && messages.length
          ? (
            <div className="message-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.created_by === userMe.id ? 'outgoing' : 'incoming'}`}>
                  {message.content.text}
                </div>
              ))}
            </div>
          )
          : <div className="no-messages">no messages found</div>
      }
      <InputArea onClick={onClickSend} />
    </div>
  );
}

ChatView.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  onClickBack: PropTypes.func.isRequired,
  userMe: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    display_name: PropTypes.string,
  }).isRequired,
};

function App() {
  const [user, setUser] = React.useState(null);
  const [chats, setChats] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [currentChat, setCurrentChat] = React.useState(null);

  if (!user) {
    fetchMyUser()
      .then((res) => {
        if (res.status === 403) throw new Error('unauthorised request');
        return res.json();
      })
      .then((myUser) => setUser(myUser))
      .catch((err) => console.error(err));
  }

  const authenticateUser = async (email, password) => {
    const authUser = await login(email, password);
    setUser(authUser.user);
  };

  const openChat = (chatID) => {
    setCurrentChat(chats.filter((chat) => chat.id === chatID)[0]);
  };

  const unsetCurrentChat = () => setCurrentChat(null);

  React.useEffect(() => {
    // cancels if chats have already been fetched, or if the user has not been set
    // need to know the user to know what chats to fetch.
    if (!chats && !users && user) {
      Promise.all([fetchChats(), fetchUsers()]).then(([chatsPromise, usersPromise]) => {
        setUsers(usersPromise);
        setChats(chatsPromise);
      });
    }
    socket.connect();
    // return value of useEffect callback is a function called when the component is unmounted
    return function cleanup() {
      socket.disconnect();
    };
  });

  function showView() {
    if (!user) return (<Login loginCallback={authenticateUser} />);

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
                  userMe={user}
                />
              )
              : <LoadingMessage />
          }
          {
            (currentChat)
              ? (
                <ChatView
                  chat={currentChat}
                  onClickBack={unsetCurrentChat}
                  userMe={user}
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
