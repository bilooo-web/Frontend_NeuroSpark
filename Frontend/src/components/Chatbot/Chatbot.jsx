/**
 * Chatbot.jsx — Updated to use Laravel backend API
 * 
 * Users must be logged in to use the chatbot
 * API keys are securely stored on the server
 */

import React, { useState, useRef, useEffect } from "react";
import chatbotIcon from "../../assets/chatboticon.png";
import logo_s from "../../assets/logo_s.png";
import { toast } from 'react-toastify';

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

/* ========== MODEL CONFIGURATIONS ========== */

const MODELS = {
 github: { 
    name: 'Chatgpt', 
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
  claude: { 
    name: 'Claude', 
    emoji: '🦜', 
    color: '#8B5CF6', 
    hint: 'Anthropic Claude',
    needsKey: true
  },
};

/* ========== MAIN CHATBOT COMPONENT ========== */
const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [msgs, setMsgs] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your NeuroSpark Assistant 😊 How can I help you today?", 
      time: 'Now' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const endRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000/api';

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setAuthChecked(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs]);

  // Check API key status from backend when authenticated
  useEffect(() => {
    if (isAuthenticated && open) {
      checkApiKeyStatus();
    }
  }, [isAuthenticated, open]);

  const checkApiKeyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chatbot/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus(data);
      } else {
        console.error('Failed to fetch API status');
        setApiStatus({
          openai: false,
          gemini: false,
          claude: false
        });
      }
    } catch (error) {
      console.error('Error checking API status:', error);
      setApiStatus({
        openai: false,
        gemini: false,
        claude: false
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
    // Close chatbot first
    setOpen(false);
    // Dispatch event to open auth modal
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };

  /* ========== SEND MESSAGE TO BACKEND ========== */
  const sendToBackend = async (history, selectedModel) => {
  const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
  
  // Prepare history without timestamps
  const cleanHistory = history.map(({ role, content }) => ({ role, content }));

  try {
    const token = localStorage.getItem('token');
    
    // Check if token exists
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const controller = new AbortController();
    // Increase timeout to 30 seconds (30000ms)
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        message: lastUserMessage,
        history: cleanHistory.slice(0, -1), // Exclude the last message we're sending
        model: selectedModel
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        throw new Error('Session expired. Please login again.');
      }
      
      if (response.status === 429) {
        const data = await response.json();
        toast.warning(data.message || 'Rate limit reached. Please wait a moment.');
        return data.fallback; // Return fallback from backend
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    console.error('Backend chat error:', error);
    
    if (error.name === 'AbortError') {
      toast.error('Request timed out. The server is taking too long to respond.');
    } else if (error.message.includes('Failed to fetch')) {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    } else {
      toast.error(error.message || 'Failed to get response');
    }
    
    // Final fallback responses
    const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
    if (/hello|hi |hey|greetings/i.test(lastUserMessage)) {
      return "Hey there! 👋 I'm here to help! (Offline mode)";
    }
    return "I'm having trouble connecting right now. Please try again in a moment! 😊";
  }
};

  const send = async () => {
    if (!input.trim() || loading) return;
    
    // Check authentication before sending
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }
    
    const userMsg = { 
      role: 'user', 
      content: input.trim(), 
      time: timeStr() 
    };
    
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput('');
    setLoading(true);

    let reply = '';
    let modelUsed = model;

    try {
      reply = await sendToBackend(history, model);
      
      // Check if response indicates model was switched
      if (reply && reply.includes('[using')) {
        const match = reply.match(/\[using (\w+)\]/);
        if (match && match[1]) {
          modelUsed = match[1];
        }
      }
    } catch (e) {
      console.warn('Chat error:', e);
      reply = "I'm having trouble connecting. Please try again! 😊";
    }

    setMsgs(prev => [...prev, { 
      role: 'assistant', 
      content: reply, 
      time: timeStr(), 
      model: modelUsed 
    }]);
    setLoading(false);
  };

  /* ========== CLEAR CONVERSATION ========== */
  const clearConversation = () => {
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }
    
    setMsgs([{ 
      role: 'assistant', 
      content: "Conversation cleared! 😊 How can I help you now?", 
      time: timeStr() 
    }]);
  };

  const handleOpenChatbot = () => {
    if (!isAuthenticated && authChecked) {
      toast.info('Please sign in to chat with NeuroSpark Assistant!');
      handleOpenAuth();
    } else {
      setOpen(true);
    }
  };

  /* ========== RENDER CHATBOT BUTTON ========== */
  if (!open) {
    return (
      <button 
        onClick={handleOpenChatbot} 
        aria-label="Open Chatbot" 
        style={{
          position: 'fixed', 
          bottom: 30, 
          right: 30, 
          width: 65, 
          height: 65, 
          borderRadius: '50%',
          backgroundColor: isAuthenticated ? '#8be3d8' : '#a0a0a0',
          border: isAuthenticated ? 'none' : '2px solid #fff',
          cursor: 'pointer', 
          zIndex: 9999,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: isAuthenticated 
            ? '0 4px 15px rgba(0,0,0,0.15)' 
            : '0 4px 15px rgba(0,0,0,0.25)',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={e => { 
          if (isAuthenticated) {
            e.currentTarget.style.transform = 'scale(1.12)'; 
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; 
          }
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.transform = 'scale(1)'; 
          e.currentTarget.style.boxShadow = isAuthenticated 
            ? '0 4px 15px rgba(0,0,0,0.15)' 
            : '0 4px 15px rgba(0,0,0,0.25)';
        }}
      >
        <img 
          src={chatbotIcon} 
          alt="Chat" 
          style={{ 
            width: '68%', 
            height: '68%', 
            objectFit: 'contain',
            opacity: isAuthenticated ? 1 : 0.7
          }} 
        />
        {!isAuthenticated && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#ff4757',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            !
          </div>
        )}
      </button>
    );
  }

  /* ========== MODAL STYLES ========== */
  const box = full
    ? { 
        width: '100vw', 
        height: '100vh', 
        maxWidth: 'none', 
        maxHeight: 'none', 
        borderRadius: 0 
      }
    : { 
        width: 440, 
        maxWidth: '92vw', 
        height: 600, 
        maxHeight: '82vh', 
        borderRadius: 20 
      };

  /* ========== RENDER CHATBOT MODAL ========== */
  return (
    <div 
      onClick={() => setOpen(false)} 
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 10000, 
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(2px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes cbIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cbDots {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .message-enter {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          ...box, 
          background: '#fff', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          animation: 'cbIn 0.28s cubic-bezier(0.34,1.56,0.64,1)', 
          transition: 'all 0.3s',
        }}
      >
        {/* ===== HEADER ===== */}
        <div style={{ 
          padding: '14px 18px', 
          borderBottom: '1px solid #eee', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo_s} alt="Logo" style={{ height: 32 }} />
            <div style={{ 
              width: 7, 
              height: 7, 
              background: '#8be3d8', 
              borderRadius: '50%', 
              boxShadow: '0 0 8px rgba(139,227,216,0.6)' 
            }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3436' }}>
              NeuroSpark AI
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={clearConversation}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#888', 
                padding: '4px 8px',
                fontSize: 13,
                borderRadius: 4,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = '#f0f0f0'}
              onMouseLeave={e => e.target.style.background = 'none'}
              title="Clear conversation"
            >
              🧹 Clear
            </button>
            <button 
              onClick={() => setFull(f => !f)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#888', 
                padding: 4 
              }}
            >
              {full ? <MinIcon/> : <MaxIcon/>}
            </button>
            <button 
              onClick={() => setOpen(false)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#b2bec3', 
                padding: 4 
              }}
            >
              <XIcon/>
            </button>
          </div>
        </div>

        {/* ===== MODEL TABS ===== */}
        <div style={{ 
          display: 'flex', 
          gap: 5, 
          padding: '7px 14px', 
          borderBottom: '1px solid #f0f0f0', 
          background: '#fafafa', 
          flexWrap: 'wrap' 
        }}>
          {Object.entries(MODELS).map(([k, m]) => {
            const hasKey = apiStatus[k];
            const isSelected = model === k;
            
            return (
              <button 
                key={k} 
                onClick={() => hasKey && setModel(k)} 
                title={hasKey ? m.hint : `⚠️ ${m.name} not available on server`}
                style={{
                  padding: '3px 11px', 
                  borderRadius: 14, 
                  fontSize: 11, 
                  fontWeight: 700,
                  border: isSelected ? `2px solid ${m.color}` : '1px solid #ddd',
                  background: isSelected ? `${m.color}12` : '#fff',
                  color: isSelected ? m.color : (hasKey ? '#999' : '#ccc'),
                  cursor: hasKey ? 'pointer' : 'not-allowed',
                  opacity: hasKey ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
                disabled={!hasKey}
              >
                {m.emoji} {m.name} {!hasKey && '🔒'}
              </button>
            );
          })}
        </div>

        {/* ===== MESSAGES ===== */}
        <div style={{
          flex: 1,
          padding: 14,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#8be3d8',
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, #fff 100%, transparent 100%),
            radial-gradient(1.5px 1.5px at 70% 60%, #fff 100%, transparent 100%),
            radial-gradient(1px 1px at 50% 80%, #fff 100%, transparent 100%)
          `,
          backgroundSize: '250px 250px',
        }}>
          {msgs.map((m, i) => (
            <div 
              key={i} 
              className="message-enter"
              style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', 
                maxWidth: '82%',
                position: 'relative',
              }}
            >
              <div style={{
                padding: '9px 13px',
                borderRadius: 14,
                fontSize: '0.88rem',
                lineHeight: 1.45,
                wordBreak: 'break-word',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                ...(m.role === 'user'
                  ? { 
                      background: '#4a90e2', 
                      color: '#fff', 
                      borderBottomRightRadius: 4,
                    }
                  : { 
                      background: '#fff', 
                      color: '#2d3436', 
                      border: '1px solid #eee', 
                      borderBottomLeftRadius: 4,
                      paddingRight: 25
                    }),
              }}>
                {m.content}
                
                {/* Copy button for assistant messages */}
                {m.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(m.content, i)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedIndex === i ? '#10A37F' : '#999',
                      padding: 4,
                      borderRadius: 4,
                      transition: 'all 0.2s',
                      opacity: 0.5,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = 0.5;
                      e.currentTarget.style.background = 'none';
                    }}
                    title="Copy to clipboard"
                  >
                    {copiedIndex === i ? <CheckIcon/> : <CopyIcon/>}
                  </button>
                )}
              </div>
              
              <div style={{ 
                fontSize: '0.65rem', 
                color: 'rgba(255,255,255,0.65)', 
                marginTop: 3, 
                paddingLeft: 3, 
                display: 'flex', 
                gap: 5 
              }}>
                {m.time} 
                {m.model && (
                  <span style={{ opacity: 0.7 }}>
                    • via {MODELS[m.model]?.emoji} {MODELS[m.model]?.name}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={{ 
                padding: '10px 18px', 
                borderRadius: 14, 
                background: '#fff', 
                border: '1px solid #eee', 
                display: 'flex', 
                gap: 5 
              }}>
                {[0, 0.15, 0.3].map((d, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      width: 7, 
                      height: 7, 
                      borderRadius: '50%', 
                      background: '#8be3d8', 
                      animation: 'cbDots 1.4s infinite ease-in-out both', 
                      animationDelay: `${d}s` 
                    }} 
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* ===== INPUT AREA ===== */}
        <div style={{ 
          padding: '12px 14px', 
          borderTop: '1px solid #eee', 
          display: 'flex', 
          gap: 8, 
          background: '#fff' 
        }}>
          <input
            type="text" 
            placeholder={isAuthenticated ? "Type your message..." : "Login to chat..."}
            value={input}
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            disabled={loading || !isAuthenticated}
            style={{ 
              flex: 1, 
              border: 'none', 
              background: '#f1f2f6', 
              padding: '9px 13px', 
              borderRadius: 10, 
              fontSize: '0.88rem', 
              outline: 'none',
              transition: 'all 0.2s',
              opacity: isAuthenticated ? 1 : 0.7,
              cursor: isAuthenticated ? 'text' : 'not-allowed'
            }}
            onFocus={e => {
              if (isAuthenticated) {
                e.target.style.background = '#e8eaf0';
              }
            }}
            onBlur={e => e.target.style.background = '#f1f2f6'}
          />
          <button 
            onClick={send} 
            disabled={!input.trim() || loading || !isAuthenticated} 
            style={{
              width: 38, 
              height: 38, 
              borderRadius: 10, 
              border: 'none', 
              background: isAuthenticated ? '#8be3d8' : '#ccc', 
              color: '#fff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: (isAuthenticated && input.trim() && !loading) ? 'pointer' : 'not-allowed',
              opacity: (isAuthenticated && input.trim() && !loading) ? 1 : 0.5, 
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (isAuthenticated && input.trim() && !loading) {
                e.target.style.background = '#7ad1c6';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={e => {
              e.target.style.background = isAuthenticated ? '#8be3d8' : '#ccc';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {isAuthenticated ? <SendIcon/> : <LockIcon/>}
          </button>
        </div>

        {/* ===== STATUS FOOTER ===== */}
        <div style={{ 
          padding: '6px 14px', 
          background: '#fafafa', 
          borderTop: '1px solid #f0f0f0', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          fontSize: 10,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* OpenAI Status */}
            {apiStatus.openai && (
              <span style={{ color: '#10A37F' }}>
                🤖 OpenAI
              </span>
            )}
            
            {/* Gemini Status */}
            {apiStatus.gemini && (
              <span style={{ color: '#4285F4' }}>
                💎 Gemini
              </span>
            )}
            
            {/* Claude Status */}
            {apiStatus.claude && (
              <span style={{ color: '#8B5CF6' }}>
                🦜 Claude
              </span>
            )}
          </div>
          
          <div>
            {!isAuthenticated ? (
              <span 
                onClick={handleOpenAuth}
                style={{ 
                  color: '#e74c3c', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Login to chat
              </span>
            ) : (
              <span style={{ color: '#38B2AC' }}>
                ⚡ Connected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;