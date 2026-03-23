/**
 * Chatbot.jsx — Enhanced version v2
 * 
 * ENHANCEMENTS (v2):
 * 1. Lazy chat creation: no chat is created when opening chatbot. Chat is created
 *    on first message send only.
 * 2. User message appears instantly (optimistic UI) before API response.
 * 3. Each chat can use multiple models — model badge shown per message.
 * 4. Copy button on ALL messages (user + assistant).
 * 5. Performance: cached API status, debounced chat load, memoized components.
 * 
 * PREVIOUS FIXES (preserved):
 * 1. Auth sync: listens to 'login-success' and 'logout' events.
 * 2. Gemini incomplete responses: increased maxOutputTokens (backend).
 * 3. Sidebar overlay in compact mode.
 * 4. AI-generated chat titles.
 * 5. Rich markdown rendering for AI responses.
 * 6. Draggable chatbot button.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import chatbotIcon from "../../assets/chatboticon.png";
import logo_s from "../../assets/logo_s.png";
import { toast } from 'react-toastify';
import api from "../../services/api";
import "./Chatbot.css";

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

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MoreDotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2"></circle>
    <circle cx="12" cy="12" r="2"></circle>
    <circle cx="19" cy="12" r="2"></circle>
  </svg>
);

const CodeCopyIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);


/* ========== MARKDOWN RENDERER ========== */

const MarkdownRenderer = memo(({ content }) => {
  const [copiedBlock, setCopiedBlock] = useState(null);

  const copyCode = useCallback((code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedBlock(index);
    setTimeout(() => setCopiedBlock(null), 2000);
  }, []);

  const rendered = useMemo(() => {
    if (!content) return null;

    const parts = content.split(/(```[\s\S]*?```)/g);
    let codeBlockIndex = 0;

    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const blockIdx = codeBlockIndex++;
        const inner = part.slice(3, -3);
        const newlinePos = inner.indexOf('\n');
        let lang = '';
        let code = inner;

        if (newlinePos !== -1) {
          const firstLine = inner.slice(0, newlinePos).trim();
          if (firstLine && firstLine.length < 30 && !/\s/.test(firstLine)) {
            lang = firstLine;
            code = inner.slice(newlinePos + 1);
          }
        }

        code = code.replace(/^\n/, '').replace(/\n$/, '');

        return (
          <div key={`code-${i}`} className="md-code-block">
            <div className="md-code-header">
              <span className="md-code-lang">{lang || 'code'}</span>
              <button
                className={`md-code-copy ${copiedBlock === blockIdx ? 'copied' : ''}`}
                onClick={() => copyCode(code, blockIdx)}
              >
                {copiedBlock === blockIdx ? (
                  <><CheckIcon /> Copied!</>
                ) : (
                  <><CodeCopyIcon /> Copy</>
                )}
              </button>
            </div>
            <pre className="md-code-content"><code>{code}</code></pre>
          </div>
        );
      }

      return <MarkdownInline key={`text-${i}`} text={part} />;
    });
  }, [content, copiedBlock, copyCode]);

  return <div className="md-rendered">{rendered}</div>;
});

