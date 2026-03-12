import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="nt-app">
      <Sidebar />
      <div className="nt-main-wrapper">
        <Header />
        <div className="nt-main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;