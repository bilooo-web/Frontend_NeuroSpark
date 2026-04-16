import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Search, X, User, Gamepad2, Mic, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── Debounce hook ─────────────────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const Header = () => {
  const { user } = useApp();
  const navigate  = useNavigate();

  const fullName    = user?.full_name || user?.name || '';
  const initials    = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleLabel   = user?.guardian?.guardian_type || user?.guardian_type || user?.role || '';
  const displayRole = roleLabel ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) : '';

  // ── Search ────────────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef  = useRef(null);
  const debouncedQ = useDebounce(query, 300);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications,     setNotifications]     = useState([]);
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotif,      setLoadingNotif]      = useState(false);
  const notifRef = useRef(null);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [profilePhoto,    setProfilePhoto]    = useState(() => localStorage.getItem('profilePhoto') || null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef   = useRef(null);
  const fileInputRef = useRef(null);

  // ── Close all dropdowns on outside click ──────────────────────────────────
  useEffect(() => {
    const handle = e => {
      if (searchRef.current  && !searchRef.current.contains(e.target))  setShowResults(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Run search when debounced query changes ───────────────────────────────
  useEffect(() => {
    if (!debouncedQ.trim() || debouncedQ.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    runSearch(debouncedQ.trim().toLowerCase());
  }, [debouncedQ]);

  const runSearch = async (q) => {
    setSearching(true);
    setShowResults(true);
    try {
      const res = await api.get('/guardian/dashboard/full').catch(() => null);
      const children = res?.children || res?.data?.children || [];
      const found = [];

      children.forEach(child => {
        const childName = child.name || child.user?.full_name || '';

        // Patient name match
        if (childName.toLowerCase().includes(q)) {
          found.push({
            type:     'patient',
            id:       `p-${child.id}`,
            title:    childName,
            subtitle: `Age ${child.age || '?'} · ${child.games_played || 0} game sessions · ${child.voice_attempts || 0} voice attempts`,
            url:      `/guardian/children/${child.id}`,
          });
        }

        // Game sessions match
        (child.sessions || []).forEach(s => {
          const gameName = s.game?.name || s.game?.game_slug || '';
          const date     = s.played_at ? new Date(s.played_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
          const score    = String(s.score ?? '');
          if (gameName.toLowerCase().includes(q) || date.toLowerCase().includes(q) || score.includes(q)) {
            found.push({
              type:     'session',
              id:       `s-${s.id}`,
              title:    gameName || 'Game Session',
              subtitle: `${childName} · Score ${s.score ?? '—'}% · ${date}`,
              url:      `/guardian/children/${child.id}?tab=games`,
            });
          }
        });

        // Voice attempts match
        (child.voice_attempts_detail || []).forEach(v => {
          const title    = v.voice_instruction?.title || '';
          const date     = v.created_at ? new Date(v.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
          const accuracy = String(v.accuracy_score ?? '');
          if (title.toLowerCase().includes(q) || date.toLowerCase().includes(q) || accuracy.includes(q)) {
            found.push({
              type:     'voice',
              id:       `v-${v.id}`,
              title:    title || 'Voice Session',
              subtitle: `${childName} · Accuracy ${v.accuracy_score ?? '—'}% · ${date}`,
              url:      `/guardian/children/${child.id}?tab=voice`,
            });
          }
        });
      });

      // Deduplicate + cap at 8
      const seen   = new Set();
      const unique = found.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }).slice(0, 8);
      setResults(unique);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (url) => {
    setQuery(''); setResults([]); setShowResults(false);
    navigate(url);
  };

  const clearSearch = () => { setQuery(''); setResults([]); setShowResults(false); };

  // ── Notifications ─────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotif(true);
    try {
      const res = await api.get('/notifications').catch(() => null);
      if (res?.notifications && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count ?? res.notifications.filter(n => !n.is_read).length);
      }
    } catch { /* silent */ }
    finally { setLoadingNotif(false); }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 60000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    const syncPhoto = () => setProfilePhoto(localStorage.getItem('profilePhoto') || null);
    window.addEventListener('storage', syncPhoto);
    return () => window.removeEventListener('storage', syncPhoto);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => api.post(`/notifications/${n.id}/read`).catch(() => null)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await api.post(`/notifications/${id}/read`).catch(() => null);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      setProfilePhoto(url);
      localStorage.setItem('profilePhoto', url);
    };
    reader.readAsDataURL(file);
  };

  // ── Search result helpers ─────────────────────────────────────────────────
  const typeIcon = type => {
    if (type === 'patient') return <User     size={14} style={{ color:'#137a76' }} />;
    if (type === 'session') return <Gamepad2 size={14} style={{ color:'#22C55E' }} />;
    if (type === 'voice')   return <Mic      size={14} style={{ color:'#3B82F6' }} />;
  };
  const typeBg    = type => type === 'voice' ? '#EFF6FF' : '#F0FDF4';
  const typeLabel = type => type === 'patient' ? 'Patient' : type === 'session' ? 'Game' : 'Voice';

  return (
    <header className="ptd-header">
      <div className="ptd-header-left">
        <h1 className="ptd-header-title">Dashboard</h1>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div ref={searchRef} style={{ position:'relative' }}>
          <div className="ptd-header-search">
            <Search size={18} style={{ color: searching ? '#137a76' : undefined, flexShrink:0 }} />
            <input
              type="text"
              placeholder="Search patients, sessions, voice…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowResults(true); }}
              style={{ outline:'none', background:'none', border:'none', width:'100%', fontSize:14, fontFamily:'inherit' }}
            />
            {query && (
              <button onClick={clearSearch} style={{ background:'none', border:'none', cursor:'pointer', color:'#8B8FA3', display:'flex', padding:0, flexShrink:0 }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {showResults && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:2000, background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.15)', width:420, maxHeight:380, overflow:'hidden', border:'1px solid rgba(0,0,0,.08)' }}>

              {/* Dropdown header */}
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#8B8FA3', fontWeight:600 }}>
                  {searching ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
                </span>
                {searching && (
                  <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #E8EAF0', borderTopColor:'#137a76', animation:'spin 0.7s linear infinite' }} />
                )}
              </div>

              {/* Results */}
              <div style={{ overflowY:'auto', maxHeight:320 }}>
                {!searching && results.length === 0 && (
                  <div style={{ padding:'28px 16px', textAlign:'center', color:'#8B8FA3', fontSize:13 }}>
                    <Search size={28} style={{ opacity:.3, marginBottom:8, display:'block', margin:'0 auto 8px' }} />
                    <div>No results found for "{query}"</div>
                    <div style={{ fontSize:11, marginTop:4 }}>Try a patient name, game name, or date</div>
                  </div>
                )}

                {results.map(r => (
                  <div key={r.id}
                    onClick={() => handleResultClick(r.url)}
                    style={{ padding:'10px 14px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width:30, height:30, borderRadius:8, background:typeBg(r.type), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {typeIcon(r.type)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0F3D3A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                      <div style={{ fontSize:11, color:'#8B8FA3', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.subtitle}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:'#137a76', background:'#F0FDF4', borderRadius:20, padding:'2px 7px' }}>{typeLabel(r.type)}</span>
                      <ChevronRight size={13} style={{ color:'#CBD5E1' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ptd-header-right">

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <div ref={notifRef} style={{ position:'relative' }}>
          <button className="ptd-header-icon-btn" onClick={() => setShowNotifications(v => !v)} style={{ position:'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{ position:'absolute', top:2, right:2, background:'#ef4444', color:'#fff', borderRadius:'50%', fontSize:10, fontWeight:700, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{ position:'absolute', top:'110%', right:0, zIndex:1000, background:'#fff', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,.15)', width:320, maxHeight:400, overflow:'hidden', border:'1px solid rgba(0,0,0,.08)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #f0f0f0' }}>
                <span style={{ fontWeight:700, fontSize:15 }}>Notifications</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize:12, color:'#7c3aed', background:'none', border:'none', cursor:'pointer' }}>Mark all read</button>}
                  <button onClick={() => setShowNotifications(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#999' }}><X size={16}/></button>
                </div>
              </div>
              <div style={{ overflowY:'auto', maxHeight:320 }}>
                {loadingNotif ? (
                  <div style={{ padding:20, textAlign:'center', color:'#999', fontSize:14 }}>Loading…</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding:'32px 20px', textAlign:'center', color:'#999', fontSize:14 }}>
                    <Bell size={32} style={{ opacity:.3, marginBottom:8 }}/>
                    <div>No notifications yet</div>
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => !n.is_read && markOneRead(n.id)}
                    style={{ padding:'12px 16px', borderBottom:'1px solid #f5f5f5', background:n.is_read?'#fff':'#f5f0ff', cursor:n.is_read?'default':'pointer', display:'flex', gap:10, alignItems:'flex-start' }}>
                    {!n.is_read && <div style={{ width:8, height:8, borderRadius:'50%', background:'#7c3aed', marginTop:5, flexShrink:0 }}/>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:n.is_read?400:600, color:'#1a1a2e' }}>{n.title || n.message || 'New notification'}</div>
                      {n.created_at && (
                        <div style={{ fontSize:11, color:'#999', marginTop:2 }}>
                          {new Date(n.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <div ref={profileRef} style={{ position:'relative' }}>
          <div className="ptd-header-user" onClick={() => setShowProfileMenu(v => !v)} style={{ cursor:'pointer' }}>
            <div className="ptd-header-user-info">
              <div className="ptd-header-user-name">{fullName || 'User'}</div>
              <div className="ptd-header-user-role">{displayRole || 'Guest'}</div>
            </div>
            <div className="ptd-header-user-avatar" style={{ overflow:'hidden', background:profilePhoto?'transparent':undefined }}>
              {profilePhoto
                ? <img src={profilePhoto} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
                : initials}
            </div>
          </div>

          {showProfileMenu && (
            <div style={{ position:'absolute', top:'110%', right:0, zIndex:1000, background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.15)', width:200, border:'1px solid rgba(0,0,0,.08)', overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#1a1a2e' }}>{fullName || 'User'}</div>
                <div style={{ fontSize:12, color:'#999', marginTop:2 }}>{displayRole}</div>
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ width:'100%', padding:'10px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:13, color:'#1a1a2e', display:'flex', alignItems:'center', gap:8 }}>
                📷 {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
              {profilePhoto && (
                <button onClick={() => { setProfilePhoto(null); localStorage.removeItem('profilePhoto'); setShowProfileMenu(false); }}
                  style={{ width:'100%', padding:'10px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:13, color:'#ef4444', display:'flex', alignItems:'center', gap:8 }}>
                  🗑️ Remove Photo
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange}/>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  );
};

export default Header;