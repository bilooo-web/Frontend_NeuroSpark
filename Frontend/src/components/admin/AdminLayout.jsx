import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminProfileModal from "./AdminProfileModal";
import "./admin.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <div className="admin-layout" style={{ backgroundColor: "#8BE3D8" }}>
      <div className="stars-bg" />
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
        <AdminSidebar
          onClose={() => setSidebarOpen(false)}
          onProfileClick={() => {
            setProfileModalOpen(true);
            setSidebarOpen(false);
          }}
        />
      </aside>

      <div className="admin-main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* Admin Profile Edit Modal */}
      <AdminProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;