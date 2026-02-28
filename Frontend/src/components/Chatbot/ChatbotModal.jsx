import React, { useState } from "react";
import "./ChatbotModal.css";
import logo_s from "../../assets/logo_s.png";


const Icons = {
  Maximize: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  ),
  Minimize: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
    </svg>
  ),
  Close: () => (

    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Attach: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
  ),
  Voice: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  ),
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  )
};

const ChatbotModal = ({ onClose }) => {
  const [inputText, setInputText] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = (e) => {
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      console.log("Sending:", inputText);
      setInputText("");
    }
  };

  return (
    <div className={`chatbot-overlay ${isFullScreen ? 'fullscreen-overlay' : ''}`} onClick={onClose}>
      <div className={`chatbot-modal ${isFullScreen ? 'fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">



          <div className="header-info">
            <img src={logo_s} alt="Logo" className="chatbot-header-logo" />
            <div className="status-dot"></div>
            <h3>NeuroSpark Assistant</h3>
          </div>
          <div className="header-actions">
            <button className="fullscreen-btn" onClick={toggleFullScreen} title={isFullScreen ? "Restore" : "Fullscreen"}>
              {isFullScreen ? <Icons.Minimize /> : <Icons.Maximize />}
            </button>
            <button className="close-btn" onClick={onClose} title="Close">
              <Icons.Close />
            </button>
          </div>

        </div>

        <div className="chatbot-messages">
          <div className="message assistant">
            <div className="message-content">
              Hello! I'm your NeuroSpark Assistant. How can I help you today?
            </div>
            <span className="message-time">Just now</span>
          </div>
        </div>

        <div className="chatbot-input-area">
          <div className="input-actions-left">
            <button className="action-btn" title="Attach file">
              <Icons.Attach />
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <div className="input-actions-right">
            <button className="action-btn" title="Voice message">
              <Icons.Voice />
            </button>
            <button className="send-btn" onClick={handleSend} disabled={!inputText.trim()}>
              <Icons.Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;
