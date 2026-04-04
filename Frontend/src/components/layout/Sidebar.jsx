import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Brain, AlertTriangle,
  Mail, X, Menu, Home, MessageSquare, Settings, LogOut,
} from 'lucide-react';
import guardianService from '../../services/guardianService';
import api from '../../services/api';

const Sidebar = () => {
  const { user, setUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile photo — same localStorage key as Header.jsx
  const [profilePhoto, setProfilePhoto] = useState(
    () => localStorage.getItem('profilePhoto') || null
  );

  // Keep photo in sync if Header changes it
  useEffect(() => {
    const syncPhoto = () => setProfilePhoto(localStorage.getItem('profilePhoto') || null);
    window.addEventListener('storage', syncPhoto);
    // Also poll every second to catch same-tab updates from Header
    const interval = setInterval(syncPhoto, 1000);
    return () => {
      window.removeEventListener('storage', syncPhoto);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchAnomalyCount = async () => {
      try {
        const res = await guardianService.getAllAnomalies();
        // api.js returns json directly: { success, data: [...] }
        const anomalies = res.data || [];
        setAnomalyCount(Array.isArray(anomalies) ? anomalies.length : 0);
      } catch {
        setAnomalyCount(0);
      }
    };
    fetchAnomalyCount();
  }, []);

  // user.full_name is the correct field
  const fullName = user?.full_name || user?.name || 'Therapist';
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/logout').catch(() => null); // try server logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profilePhoto');
      if (setUser) setUser(null);
      navigate('/');
    }
  };

  const mainNav = [
    { label: 'Overview',       icon: <LayoutDashboard size={20} />, path: '/guardian/dashboard' },
    { label: 'Children',       icon: <Users size={20} />,           path: '/guardian/children' },
    { label: 'Anomalies',      icon: <AlertTriangle size={20} />,   path: '/guardian/anomalies', badge: anomalyCount },
    { label: 'Pending Invites',icon: <Mail size={20} />,            path: '/guardian/invites' },
    { label: 'Feedbacks',      icon: <MessageSquare size={20} />,   path: '/guardian/feedbacks' },
    { label: 'Settings',       icon: <Settings size={20} />,        path: '/guardian/settings' },
  ];

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="nt-sidebar">
      {/* Logo */}
      <div className="nt-sidebar-logo">
        <img
          src="/src/assets/logo_s.png"
          alt="logo"
          style={{ height: '50px', width: 'auto', objectFit: 'contain', transition: 'transform 0.3s ease' }}
        />
      </div>

      {/* Nav items */}
      <div className="nt-sidebar-nav">
        <span className="nt-sidebar-section-label">Menu</span>
        {mainNav.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`nt-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.badge > 0 && (
              <span className="nt-sidebar-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="nt-sidebar-footer">

        {/* Logout */}
        <button
          className="nt-sidebar-home"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ color: '#ef4444', marginBottom: 4 }}
        >
          <LogOut size={18} />
          {loggingOut ? 'Logging out...' : 'Log Out'}
        </button>

        {/* Back home */}
        <button
          className="nt-sidebar-home"
          onClick={() => handleNav('/')}
        >
          <Home size={18} /> Go Back Home
        </button>

        {/* User card */}
        <div className="nt-sidebar-user">
          <div
            className="nt-sidebar-user-avatar"
            style={{ overflow: 'hidden', background: profilePhoto ? 'transparent' : undefined }}
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
          <div className="nt-sidebar-user-info">
            <div className="nt-sidebar-user-name">{fullName}</div>
            <div className="nt-sidebar-user-role">Therapist</div>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button className="nt-mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <>
          <div className="nt-mobile-overlay" onClick={() => setMobileOpen(false)} />
          <div className="nt-mobile-sidebar">
            {sidebarContent}
            <button className="nt-mobile-close" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </>
      )}

      <div className="nt-sidebar-wrapper">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;