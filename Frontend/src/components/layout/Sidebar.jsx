import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users,
  Brain, AlertTriangle, Mail, X, Menu, Home, MessageSquare, Settings
} from 'lucide-react';
import guardianService from '../../services/guardianService';

const Sidebar = () => {
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);

  useEffect(() => {
    const fetchAnomalyCount = async () => {
      try {
        const res = await guardianService.getAllAnomalies();
        const anomalies = res.data || res.anomalies || [];
        setAnomalyCount(Array.isArray(anomalies) ? anomalies.length : 0);
      } catch {
        setAnomalyCount(0);
      }
    };
    fetchAnomalyCount();
  }, []);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'TH';

  const mainNav = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, path: '/guardian/dashboard' },
    { label: 'Children', icon: <Users size={20} />, path: '/guardian/children' },
    { label: 'Anomalies', icon: <AlertTriangle size={20} />, path: '/guardian/anomalies', badge: anomalyCount },
    { label: 'Pending Invites', icon: <Mail size={20} />, path: '/guardian/invites' },
    { label: 'Feedbacks', icon: <MessageSquare size={20} />, path: '/guardian/feedbacks' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/guardian/settings' },
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
          style={{
            height: '50px',
            width: 'auto',
            objectFit: 'contain',
            transition: 'transform 0.3s ease'
          }}
        />
      </div>

      <div className="nt-sidebar-nav">
        <span className="nt-sidebar-section-label">Menu</span>
        {mainNav.map(item => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`nt-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.badge > 0 && <span className="nt-sidebar-badge">{item.badge}</span>}
          </button>
        ))}
      </div>

      <div className="nt-sidebar-footer">
        <button className="nt-sidebar-home" onClick={() => handleNav('/')}>
          <Home size={18} /> Go Back Home
        </button>

        <div className="nt-sidebar-user">
          <div className="nt-sidebar-user-avatar">{initials}</div>
          <div className="nt-sidebar-user-info">
            <div className="nt-sidebar-user-name">{user?.name || 'Therapist'}</div>
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