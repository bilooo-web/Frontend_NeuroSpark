import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Brain, AlertTriangle,
  Mail, X, Menu, Home, MessageSquare, Settings, LogOut,
  Stethoscope,
} from 'lucide-react';
import api from '../../services/api';

const Sidebar = () => {
  const { user, setUser, isTherapist, isParent } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState(
    () => localStorage.getItem('profilePhoto') || null
  );

  useEffect(() => {
    const syncPhoto = () => setProfilePhoto(localStorage.getItem('profilePhoto') || null);
    window.addEventListener('storage', syncPhoto);
    const interval = setInterval(syncPhoto, 1000);
    return () => { window.removeEventListener('storage', syncPhoto); clearInterval(interval); };
  }, []);

  const fullName   = user?.full_name || user?.name || 'User';
  const initials   = fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const roleLabel  = user?.guardian?.guardian_type || user?.guardian_type || user?.role || 'User';
  const displayRole = roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await api.post('/logout').catch(() => null); } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('guardian_type');
      localStorage.removeItem('profilePhoto');
      if (setUser) setUser(null);
      window.dispatchEvent(new Event('user-updated'));
      window.dispatchEvent(new Event('logout'));
      navigate('/');
    }
  };

  // Build nav based on role
  const mainNav = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/guardian/dashboard' },
  ];

  if (isTherapist) {
    mainNav.push(
      { label: 'Patients',         icon: <Users size={20} />,         path: '/guardian/children' },
      { label: 'Anomalies',        icon: <AlertTriangle size={20} />, path: '/guardian/anomalies' },
      { label: 'Pending Invites',  icon: <Mail size={20} />,          path: '/guardian/invites' },
    );
  }

  if (isParent) {
    mainNav.push(
      { label: 'My Children',      icon: <Users size={20} />,         path: '/guardian/children' },
      { label: 'Find Therapist',   icon: <Stethoscope size={20} />,   path: '/guardian/therapists' },
    );
  }

  mainNav.push(
    { label: 'Feedbacks', icon: <MessageSquare size={20} />, path: '/guardian/feedbacks' },
    { label: 'Settings',  icon: <Settings size={20} />,      path: '/guardian/settings' },
  );

  const handleNav = path => { navigate(path); setMobileOpen(false); };

  const sidebarContent = (
    <div className="ptd-sidebar">
      <div className="ptd-sidebar-logo">
        <img src="/src/assets/logo_s.png" alt="logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
      </div>
      <div className="ptd-sidebar-nav">
        <span className="ptd-sidebar-section-label">Menu</span>
        {mainNav.map(item => (
          <button key={item.path} onClick={() => handleNav(item.path)}
            className={`ptd-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
      <div className="ptd-sidebar-footer">
        <button className="ptd-sidebar-home" onClick={handleLogout} disabled={loggingOut} style={{ color: '#ef4444', marginBottom: 4 }}>
          <LogOut size={18} /> {loggingOut ? 'Logging out…' : 'Log Out'}
        </button>
        <button className="ptd-sidebar-home" onClick={() => handleNav('/')}>
          <Home size={18} /> Go Back Home
        </button>
        <div className="ptd-sidebar-user">
          <div className="ptd-sidebar-user-avatar" style={{ overflow: 'hidden', background: profilePhoto ? 'transparent' : undefined }}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          <div className="ptd-sidebar-user-info">
            <div className="ptd-sidebar-user-name">{fullName}</div>
            <div className="ptd-sidebar-user-role">{displayRole}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button className="ptd-mobile-menu-btn" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
      {mobileOpen && (
        <>
          <div className="ptd-mobile-overlay" onClick={() => setMobileOpen(false)} />
          <div className="ptd-mobile-sidebar">
            {sidebarContent}
            <button className="ptd-mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
          </div>
        </>
      )}
      <div className="ptd-sidebar-wrapper">{sidebarContent}</div>
    </>
  );
};

export default Sidebar;