import React from "react";
import "./ChatbotButton.css";
import chatbotIcon from "../../assets/chatboticon.png";

const ChatbotButton = ({ onClick }) => {
  return (
    <button 
      className="chatbot-floating-button" 
      onClick={onClick}
      aria-label="Open Chatbot"
    >
      <img src={chatbotIcon} alt="Chatbot Icon" className="chatbot-icon" />
    </button>
  );
};


export default ChatbotButton;

