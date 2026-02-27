import React from "react";
import "./ChatbotButton.css";
import chatbotIcon from "../../assets/chatboticon.png";

const ChatbotButton = () => {
  return (
    <button className="chatbot-floating-button" aria-label="Open Chatbot">
      <img src={chatbotIcon} alt="Chatbot Icon" className="chatbot-icon" />
    </button>
  );
};

export default ChatbotButton;

