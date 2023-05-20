import React from 'react';
import PropTypes from 'prop-types';

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

function ChatView({
  chat,
  chatMessages,
  myUser,
  onClickSendMessage,
}) {
  const onClickSend = (text) => {
    onClickSendMessage(text, chat.id);
  };

  const showLoadingMessage = () => (
    <div className="loading-messages">
      Loading Messages
    </div>
  );

  const showMessages = () => {
    const chatMessagesOrLoadingNotice = chatMessages && chatMessages.length
      ? (
        <div className="message-container">
          {chatMessages.map((message) => (
            <div key={message.id} className={`message ${message.created_by === myUser.id ? 'outgoing' : 'incoming'}`}>
              {message.content.text}
            </div>
          ))}
        </div>
      )
      : <div className="no-messages">no messages found</div>;
    return chatMessagesOrLoadingNotice;
  };

  const showMessagesOrLoading = () => {
    if (chatMessages[0] && chatMessages[0].loading) {
      return showLoadingMessage();
    }
    return showMessages();
  };

  return (
    <div className="ChatView">
      <header>
        {chat.name}
      </header>
      {showMessagesOrLoading()}
      <InputArea onClick={onClickSend} />
    </div>
  );
}

ChatView.propTypes = {
  chatMessages: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClickSendMessage: PropTypes.func.isRequired,
  chat: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  myUser: PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    display_name: PropTypes.string,
  }).isRequired,
};

export default ChatView;
