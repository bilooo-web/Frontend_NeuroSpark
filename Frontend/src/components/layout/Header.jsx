import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Search, Settings } from 'lucide-react';

const Header = () => {
  const { user } = useApp();
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'TH';

  return (
    <header className="nt-header">
      <div className="nt-header-left">
        <h1 className="nt-header-title">Dashboard</h1>
        <div className="nt-header-search">
          <Search size={18} />
          <input type="text" placeholder="Search children, sessions..." />
        </div>
      </div>

      <div className="nt-header-right">
        <button className="nt-header-icon-btn">
          <Bell size={18} />
          <span className="nt-header-notification-dot" />
        </button>

        <div className="nt-header-user">
          <div className="nt-header-user-info">
            <div className="nt-header-user-name">{user?.name || 'Therapist'}</div>
            <div className="nt-header-user-role">Therapist</div>
          </div>
          <div className="nt-header-user-avatar">{initials}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;