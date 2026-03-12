/**
 * Chatbot.jsx — Updated with DeepSeek and database storage
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import chatbotIcon from "../../assets/chatboticon.png";
import logo_s from "../../assets/logo_s.png";
import { toast } from 'react-toastify';
import api from "../../services/api";
import "./Chatbot.css"; // Import CSS file

/* ========== ICONS ========== */
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const MaxIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
  </svg>
);

const MinIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);


/* ========== MODEL CONFIGURATIONS ========== */
const MODELS = {
  github: { 
    name: 'ChatGPT', 
    emoji: '🤖', 
    color: '#10A37F', 
    hint: 'OpenAI GPT-4 (via GitHub Models)',
    needsKey: true
  },
  gemini: { 
    name: 'Gemini', 
    emoji: '💎', 
    color: '#4285F4', 
    hint: 'Google AI (recommended)',
    needsKey: true
  },
  deepseek: { 
    name: 'DeepSeek', 
    emoji: '🧠', 
    color: '#4D6CFA', 
    hint: 'DeepSeek AI (powerful & free)',
    needsKey: true
  },
  openai: { 
    name: 'OpenAI', 
    emoji: '⚡', 
    color: '#10A37F', 
    hint: 'OpenAI GPT-4o Mini',
    needsKey: true
  },
};

