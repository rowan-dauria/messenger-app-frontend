import React from 'react';
import io from 'socket.io-client';
import Login from './login';
import ChatView from './ChatView';
import ChatList from './ChatList';
import utils from './utils';

// eslint-disable-next-line
const ls = localStorage;

// TODO handle session timeout when localUser exists
// TODO better functionality for making new chats

const getLocalUser = () => {
  if (ls.getItem('localUser')) return JSON.parse(ls.getItem('localUser'));
  return null;
};
const setLocalUser = (user) => ls.setItem('localUser', JSON.stringify(user));

const {
  postJSON,
  fetchChats,
  fetchMsgsByChatID,
  login,
  fetchUsers,
} = utils;

const socket = io('http://localhost:3000', { autoConnect: false });
socket.on('connect', () => console.log(socket.id));

function LoadingMessage() {
  return (
    <div className="LoadingMessage">
      Loading chats
    </div>
  );
}

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

  const onClickSaveNewchat = async (newChatName, newChatMemberEmails, dialog) => {
    if (newChatName && newChatMemberEmails) {
      const memberIds = users.filter((user) => user.email === newChatMemberEmails)[0].id;
      const newChat = await postJSON('/auth/chats', {
        name: newChatName,
        members: [myUser.id, memberIds],
      });
      chats.push(newChat[0]);
      setChats(chats.slice());
      if (dialog.open) dialog.close();
    }
  };

  const authenticateUser = async (email, password) => {
    const authUser = await login(email, password);
    setLocalUser(authUser.user);
    setMyUser(getLocalUser());
    if (!socket.connected) socket.connect();
  };

  const openChat = (chatID) => {
    setCurrentChat(chats.filter((chat) => chat.id === chatID)[0]);
    fetchMsgsByChatID(chatID).then((fetchedMessages) => {
      setCurrentChatMessages(fetchedMessages);
    });
  };

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

      // only need to listen to this event when logged in
      // putting the event listener in useEffect prevents duplicate handlers being made
      // see https://socket.io/how-to/use-with-react
      socket.on('message to client', (message) => {
        currentChatMessages.push(message);
        setCurrentChatMessages(currentChatMessages.slice());
      });
    }
    return () => socket.off('message to client');
  }, [myUser]);

  // if there is a user model stored in localStorage and no user has been set, use localUser
  if (getLocalUser() && !myUser) {
    setMyUser(getLocalUser());
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
                  tileClickHandler={openChat}
                  onClickSaveNewchat={onClickSaveNewchat}
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
