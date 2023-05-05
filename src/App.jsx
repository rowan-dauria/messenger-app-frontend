import React from 'react';
import PropTypes from 'prop-types';
import Login from './login';
import './App.css';

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

function ChatList({ chatsArray, usersArray, tileClickHandler }) {
  const usernameObj = usersArray.reduce((accumulatorObj, user) => {
    const obj = { ...accumulatorObj };
    obj[user.id] = user.display_name;
    return obj;
  }, {});
  return (
    <div className="ChatList">
      {
        chatsArray.map((chat) => (
          <ChatTile
            key={chat.id}
            chatName={chat.members.map((chatMemberID) => usernameObj[chatMemberID]).toString()}
            chatID={chat.id}
            onClick={tileClickHandler}
          />
        ))
      }
    </div>
  );
}

ChatList.propTypes = {
  chatsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
  usersArray: PropTypes.arrayOf(PropTypes.object).isRequired,
  tileClickHandler: PropTypes.func.isRequired,
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

    await postJSON('/messages', message);
    messages.push(message);
    setMessages(messages.slice());
  };

  React.useEffect(() => {
    if (messages) return;
    fetchMsgsByChatID(chat.id).then((fetchedMessages) => {
      setMessages(fetchedMessages);
    });
  }, [chat.id]);

  return (
    <div className="ChatView">
      <header>
        <button type="button" onClick={onClickBack}>Back</button>
        A CHAT
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

  const authenticateUser = async (email, password) => {
    const authUser = await login(email, password);
    setUser(authUser);
  };

  const openChat = (chatID) => {
    setCurrentChat(chats.filter((chat) => chat.id === chatID)[0]);
  };

  const unsetCurrentChat = () => setCurrentChat(null);

  React.useEffect(() => {
    if (chats || users || !user) return;
    Promise.all([fetchChats(), fetchUsers()]).then(([chatsPromise, usersPromise]) => {
      setUsers(usersPromise);
      setChats(chatsPromise);
    });
  });

  if (!user) {
    return (
      <Login loginCallback={authenticateUser} />
    );
  }

  if (currentChat) {
    return (
      <div className="App">
        <ChatView
          chat={currentChat}
          onClickBack={unsetCurrentChat}
          userMe={user}
        />
      </div>
    );
  }

  return (
    <div className="App">
      {
        (chats)
          ? <ChatList chatsArray={chats} usersArray={users} tileClickHandler={openChat} />
          : <LoadingMessage />
      }
    </div>
  );
}

export default App;
