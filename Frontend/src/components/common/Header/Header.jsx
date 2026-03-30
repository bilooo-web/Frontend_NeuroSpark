// Header.jsx
import './Header.css';
import logo_s from '../../../assets/logo_s.png';
import profileImage from '../../../assets/profile_h.png';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function Header({ totalCoins }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [animate, setAnimate] = useState(false);
  const validated = useRef(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const readCoins = () => { const v = parseInt(localStorage.getItem('totalCoins') || '0', 10); return isNaN(v) ? 0 : v; };

  const clearAll = useCallback(() => {
    ['token','user','totalCoins',
     ...['path-change','padlocks','faces-and-names','pair-of-cards','painting','colored-words',
         'word-search','cars-on-the-road','handwriting-enhancement','one-line','find-the-ball',
         'rearranging-blocks','puzzles'].flatMap(s => [`${s}-last`,`${s}-best`])
    ].forEach(k => localStorage.removeItem(k));
    setUser(null); setCoins(0); setNotifications([]); setUnreadCount(0);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token'); const raw = localStorage.getItem('user');
      if (!token || !raw) { clearAll(); return; }
      try { const p = JSON.parse(raw); setUser(p); if (p.role === 'child') setCoins(readCoins()); } catch { clearAll(); return; }
      if (!validated.current) { validated.current = true;
        try { const r = await fetch(`${API}/me`, { headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } }); if (r.status===401||!r.ok) { clearAll(); return; } const d = await r.json(); if (d.user) { localStorage.setItem('user', JSON.stringify(d.user)); setUser(d.user); } } catch {} }
    }; init();
  }, [clearAll]);

  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem('user');
      if (raw) {
        try { setUser(JSON.parse(raw)); } catch { setUser(null); }
      } else {
        setUser(null); setCoins(0);
      }
    };
    const handleLogoutEvent = () => {
      setUser(null);
      setCoins(0);
      setNotifications([]);
      setUnreadCount(0);
      validated.current = false;
    };
    window.addEventListener('login-success', check);
    window.addEventListener('storage', check);
    window.addEventListener('logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('login-success', check);
      window.removeEventListener('storage', check);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);

  useEffect(() => { const sync = async () => { const token = localStorage.getItem('token'); const u = JSON.parse(localStorage.getItem('user') || '{}'); if (!token || u.role !== 'child') { if (u.role !== 'child') setCoins(0); return; } try { const r = await fetch(`${API}/child/profile`, { headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } }); if (!r.ok) return; const d = await r.json(); if (d?.stats?.total_coins != null) { localStorage.setItem('totalCoins', String(d.stats.total_coins)); setCoins(d.stats.total_coins); } } catch { setCoins(readCoins()); } }; setCoins(readCoins()); window.addEventListener('login-success', sync); return () => window.removeEventListener('login-success', sync); }, []);

  useEffect(() => { if (typeof totalCoins === 'number' && !isNaN(totalCoins)) { setCoins(totalCoins); localStorage.setItem('totalCoins', String(totalCoins)); return; } setCoins(readCoins()); }, [totalCoins]);

  useEffect(() => { const onU = e => { if (e.detail?.totalCoins != null) { const t = Number(e.detail.totalCoins); localStorage.setItem('totalCoins', String(t)); setCoins(t); } setAnimate(true); setTimeout(() => setAnimate(false), 1200); }; const onS = () => setCoins(readCoins()); window.addEventListener('coins-updated', onU); window.addEventListener('coins-synced', onS); return () => { window.removeEventListener('coins-updated', onU); window.removeEventListener('coins-synced', onS); }; }, []);

  /* ─── Notifications ─── */
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token'); if (!token || !user) return;
    try {
      const r = await fetch(`${API}/notifications`, { headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } });
      if (!r.ok) return; const d = await r.json();
      const list = d.notifications || [];
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(typeof d.unread_count === 'number' ? d.unread_count : list.filter(n => !n.is_read).length);
    } catch {}
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { if (!user) return; const iv = setInterval(fetchNotifications, 30000); return () => clearInterval(iv); }, [user, fetchNotifications]);

  const markRead = async (id) => {
    const token = localStorage.getItem('token'); if (!token) return;
    try { await fetch(`${API}/notifications/${id}/read`, { method:'POST', headers: { Authorization:`Bearer ${token}`, Accept:'application/json', 'Content-Type':'application/json' } }); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const openDetail = (notif) => { if (!notif.is_read) markRead(notif.id); setSelectedNotif({ ...notif, is_read: true }); };

  const dismissNotif = async (id, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token'); if (!token) return;
    const was = notifications.find(n => n.id === id);
    try { await fetch(`${API}/notifications/${id}`, { method:'DELETE', headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } }); } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
    if (was && !was.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => { const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) { setShowNotifPanel(false); setSelectedNotif(null); } }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  // Guarded navigate — dispatches a cancellable event so GameSwitcher can intercept
  const guardedNavigate = useCallback((path) => {
    const event = new CustomEvent('header-navigate', { detail: { path }, cancelable: true });
    const cancelled = !window.dispatchEvent(event);
    if (!cancelled) {
      navigate(path);
    }
  }, [navigate]);

  const openSignIn = () => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  const handleLogout = () => {
    const event = new CustomEvent('header-navigate', { detail: { path: '/', isLogout: true }, cancelable: true });
    const cancelled = !window.dispatchEvent(event);
    if (cancelled) return; // Game is active, popup will show
    const token = localStorage.getItem('token');
    if (token) fetch(`${API}/logout`, { method:'POST', headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } }).catch(() => {});
    clearAll(); validated.current = false; window.dispatchEvent(new CustomEvent('logout')); navigate('/');
  };
  const goToDashboard = () => {
    if (user?.role === 'admin') guardedNavigate('/admin');
    else if (user?.role === 'guardian') guardedNavigate('/guardian/dashboard');
    else if (user?.role === 'child') guardedNavigate('/child-dashboard');
  };
  const isHomeActive = () => location.pathname === '/' || location.pathname === '/home';

  const tColors = { success:'#10b981', warning:'#f59e0b', alert:'#ef4444', info:'#3b82f6' };
  const tIcons = { success:'✅', warning:'⚠️', alert:'🔴', info:'💬' };
  const fmtD = d => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/home')}><img src={logo_s} alt="NeuroSpark" /></div>
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/home" className={isHomeActive() ? 'active' : ''} end onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
          <NavLink to="/challenges" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Challenges</NavLink>
          <NavLink to="/spark-city" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Spark City</NavLink>
          <NavLink to="/customization" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Customization</NavLink>
          <NavLink to="/homework" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Homework</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>About Us</NavLink>
        </nav>
        <div className="header-right">
          {user ? (<>
            {user.role === 'child' && (
              <button className={`header-btn ${animate ? 'coin-pop' : ''}`}
                style={animate ? { animation:'coinBounce 0.8s cubic-bezier(0.34,1.56,0.64,1)', background:'linear-gradient(135deg,#FFD700,#FFA500)', color:'#fff', borderColor:'#FFD700' } : {}}>
                🪙 {coins.toLocaleString()}
              </button>
            )}
            {animate && <style>{`@keyframes coinBounce{0%{transform:scale(1)}20%{transform:scale(1.3)}50%{transform:scale(0.9)}70%{transform:scale(1.1)}100%{transform:scale(1)}}`}</style>}

            {/* ─── Notification Bell ─── */}
            <div className="notif-wrapper" ref={notifRef}>
              <button className="notif-bell-btn" onClick={() => { setShowNotifPanel(p => !p); setSelectedNotif(null); }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {showNotifPanel && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    {selectedNotif
                      ? <button onClick={() => setSelectedNotif(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#38B2AC', fontWeight:700 }}>← Back</button>
                      : <h4 style={{ margin:0 }}>Notifications</h4>}
                    {!selectedNotif && unreadCount > 0 && <span className="notif-unread-badge">{unreadCount} new</span>}
                  </div>
                  <div className="notif-panel-body">
                    {selectedNotif ? (
                      <div style={{ padding:20 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                          <div style={{ width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, background:`${tColors[selectedNotif.type]||'#3b82f6'}15`, color:tColors[selectedNotif.type]||'#3b82f6', flexShrink:0 }}>
                            {tIcons[selectedNotif.type]||'💬'}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:16, color:'#1a1a1a' }}>{selectedNotif.title}</div>
                            <div style={{ fontSize:11, color:'#999', marginTop:2 }}>{fmtD(selectedNotif.created_at)}{selectedNotif.sender_name ? ` • ${selectedNotif.sender_name}` : ''}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:14, color:'#333', lineHeight:1.7, padding:'14px 0', borderTop:'1px solid #f0f0f0', whiteSpace:'pre-wrap', minHeight:60 }}>
                          {selectedNotif.message}
                        </div>
                        {selectedNotif.is_broadcast && (
                          <div style={{ fontSize:11, color:'#888', marginTop:8, padding:'6px 12px', background:'#f8f8f8', borderRadius:8, display:'inline-block' }}>
                            📢 Sent to {selectedNotif.target_role === 'all' ? 'everyone' : `${selectedNotif.target_role}s`}
                          </div>
                        )}
                        <button onClick={() => dismissNotif(selectedNotif.id)}
                          style={{ marginTop:18, width:'100%', padding:10, borderRadius:10, border:'1px solid #fee2e2', background:'#fff', color:'#ef4444', fontWeight:600, fontSize:13, cursor:'pointer', transition:'background 0.2s' }}
                          onMouseEnter={e => e.target.style.background='#fef2f2'} onMouseLeave={e => e.target.style.background='#fff'}>
                          🗑️ Dismiss
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notif-empty"><span style={{ fontSize:36 }}>🔔</span><p>No notifications yet</p></div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => openDetail(n)}>
                        <div className="notif-item-icon" style={{ background:`${tColors[n.type]||'#3b82f6'}18`, color:tColors[n.type]||'#3b82f6' }}>{tIcons[n.type]||'💬'}</div>
                        <div className="notif-item-content">
                          <div className="notif-item-title">{n.title}</div>
                          <div className="notif-item-msg">{n.message}</div>
                          <div className="notif-item-time">{fmtD(n.created_at)}</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                          {!n.is_read && <div className="notif-dot" />}
                          <button onClick={e => dismissNotif(n.id, e)} title="Dismiss"
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:13, padding:2, lineHeight:1, transition:'color 0.15s' }}
                            onMouseEnter={e => e.target.style.color='#ef4444'} onMouseLeave={e => e.target.style.color='#ccc'}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-container" onClick={goToDashboard}>
              <img src={profileImage} alt="Profile" className="profile-img" style={{ cursor:'pointer' }} />
              <span className="profile-name">{user.full_name}</span>
            </div>
            <button className="logout-btn-small" onClick={handleLogout}>Logout</button>
          </>) : (
            <button className="header-btn signin" onClick={openSignIn}>Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;