import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminProfileModal from "./AdminProfileModal";
import { LogOut } from "lucide-react";
import "./admin.css";

// ─── Logout Confirmation Modal ───────────────────────────────────────────────
const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(10,20,40,0.55)",
      backdropFilter: "blur(6px)",
      animation: "fadeInOverlay 0.2s ease",
    }}
  >
    <style>{`
      @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
      @keyframes popIn { from { opacity:0; transform:scale(0.85) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
      @keyframes floatDot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      .logout-modal-btn { cursor:pointer; border:none; font-weight:700; font-size:15px; border-radius:14px; padding:13px 32px; transition:all 0.2s ease; letter-spacing:0.3px; }
      .logout-modal-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.2); }
      .logout-modal-btn:active { transform:translateY(0); }
    `}</style>
    <div
      style={{
        background: "linear-gradient(145deg,#ffffff,#f0f5ff)",
        borderRadius: 28,
        padding: "44px 40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.8) inset",
        maxWidth: 400,
        width: "90%",
        textAlign: "center",
        animation: "popIn 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          margin: "0 auto 22px",
          background: "linear-gradient(135deg,#ff6b6b,#ee3030)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 32px rgba(238,48,48,0.35)",
          animation: "floatDot 3s ease-in-out infinite",
        }}
      >
        <LogOut size={36} color="#fff" />
      </div>

      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 24,
          fontWeight: 800,
          color: "#1a2b4c",
          letterSpacing: "-0.5px",
        }}
      >
        Leaving so soon?
      </h2>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: 14.5,
          color: "#6b7a99",
          lineHeight: 1.6,
        }}
      >
        Are you sure you want to log out of the admin dashboard? Your session will end.
      </p>

      <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
        <button
          className="logout-modal-btn"
          onClick={onCancel}
          style={{
            background: "linear-gradient(135deg,#f0f4ff,#e4ecff)",
            color: "#4a6298",
            border: "1.5px solid #ccd7f0",
            minWidth: 120,
          }}
        >
          Cancel
        </button>
        <button
          className="logout-modal-btn"
          onClick={onConfirm}
          style={{
            background: "linear-gradient(135deg,#ff6b6b,#ee3030)",
            color: "#fff",
            minWidth: 140,
            boxShadow: "0 6px 20px rgba(238,48,48,0.4)",
          }}
        >
          Yes, Logout
        </button>
      </div>
    </div>
  </div>
);

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const doLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setShowLogoutConfirm(false);
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="ad-layout" style={{ backgroundColor: "#8BE3D8" }}>
      <div className="ad-stars-bg" />
      {sidebarOpen && (
        <div className="ad-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`ad-sidebar-wrapper ${sidebarOpen ? "ad-open" : ""}`}>
        <AdminSidebar
          onClose={() => setSidebarOpen(false)}
          onProfileClick={() => {
            setProfileModalOpen(true);
            setSidebarOpen(false);
          }}
          onLogoutClick={() => setShowLogoutConfirm(true)}
        />
      </aside>

      <div className="ad-main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="ad-content">
          <Outlet />
        </main>
      </div>

      {/* Admin Profile Edit Modal */}
      <AdminProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Logout Confirmation Modal - Centered in Layout */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={doLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;