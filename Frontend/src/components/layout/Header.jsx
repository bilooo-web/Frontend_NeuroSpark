import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Search, X, Settings } from 'lucide-react';
import api from '../../services/api';

const Header = () => {
  const { user } = useApp();

  // user.full_name is the correct field (not user.name)
  const fullName = user?.full_name || user?.name || 'Therapist';
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef(null);

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // Try guardian notifications endpoint
      const res = await api.get('/guardian/notifications').catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.read_at).length);
      } else if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n) => !n.read_at).length);
      }
    } catch {
      // Notifications not available — fail silently
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/guardian/notifications/read-all').catch(() => null);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.post(`/guardian/notifications/${id}/read`).catch(() => null);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  // Profile photo upload — stored in localStorage (no backend endpoint needed)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePhoto(dataUrl);
      localStorage.setItem('profilePhoto', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    localStorage.removeItem('profilePhoto');
    setShowProfileMenu(false);
  };

  return (
    <header className="ptd-header">
      <div className="ptd-header-left">
        <h1 className="ptd-header-title">Dashboard</h1>
        <div className="ptd-header-search">
          <Search size={18} />
          <input type="text" placeholder="Search children, sessions..." />
        </div>
      </div>

      <div className="ptd-header-right">

        {/* Notifications bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="ptd-header-icon-btn"
            onClick={() => setShowNotifications((v) => !v)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="ptd-header-notification-dot"
                style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', fontSize: 10, fontWeight: 700,
                  width: 16, height: 16, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 1000,
              background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              width: 320, maxHeight: 400, overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
              }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 320 }}>
                {loadingNotifications ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: 14 }}>
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#999', fontSize: 14 }}>
                    <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No notifications yet</div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read_at && handleMarkOneRead(n.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f5f5f5',
                        background: n.read_at ? '#fff' : '#f5f0ff',
                        cursor: n.read_at ? 'default' : 'pointer',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}
                    >
                      {!n.read_at && (
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#7c3aed', marginTop: 5, flexShrink: 0,
                        }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: n.read_at ? 400 : 600, color: '#1a1a2e' }}>
                          {n.title || n.message || n.data?.message || 'New notification'}
                        </div>
                        {n.created_at && (
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            {new Date(n.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar with dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            className="ptd-header-user"
            onClick={() => setShowProfileMenu((v) => !v)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ptd-header-user-info">
              <div className="ptd-header-user-name">{fullName}</div>
              <div className="ptd-header-user-role">Therapist</div>
            </div>
            <div
              className="ptd-header-user-avatar"
              style={{
                overflow: 'hidden',
                background: profilePhoto ? 'transparent' : undefined,
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                initials
              )}
            </div>
          </div>

          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 1000,
              background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              width: 200, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{fullName}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Therapist</div>
              </div>

              {/* Upload photo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                  textAlign: 'left', cursor: 'pointer', fontSize: 13, color: '#1a1a2e',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                📷 {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>

              {profilePhoto && (
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                    textAlign: 'left', cursor: 'pointer', fontSize: 13, color: '#ef4444',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  🗑️ Remove Photo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;