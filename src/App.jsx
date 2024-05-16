import React from 'react';
import io from 'socket.io-client';
import Login from './login';
import ChatView from './ChatView';
import ChatList from './ChatList';
import utils from './utils';

// eslint-disable-next-line
const ls = localStorage;

// Some getters and setters to regulate how localStorage is used
const getLocalUser = () => {
  if (ls.getItem('localUser')) return JSON.parse(ls.getItem('localUser'));
  return null;
};
const setLocalUser = (user) => ls.setItem('localUser', JSON.stringify(user));
const deleteLocalUser = () => ls.removeItem('localUser');

const {
  postJSON,
  fetchChats,
  fetchMsgsByChatID,
  login,
  postNewUser,
  fetchUsers,
} = utils;

// autoConnect false because a connection should be made only after auth success
const socket = io('http://localhost:3000', { autoConnect: false });
socket.on('connect', () => console.log(socket.id));

function LoadingMessage() {
  return (
    <div className="LoadingMessage">
      Loading chats
    </div>
  );
}

/**
 * @prop {obj} myUser - the user currently logged in, aka the user obj stored in localStorage
 * @prop {arrayOf(obj)} chats - the chats myUser is a member of
 * @prop {arrayOf(obj)} users - all users
 * @prop {obj} currentChat - the chat currently open for myUser
 * @prop {arrayOf(obj)} currentChatMessages - all messages with message.chat_id === currentChat.id
 * @returns {React.ReactComponentElement}
 */
function App() {
  // all these things should update the UI when they are changed
  const [myUser, setMyUser] = React.useState(null);
  const [chats, setChats] = React.useState(null);
  const [users, setUsers] = React.useState(null);
  const [currentChat, setCurrentChat] = React.useState(null);
  // initial state is loading:true to differentiate from a chat with zero messages.
  const [currentChatMessages, setCurrentChatMessages] = React.useState([{ loading: true }]);

  // callback passed to ChatView
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
    // update state to refresh view
    setCurrentChatMessages(currentChatMessages.slice());
  };

  const onClickSaveNewchat = async (newChatName, newChatMemberEmails, dialog) => {
    // validate that all required feilds are provided
    if (newChatName && newChatMemberEmails) {
      // filter users array to contain only the user with a matching email, take the first
      // element of array and extracts the id
      const memberIds = users.filter((user) => user.email === newChatMemberEmails)[0].id;
      const newChat = await postJSON('/auth/chats', {
        name: newChatName,
        members: [myUser.id, memberIds],
      });
      // posting to chats endpoint returns an array, so need to get the first element of it
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

  const createUser = async (displayName, email, password) => {
    const newUser = await postNewUser(displayName, email, password);
    // Authorisation happens automatically on the backend when the user is created
    // so don't need to authorise the new user here
    setLocalUser(newUser.user);
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
      Promise.all([fetchChats(), fetchUsers()])
        .then(([chatsPromise, usersPromise]) => {
          setUsers(usersPromise);
          setChats(chatsPromise);
          socket.emit(
            'chats join',
            { chatIds: chatsPromise.map((chat) => `chat_id_${chat.id}`) },
          );
        })
        .catch(() => {
          // if fetching errors when the app loads,
          // delete the locally stored user to show the login screen
          deleteLocalUser();
          setMyUser(getLocalUser());
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
  // Allows a user to be automatically logged back if they close and re-open tab
  if (getLocalUser() && !myUser) {
    setMyUser(getLocalUser());
  }

  function showView() {
    if (!myUser) {
      return (
        <Login
          loginCallback={authenticateUser}
          createUserCallback={createUser}
        />
      );
    }

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