const MarkdownInline = ({ text }) => {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level}`;
      elements.push(
        <Tag key={`h-${i}`} className={`md-heading md-h${level}`}>
          {parseInline(headingMatch[2])}
        </Tag>
      );
      i++; continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="md-hr" />);
      i++; continue;
    }

    if (trimmed.includes('|') && i + 1 < lines.length && /^\|?[\s\-:|]+\|?$/.test(lines[i + 1]?.trim())) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].trim().includes('|')) {
        tableLines.push(lines[j].trim());
        j++;
      }
      if (tableLines.length >= 2) {
        elements.push(renderTable(tableLines, i));
        i = j; continue;
      }
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('>')) {
        quoteLines.push(lines[j].trim().replace(/^>\s?/, ''));
        j++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="md-blockquote">
          {parseInline(quoteLines.join('\n'))}
        </blockquote>
      );
      i = j; continue;
    }

    if (/^[-*+]\s/.test(trimmed)) {
      const listItems = [];
      let j = i;
      while (j < lines.length && /^[-*+]\s/.test(lines[j].trim())) {
        listItems.push(lines[j].trim().replace(/^[-*+]\s/, ''));
        j++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="md-list md-ul">
          {listItems.map((item, idx) => (
            <li key={idx} className="md-li">{parseInline(item)}</li>
          ))}
        </ul>
      );
      i = j; continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const listItems = [];
      let j = i;
      while (j < lines.length && /^\d+[.)]\s/.test(lines[j].trim())) {
        listItems.push(lines[j].trim().replace(/^\d+[.)]\s/, ''));
        j++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="md-list md-ol">
          {listItems.map((item, idx) => (
            <li key={idx} className="md-li">{parseInline(item)}</li>
          ))}
        </ol>
      );
      i = j; continue;
    }

    const paraLines = [];
    let j = i;
    while (j < lines.length) {
      const l = lines[j].trim();
      if (!l || /^#{1,6}\s/.test(l) || /^[-*+]\s/.test(l) || /^\d+[.)]\s/.test(l) 
          || l.startsWith('>') || /^(-{3,}|_{3,}|\*{3,})$/.test(l)
          || (l.includes('|') && j + 1 < lines.length && /^\|?[\s\-:|]+\|?$/.test(lines[j + 1]?.trim()))) {
        break;
      }
      paraLines.push(lines[j]);
      j++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="md-paragraph">
          {parseInline(paraLines.join('\n'))}
        </p>
      );
    }
    i = j === i ? i + 1 : j;
  }

  return <>{elements}</>;
};

function parseInline(text) {
  if (!text) return text;

  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((segment, i) => {
    if (segment.startsWith('`') && segment.endsWith('`') && segment.length > 1) {
      return <code key={i} className="md-inline-code">{segment.slice(1, -1)}</code>;
    }

    let result = segment;
    const tokens = [];
    const regex = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|~~.+?~~|\[.+?\]\(.+?\)|\n)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(result)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: result.slice(lastIndex, match.index) });
      }

      const m = match[0];
      if (m === '\n') {
        tokens.push({ type: 'br' });
      } else if (m.startsWith('***') && m.endsWith('***')) {
        tokens.push({ type: 'bolditalic', value: m.slice(3, -3) });
      } else if (m.startsWith('**') && m.endsWith('**')) {
        tokens.push({ type: 'bold', value: m.slice(2, -2) });
      } else if (m.startsWith('*') && m.endsWith('*')) {
        tokens.push({ type: 'italic', value: m.slice(1, -1) });
      } else if (m.startsWith('~~') && m.endsWith('~~')) {
        tokens.push({ type: 'strike', value: m.slice(2, -2) });
      } else if (m.startsWith('[')) {
        const linkMatch = m.match(/\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
          tokens.push({ type: 'link', text: linkMatch[1], href: linkMatch[2] });
        }
      }
      lastIndex = match.index + m.length;
    }

    if (lastIndex < result.length) {
      tokens.push({ type: 'text', value: result.slice(lastIndex) });
    }

    if (tokens.length === 0) {
      return <React.Fragment key={i}>{result}</React.Fragment>;
    }

    return (
      <React.Fragment key={i}>
        {tokens.map((token, j) => {
          switch (token.type) {
            case 'bold':
              return <strong key={j} className="md-bold">{token.value}</strong>;
            case 'italic':
              return <em key={j} className="md-italic">{token.value}</em>;
            case 'bolditalic':
              return <strong key={j} className="md-bold"><em className="md-italic">{token.value}</em></strong>;
            case 'strike':
              return <del key={j} className="md-strike">{token.value}</del>;
            case 'link':
              return (
                <a key={j} href={token.href} target="_blank" rel="noopener noreferrer" className="md-link">
                  {token.text}
                </a>
              );
            case 'br':
              return <br key={j} />;
            default:
              return <React.Fragment key={j}>{token.value}</React.Fragment>;
          }
        })}
      </React.Fragment>
    );
  });
}

function renderTable(tableLines, keyPrefix) {
  const parseRow = (line) =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

  const headers = parseRow(tableLines[0]);
  const rows = tableLines.slice(2).map(parseRow);

  return (
    <div key={`table-${keyPrefix}`} className="md-table-wrapper">
      <table className="md-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="md-th">{parseInline(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="md-td">{parseInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


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
  openai: { 
    name: 'OpenAI', 
    emoji: '⚡', 
    color: '#10A37F', 
    hint: 'OpenAI GPT-4o Mini',
    needsKey: true
  },
};

/* ========== WELCOME MESSAGE (shown locally, never sent to backend) ========== */
const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your NeuroSpark Assistant 😊 How can I help you today?",
  time: '',
  isWelcome: true,
};

/* ========== MEMOIZED MESSAGE BUBBLE ========== */
const MessageBubble = memo(({ message, index, copiedIndex, onCopy }) => {
  return (
    <div className={`message-wrapper ${message.role}`}>
      <div className={`message-bubble ${message.role}${message.isStreaming ? ' streaming' : ''}`}>
        {message.role === 'assistant' ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          message.content
        )}
        
        {/* Copy button for ALL messages */}
        <button
          onClick={() => onCopy(message.content, index)}
          className={`copy-btn ${message.role === 'user' ? 'copy-btn-user' : ''} ${copiedIndex === index ? 'copied' : ''}`}
          title="Copy to clipboard"
        >
          {copiedIndex === index ? <CheckIcon/> : <CopyIcon/>}
        </button>
      </div>
      
      <div className="message-meta">
        {message.time} 
        {message.model && (
          <span className="model-badge" style={{ color: MODELS[message.model]?.color || '#666' }}>
            • {MODELS[message.model]?.emoji} {MODELS[message.model]?.name}
          </span>
        )}
      </div>
    </div>
  );
});

/* ========== MAIN CHATBOT COMPONENT ========== */
const Chatbot = ({ isAuthenticated: propIsAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const menuRef = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const thinkingTimerRef = useRef(null);
  const [model, setModel] = useState('gemini');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated || false);
  const [authChecked, setAuthChecked] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  /* ===== Draggable button state ===== */
  const [btnPos, setBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem('chatbot-btn-pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { right: 30, bottom: 30 };
  });
  const [btnDragging, setBtnDragging] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ right: 30, bottom: 30 });
  const hasMoved = useRef(false);

  const hasInitialized = useRef(false);
  const apiStatusCache = useRef({ data: null, timestamp: 0 });
  const skipNextLoad = useRef(false); // Skip message reload after inline chat creation
  
  const endRef = useRef(null);

  // Sync internal isAuthenticated with prop
  useEffect(() => {
    if (propIsAuthenticated !== undefined) {
      setIsAuthenticated(propIsAuthenticated);
    }
  }, [propIsAuthenticated]);

  // Listen to login-success and logout events
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
    setAuthChecked(true);

    const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      apiStatusCache.current = { data: null, timestamp: 0 };
    };

    const handleLogout = () => {
      setIsAuthenticated(false);
      setChats([]);
      setCurrentChatId(null);
      setMessages([WELCOME_MESSAGE]);
      setCurrentChat(null);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener('login-success', handleLoginSuccess);
    window.addEventListener('logout', handleLogout);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('login-success', handleLoginSuccess);
      window.removeEventListener('logout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, []);

  // When chatbot opens: load chats + check API status. NO auto-create chat.
  useEffect(() => {
    if (isAuthenticated && open) {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        loadChats(false);
        checkApiKeyStatus();
        // Start fresh with just the welcome message — no backend call
        setCurrentChatId(null);
        setCurrentChat(null);
        setMessages([WELCOME_MESSAGE]);
      }
    }
  }, [isAuthenticated, open]);

  // Reset initialization flag when chatbot closes
  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
    }
  }, [open]);

  // Load current chat messages when chat changes (only for existing chats from sidebar)
  useEffect(() => {
    if (currentChatId && isAuthenticated) {
      // Skip if we just created this chat inline (messages already in state)
      if (skipNextLoad.current) {
        skipNextLoad.current = false;
        return;
      }
      loadChatMessages(currentChatId);
    }
  }, [currentChatId, isAuthenticated]);

  // Auto-scroll
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Close sidebar when leaving full mode
  useEffect(() => {
    if (!full) {
      setShowSidebar(false);
    }
  }, [full]);

  /* ===== DRAGGABLE BUTTON LOGIC ===== */
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
        setBtnDragging(true);
      }

      const newRight = Math.max(5, Math.min(window.innerWidth - 70, dragStartPos.current.right - dx));
      const newBottom = Math.max(5, Math.min(window.innerHeight - 70, dragStartPos.current.bottom - dy));

      setBtnPos({ right: newRight, bottom: newBottom });
    };

    const handleUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setBtnDragging(false);
        document.body.style.userSelect = '';
        setBtnPos(prev => {
          try { localStorage.setItem('chatbot-btn-pos', JSON.stringify(prev)); } catch {}
          return prev;
        });
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const handleBtnMouseDown = (e) => {
    if (e.type === 'mousedown') e.preventDefault();
    isDragging.current = true;
    hasMoved.current = false;
    document.body.style.userSelect = 'none';
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
    dragStartPos.current = { ...btnPos };
  };

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenChatId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadChats = useCallback(async (autoSelect = false) => {
    setChatsLoading(true);
    try {
      const response = await api.getChats();
      setChats(response.chats || []);
      
      if (autoSelect && response.chats?.length > 0 && !currentChatId) {
        setCurrentChatId(response.chats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setChatsLoading(false);
    }
  }, [currentChatId]);

  const loadChatMessages = useCallback(async (chatId) => {
    setMessagesLoading(true);
    try {
      const response = await api.getChatMessages(chatId);
      setMessages(response.messages || []);
      setCurrentChat(response.chat);
      // Don't override model — allow user to switch model mid-chat
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Start a new blank chat (no backend call)
  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
    setCurrentChat(null);
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    if (window.innerWidth < 768) setShowSidebar(false);
  }, []);

  const deleteChat = useCallback(async (chatId) => {
    try {
      await api.deleteChat(chatId);
      const newChats = chats.filter(c => c.id !== chatId);
      setChats(newChats);
      
      if (currentChatId === chatId) {
        if (newChats.length > 0) {
          setCurrentChatId(newChats[0].id);
        } else {
          startNewChat();
        }
      }
      
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  }, [chats, currentChatId, startNewChat]);

  const renameChat = useCallback(async (chatId, newTitle) => {
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
  }, []);

  // Cached API status check (reuse for 60s)
  const checkApiKeyStatus = useCallback(async () => {
    const now = Date.now();
    if (apiStatusCache.current.data && (now - apiStatusCache.current.timestamp) < 60000) {
      setApiStatus(apiStatusCache.current.data);
      return;
    }

    try {
      const data = await api.get('/chatbot/status');
      setApiStatus(data);
      apiStatusCache.current = { data, timestamp: now };
    } catch (error) {
      console.error('Error checking API status:', error);
      setApiStatus({
        github: false,
        openai: false,
        gemini: false,
      });
    }
  }, []);

  const timeStr = useCallback(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const copyToClipboard = useCallback((text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  const handleOpenAuth = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  }, []);

  // ========== STREAMING SEND (word-by-word for ChatGPT) ==========
  const sendStreaming = useCallback(async (messageContent, chatId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

    const response = await fetch(`${API_BASE}/chatbot/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: messageContent,
        model: model,
        ...(chatId ? { chat_id: chatId } : {}),
      }),
    });

    if (!response.ok) throw new Error('Stream request failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';
    let newChatId = chatId;

    // Add empty assistant message that we'll update
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      time: timeStr(),
      model: model,
      isStreaming: true,
    }]);

    // Stop the thinking indicator
    clearInterval(thinkingTimerRef.current);
    thinkingTimerRef.current = null;
    setThinkingSeconds(0);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const jsonStr = line.slice(6); // Remove "data: "
        try {
          const data = JSON.parse(jsonStr);

          if (data.done) {
            newChatId = data.chat_id || newChatId;
            break;
          }

          if (data.chunk) {
            fullReply += data.chunk;
            // Update the last message in real-time
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.isStreaming) {
                updated[updated.length - 1] = {
                  ...last,
                  content: fullReply,
                };
              }
              return updated;
            });
          }

          if (data.error) {
            throw new Error(data.error);
          }
        } catch (e) {
          if (e.message === 'Stream failed') throw e;
          // JSON parse errors on partial chunks are normal, skip
        }
      }
    }

    // Finalize the streaming message
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.isStreaming) {
        updated[updated.length - 1] = {
          ...last,
          content: fullReply || "I'm having trouble connecting. Please try again! 😊",
          isStreaming: false,
        };
      }
      return updated;
    });

    return { reply: fullReply, chat_id: newChatId, model_used: model };
  }, [model, timeStr]);

  // ========== REGULAR SEND (non-streaming, for Gemini) ==========
  const sendToBackend = useCallback(async (messageContent, chatId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const payload = {
        message: messageContent,
        model: model
      };

      if (chatId) {
        payload.chat_id = chatId;
      }

      const response = await api.sendChatMessage(payload);
      return response;
    } catch (error) {
      console.error('Backend chat error:', error);
      
      if (error.data && error.data.model_used) {
        const modelName = MODELS[error.data.model_used]?.name || error.data.model_used;
        toast.error(`${modelName} is currently unavailable. Please try another model.`);
      } else if (error.message && error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please check if the backend is running.');
      } else {
        toast.error(error.message || 'Failed to get response');
      }
      
      throw error;
    }
  }, [model]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }

    const messageContent = input.trim();
    const now = timeStr();
    
    // Optimistic: show user message immediately
    const userMsg = { 
      role: 'user', 
      content: messageContent,
      time: now,
    };
    
    setMessages(prev => {
      const filtered = prev.filter(m => !m.isWelcome);
      return [...filtered, userMsg];
    });
    setInput('');
    setLoading(true);
    setThinkingSeconds(0);
    thinkingTimerRef.current = setInterval(() => {
      setThinkingSeconds(prev => prev + 1);
    }, 1000);

    try {
      let response;

      // Use streaming for ChatGPT (github/openai), regular for Gemini
      if (model === 'github' || model === 'openai') {
        response = await sendStreaming(messageContent, currentChatId);
      } else {
        response = await sendToBackend(messageContent, currentChatId);
        
        const assistantMsg = { 
          role: 'assistant', 
          content: response.reply, 
          time: timeStr(), 
          model: response.model_used 
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      // If this was a new chat, update state
      if (!currentChatId && response.chat_id) {
        skipNextLoad.current = true;
        setCurrentChatId(response.chat_id);
        setCurrentChat({ id: response.chat_id, title: 'New Chat', model: model });
      }

      // Reload chats list to get updated titles
      setTimeout(() => loadChats(false), 800);

    } catch (error) {
      const isTimeout = error.message && (error.message.includes('timed out') || error.message.includes('cURL error 28'));
      const modelName = MODELS[model]?.name || model;
      let errorContent;
      
      if (isTimeout) {
        errorContent = `⏱️ ${modelName} took too long to respond. Try simplifying your question or switching to another model.`;
      } else if (error.message && error.message.includes('unavailable')) {
        errorContent = `${modelName} is currently unavailable. Please try a different model.`;
      } else {
        errorContent = "I'm having trouble connecting. Please try again! 😊";
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorContent, 
        time: timeStr() 
      }]);
    } finally {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
      setThinkingSeconds(0);
      setLoading(false);
    }
  }, [input, loading, isAuthenticated, currentChatId, model, handleOpenAuth, sendToBackend, sendStreaming, timeStr, loadChats]);

  const handleOpenChatbot = useCallback(() => {
    if (hasMoved.current) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const currentlyAuthenticated = !!token;
    setIsAuthenticated(currentlyAuthenticated);

    if (!currentlyAuthenticated) {
      toast.info('Please sign in to chat with NeuroSpark Assistant!');
      handleOpenAuth();
    } else {
      setOpen(true);
    }
  }, [handleOpenAuth]);

  const clearConversation = useCallback(() => {
    if (!isAuthenticated) {
      toast.warning('Please login to use the chatbot');
      handleOpenAuth();
      return;
    }
    startNewChat();
  }, [isAuthenticated, handleOpenAuth, startNewChat]);

  // Filtered chats for search (memoized)
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  /* ========== RENDER CHATBOT BUTTON (Draggable) ========== */
  if (!open) {
    return (
      <button 
        onMouseDown={handleBtnMouseDown}
        onTouchStart={handleBtnMouseDown}
        onClick={handleOpenChatbot} 
        aria-label="Open Chatbot" 
        className={`chatbot-button ${isAuthenticated ? 'authenticated' : ''} ${btnDragging ? 'dragging' : ''}`}
        style={{
          right: btnPos.right,
          bottom: btnPos.bottom,
          left: 'auto',
          top: 'auto',
        }}
      >
        <img src={chatbotIcon} alt="Chat" draggable={false} />
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
        className={`chatbot-modal ${full ? 'full' : 'compact'}`}
        style={boxStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Stars background effect */}
        <div className="chatbot-stars-bg" />
        
        {/* Sidebar */}
        <div className={`chatbot-sidebar ${showSidebar ? 'open' : 'closed'} ${full ? 'sidebar-inline' : 'sidebar-overlay'}`}>
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
                onClick={startNewChat}
                className="new-chat-btn"
              >
                <PlusIcon /> New Chat
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
              {chatsLoading ? (
                <div className="chat-list-loading">
                  <div className="typing-dot" style={{ animationDelay: '0s' }} />
                  <div className="typing-dot" style={{ animationDelay: '0.15s' }} />
                  <div className="typing-dot" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="chat-list-empty">
                  {searchQuery ? 'No chats match your search' : 'No chat history yet'}
                </div>
              ) : (
                filteredChats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (editingChatId !== c.id) {
                        setCurrentChatId(c.id);
                        setMenuOpenChatId(null);
                        if (!full || window.innerWidth < 768) setShowSidebar(false);
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
                          if (e.key === 'Escape') {
                            setEditingChatId(null);
                          }
                        }}
                        className="chat-edit-input"
                      />
                    ) : (
                      <>
                        <div className="chat-item-title" title={c.title}>
                          {c.title}
                        </div>
                        <div className="chat-item-more-wrapper" ref={menuOpenChatId === c.id ? menuRef : null}>
                          <button
                            className="chat-item-more-btn"
                            title="Options"
                            onClick={e => {
                              e.stopPropagation();
                              setMenuOpenChatId(prev => prev === c.id ? null : c.id);
                            }}
                          >
                            <MoreDotsIcon />
                          </button>
                          {menuOpenChatId === c.id && (
                            <div className="chat-item-dropdown">
                              <button
                                className="chat-dropdown-option"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingChatId(c.id);
                                  setEditTitle(c.title);
                                  setMenuOpenChatId(null);
                                }}
                              >
                                <EditIcon /> Rename
                              </button>
                              <button
                                className="chat-dropdown-option delete"
                                onClick={e => {
                                  e.stopPropagation();
                                  setMenuOpenChatId(null);
                                  deleteChat(c.id);
                                }}
                              >
                                <TrashIcon /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Overlay backdrop for compact sidebar */}
        {showSidebar && !full && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setShowSidebar(false)} 
          />
        )}

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
              <button
                onClick={startNewChat}
                className="menu-toggle"
                title="New Chat"
              >
                <PlusIcon />
              </button>
            </div>

            <div className="header-logo">
              <img src={logo_s} alt="Logo" />
              <div className="status-dot" />
            </div>

            <div className="header-actions">
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
          <div className="model-selector-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Model:</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="model-select"
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
            {messagesLoading ? (
              <div className="messages-loading">
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
            ) : (
              messages.map((m, i) => (
                <MessageBubble 
                  key={m.id || `msg-${i}`} 
                  message={m} 
                  index={i} 
                  copiedIndex={copiedIndex}
                  onCopy={copyToClipboard}
                />
              ))
            )}
            
            {/* Loading indicator — enhanced thinking display */}
            {loading && (
              <div className="thinking-container" style={{ alignSelf: 'flex-start' }}>
                <div className="thinking-indicator">
                  <div className="thinking-dots">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div 
                        key={i} 
                        className="typing-dot"
                        style={{ animationDelay: `${d}s` }} 
                      />
                    ))}
                  </div>
                  <span className="thinking-text">
                    {MODELS[model]?.emoji} {MODELS[model]?.name || model} is thinking
                    {thinkingSeconds > 0 && <span className="thinking-timer"> ({thinkingSeconds}s)</span>}
                  </span>
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
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} 
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