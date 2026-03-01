import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./admin.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="admin-main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;