import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="ptd-app">
      <Sidebar />
      <div className="ptd-main-wrapper">
        <Header />
        <div className="ptd-main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;