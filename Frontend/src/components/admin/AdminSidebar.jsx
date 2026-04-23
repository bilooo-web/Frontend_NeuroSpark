// AdminSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  X,
  BookOpen,
  BarChart3,
  Bell,
  Home,
  LogOut,
  MessageSquare,
  Pencil,
} from "lucide-react";
import logoImg from "../../assets/logo_s.png";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { path: "/admin/users", icon: Users, label: "User Management", end: false },
  { path: "/admin/games", icon: Gamepad2, label: "Games & Learning", end: false },
  { path: "/admin/voice-instructions", icon: BookOpen, label: "Voice Instructions", end: false },
  { path: "/admin/feedback", icon: MessageSquare, label: "Feedback & Sentiment", end: false },
  { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics", end: false },
  { path: "/admin/notifications", icon: Bell, label: "Notifications", end: false },
];

const AdminSidebar = ({ onClose, onProfileClick, onLogoutClick }) => {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const getAdminEmail = () => {
    if (user.email) return user.email;
    if (user.admin?.email) return user.admin.email;
    try {
      const d = JSON.parse(localStorage.getItem("admin") || "{}");
      if (d.email) return d.email;
    } catch {}
    return "admin@neurospark.com";
  };

  const adminName = user.full_name || "Admin";
  const adminEmail = getAdminEmail();
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <>
      <div className="ad-sidebar">
        <div className="ad-sidebar-logo">
          <div className="ad-sidebar-logo-container">
            <img src={logoImg} alt="NeuroSpark" className="ad-sidebar-logo-img" />
            <div className="ad-sidebar-logo-text">
              <p>Admin Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="ad-sidebar-close-btn">
            <X style={{ height: 20, width: 20 }} />
          </button>
        </div>

        <nav className="ad-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `ad-sidebar-link ${isActive ? "ad-active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon style={{ height: 18, width: 18 }} />
                  <span>{item.label}</span>
                  {isActive && <div className="ad-sidebar-link-dot" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="ad-sidebar-action-btns">
          <button
            className="ad-sidebar-action-btn ad-home-btn"
            onClick={() => navigate("/")}
          >
            <Home style={{ height: 18, width: 18, color: "#1CC4AF" }} />
            <span style={{ color: "#1CC4AF" }}>Back to Home</span>
          </button>
          <button
            className="ad-sidebar-action-btn ad-logout-btn"
            onClick={onLogoutClick}
          >
            <LogOut style={{ height: 18, width: 18 }} />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer: avatar + name + edit icon */}
        <div
          className="ad-sidebar-footer"
          style={{ cursor: "default", position: "relative" }}
        >
          <div className="ad-sidebar-avatar">{adminInitial}</div>
          <div className="ad-sidebar-footer-info" style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {adminName}
              </span>
            </p>
            <p
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 11,
              }}
            >
              {adminEmail}
            </p>
          </div>

          {/* Edit icon - opens profile modal */}
          <button
            onClick={onProfileClick}
            title="Edit Profile"
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg,#1CC4AF,#0fa898)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(28,196,175,0.5)",
              transition: "transform 0.18s, box-shadow 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.12)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(28,196,175,0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(28,196,175,0.5)";
            }}
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;