/* ========== MAIN CHATBOT COMPONENT ========== */
const Chatbot = ({ isAuthenticated: propIsAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated || false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const endRef = useRef(null);

  // Sync internal isAuthenticated with prop
  useEffect(() => {
    if (propIsAuthenticated !== undefined) {
      setIsAuthenticated(propIsAuthenticated);
    }
  }, [propIsAuthenticated]);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setAuthChecked(true);
  }, []);

  // Load chats from database when authenticated
  useEffect(() => {
    if (isAuthenticated && open) {
      loadChats();
    }
  }, [isAuthenticated, open]);

  // Load current chat messages when chat changes
  useEffect(() => {
    if (currentChatId && isAuthenticated) {
      loadChatMessages(currentChatId);
    }
  }, [currentChatId, isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check API key status from backend when authenticated
  useEffect(() => {
    if (isAuthenticated && open) {
      checkApiKeyStatus();
    }
  }, [isAuthenticated, open]);

  const loadChats = async () => {
    try {
      const response = await api.getChats();
      setChats(response.chats || []);
      
      if (response.chats?.length > 0) {
        setCurrentChatId(response.chats[0].id);
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast.error('Failed to load chat history');
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await api.getChatMessages(chatId);
      setMessages(response.messages || []);
      setCurrentChat(response.chat);
      setModel(response.chat.model || 'gemini');
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewChat = async () => {
    try {
      const response = await api.createChat({ model });
      const newChat = response.chat;
      
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your NeuroSpark Assistant 😊 How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      if (window.innerWidth < 768) setShowSidebar(false);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create new chat');
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await api.deleteChat(chatId);
      const newChats = chats.filter(c => c.id !== chatId);
      setChats(newChats);
      
      if (newChats.length > 0) {
        setCurrentChatId(newChats[0].id);
      } else {
        createNewChat();
      }
      
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const renameChat = async (chatId, newTitle) => {
    try {
      await api.updateChat(chatId, { title: newTitle });
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      setEditingChatId(null);
      toast.success('Chat renamed');
    } catch (error) {
      console.error('Failed to rename chat:', error);
      toast.error('Failed to rename chat');
    }
  };

  const checkApiKeyStatus = async () => {
    try {
      const data = await api.get('/chatbot/status');
      setApiStatus(data);
    } catch (error) {
      console.error('Error checking API status:', error);
      setApiStatus({
        github: false,
        openai: false,
        gemini: false,
        deepseek: false,
      });
    }
  };

  const timeStr = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpenAuth = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };


  const sendToBackend = async (messageContent) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await api.sendChatMessage({
      message: messageContent,
      chat_id: currentChatId,
      model: model
    });

    return response;
  } catch (error) {
    console.error('Backend chat error:', error);
    
    if (error.data && error.data.model_used) {
      const modelName = MODELS[error.data.model_used]?.name || error.data.model_used;
      toast.error(`${modelName} is currently unavailable. Please try another model.`);
    } else if (error.message.includes('Failed to fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    } else {
      toast.error(error.message || 'Failed to get response');
    }
    
    throw error;
  }
};

  const send = async () => {
    if (!input.trim()|| loading) return;
    
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }

    const messageContent = input.trim();
    
    // Add user message to UI immediately
    const userMsg = { 
      role: 'user', 
      content: messageContent,
      time: timeStr() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendToBackend(messageContent);
      
      // Add assistant message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.reply, 
        time: timeStr(), 
        model: response.model_used 
      }]);

      // Update current chat ID if new chat was created
      if (response.chat_id && !currentChatId) {
        setCurrentChatId(response.chat_id);
        loadChats(); // Reload chat list
      }
    } catch (error) {
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again! 😊", 
        time: timeStr() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChatbot = () => {
    if (!isAuthenticated && authChecked) {
      toast.info('Please sign in to chat with NeuroSpark Assistant!');
      handleOpenAuth();
    } else {
      setOpen(true);
    }
  };

  const clearConversation = () => {
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }
    
    // Delete current chat and create new one
    if (currentChatId) {
      deleteChat(currentChatId);
    } else {
      createNewChat();
    }
  };

  /* ========== RENDER CHATBOT BUTTON ========== */
  if (!open) {
    return (
      <button 
        onClick={handleOpenChatbot} 
        aria-label="Open Chatbot" 
        className={`chatbot-button ${isAuthenticated ? 'authenticated' : ''}`}
      >
        <img src={chatbotIcon} alt="Chat" />
      </button>
    );
  }

  /* ========== MODAL STYLES ========== */
  const boxStyle = full
    ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', borderRadius: 0 }
    : { width: 440, maxWidth: '92vw', height: 600, maxHeight: '82vh', borderRadius: 20 };

  /* ========== RENDER CHATBOT MODAL ========== */
  return (
    <div className="chatbot-overlay" onClick={() => setOpen(false)}>
      <div 
        className={`chatbot-modal ${full ? 'full' : ''}`}
        style={boxStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className={`chatbot-sidebar ${showSidebar ? 'open' : 'closed'}`}>
          <div className="chatbot-sidebar-inner">
            <div className="sidebar-header">
              <span className="sidebar-title">Chat History</span>
              <button
                onClick={() => setShowSidebar(false)}
                className="sidebar-close-btn"
              >
                <XIcon />
              </button>
            </div>
            
            <div style={{ padding: '16px 16px 8px 16px' }}>
              <button
                onClick={createNewChat}
                className="new-chat-btn"
              >
                + New Chat
              </button>
            </div>
            
            <div style={{ padding: '8px 16px' }}>
              <div className="search-container">
                <div className="search-icon">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="chat-list">
              {chats
                .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (editingChatId !== c.id) {
                        setCurrentChatId(c.id);
                        if (window.innerWidth < 768) setShowSidebar(false);
                      }
                    }}
                    className={`chat-item ${currentChatId === c.id ? 'active' : ''}`}
                  >
                    {editingChatId === c.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => renameChat(c.id, editTitle || 'New Chat')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            renameChat(c.id, editTitle || 'New Chat');
                          }
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 8px',
                          color: '#333',
                          outline: 'none',
                          fontSize: 13
                        }}
                      />
                    ) : (
                      <>
                        <div className="chat-item-title" title={c.title}>
                          {c.title}
                        </div>
                        {currentChatId === c.id && (
                          <div className="chat-item-actions">
                            <button
                              title="Rename"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingChatId(c.id);
                                setEditTitle(c.title);
                              }}
                            >
                              <EditIcon />
                            </button>
                            <button
                              title="Delete"
                              onClick={e => {
                                e.stopPropagation();
                                deleteChat(c.id);
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {/* Header */}
          <div className="chat-header">
            <div className="header-left">
              <button 
                onClick={() => setShowSidebar(prev => !prev)}
                className="menu-toggle"
                title="Toggle Sidebar"
              >
                <MenuIcon />
              </button>
            </div>

            <div className="header-logo">
              <img src={logo_s} alt="Logo" />
              <div className="status-dot" />
            </div>

            <div className="header-actions">
              <button 
                onClick={clearConversation}
                className="header-btn"
                title="Clear conversation"
              >
                🧹 Clear
              </button>
              <button 
                onClick={() => setFull(f => !f)} 
                className="header-btn"
              >
                {full ? <MinIcon/> : <MaxIcon/>}
              </button>
              <button 
                onClick={() => setOpen(false)} 
                className="header-btn"
              >
                <XIcon/>
              </button>
            </div>
          </div>

          {/* Model Tabs */}
          <div style={{ 
              padding: '7px 14px', 
              borderBottom: '1px solid #f0f0f0', 
              background: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Model:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '120px'
                  }}
                >
                  {Object.entries(MODELS).map(([key, config]) => {
                    const isAvailable = apiStatus[key];
                    return (
                      <option 
                        key={key} 
                        value={key}
                        disabled={!isAvailable}
                        style={{ 
                          color: !isAvailable ? '#999' : 'inherit',
                          backgroundColor: !isAvailable ? '#f5f5f5' : 'inherit'
                        }}
                      >
                        {config.emoji} {config.name} {!isAvailable ? ' (unavailable)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              </div>

          {/* Messages */}
          <div className="messages-area">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`message-wrapper ${m.role}`}
              >
                <div className={`message-bubble ${m.role}`}>
                  {m.content}
                  
                  {/* Copy button for assistant messages */}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(m.content, i)}
                      className={`copy-btn ${copiedIndex === i ? 'copied' : ''}`}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === i ? <CheckIcon/> : <CopyIcon/>}
                    </button>
                  )}
                </div>
                
                <div className="message-meta">
                  {m.time} 
                  {m.model && (
                    <span className="model-badge">
                      • via {MODELS[m.model]?.emoji} {MODELS[m.model]?.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div className="typing-indicator">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div 
                      key={i} 
                      className="typing-dot"
                      style={{ animationDelay: `${d}s` }} 
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

  

          {/* Input Area */}
        <div className="input-area">
          <input
            type="text" 
            placeholder={isAuthenticated ? "Type your message..." : "Login to chat..."}
            value={input}
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            disabled={loading || !isAuthenticated}
            className="message-input"
          />
          
          <button 
            onClick={send} 
            disabled={!input.trim() || loading || !isAuthenticated} 
            className="send-btn"
          >
            {isAuthenticated ? <SendIcon/> : <LockIcon/>}
          </button>
        </div>

          {/* Status Footer */}
          <div className="status-footer">
            <div className="status-models">
              {apiStatus.github && (
                <span className="model-status github">
                  🤖 ChatGPT
                </span>
              )}
              {apiStatus.gemini && (
                <span className="model-status gemini">
                  💎 Gemini
                </span>
              )}
              {apiStatus.deepseek && (
                <span className="model-status deepseek">
                  🧠 DeepSeek
                </span>
              )}
            </div>
            
            <div>
              {!isAuthenticated ? (
                <span 
                  onClick={handleOpenAuth}
                  className="login-prompt"
                >
                  Login to chat
                </span>
              ) : (
                <span className="connected-status">
                  ⚡ Connected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;