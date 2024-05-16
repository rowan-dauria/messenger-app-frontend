import React from 'react';
import PropTypes from 'prop-types';

function NewChat({ onClickSave }) {
  const [chatName, setChatName] = React.useState(null);
  const [chatMemberEmails, setChatMemberEmails] = React.useState(null);

  return (
    <div>
      <input
        type="text"
        aria-label="User name"
        placeholder="Name"
        onChange={(e) => {
          const name = e.target.value;
          setChatName(name);
        }}
      />
      <input
        type="text"
        aria-label="User email"
        placeholder="User email"
        onChange={(e) => {
          const email = e.target.value;
          setChatMemberEmails(email);
        }}
      />
      <button type="button" onClick={() => onClickSave(chatName, chatMemberEmails)}>
        <span>Save</span>
      </button>
    </div>
  );
}

NewChat.propTypes = {
  onClickSave: PropTypes.func.isRequired,
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

function ChatList({
  chatsArray,
  tileClickHandler,
  onClickSaveNewchat,
}) {
  const dialogRef = React.useRef(null);

  const onClickSave = (...args) => {
    onClickSaveNewchat(...args, dialogRef.current);
  };

  return (
    <div className="ChatList">
      <button
        type="button"
        onClick={() => dialogRef.current.showModal()}
      >
        <span>New Chat</span>
      </button>
      <div className="list-container">
        {
          chatsArray.map((chat) => (
            <ChatTile
              key={chat.id}
              chatName={chat.name}
              chatID={chat.id}
              onClick={tileClickHandler}
            />
          ))
        }
      </div>
      {/**
       * "If you pass the ref object to React as a ref attribute
       * to a JSX node, React will set its current property." from https://react.dev/reference/react/useRef
       * We have to pass this reference to the dialog box into the onClickSaveNewChat function
       * because the parent view needs a reference to the dialog to close it after receiving
       * a response from the server.
       */}
      <dialog ref={dialogRef}>
        <NewChat
          onClickSave={onClickSave}
        />
      </dialog>
    </div>
  );
}

ChatList.propTypes = {
  chatsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
  tileClickHandler: PropTypes.func.isRequired,
  onClickSaveNewchat: PropTypes.func.isRequired,
};

export default ChatList;
