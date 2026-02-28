import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  X,
  Sparkles,
  BookOpen,
  BarChart3,
  Bell,
  Home,
  LogOut,
} from "lucide-react";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { path: "/admin/users", icon: Users, label: "User Management", end: false },
  { path: "/admin/games", icon: Gamepad2, label: "Games & Learning", end: false },
  { path: "/admin/voice-instructions", icon: BookOpen, label: "Voice Instructions", end: false },
  { path: "/admin/reports", icon: BarChart3, label: "Reports & Analytics", end: false },
  { path: "/admin/notifications", icon: Bell, label: "Notifications", end: false },
];

const AdminSidebar = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="sidebar-logo-icon">
            <Sparkles style={{ height: 20, width: 20 }} />
          </div>
          <div className="sidebar-logo-text">
            <h1>NeuroSpark</h1>
            <p>Admin Dashboard</p>
          </div>
        </div>
        <button onClick={onClose} className="sidebar-close-btn">
          <X style={{ height: 20, width: 20 }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon style={{ height: 18, width: 18 }} />
                <span>{item.label}</span>
                {isActive && <div className="sidebar-link-dot" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="sidebar-action-btns">
        <button
          className="sidebar-action-btn home-btn"
          onClick={() => navigate("/")}
        >
          <Home style={{ height: 18, width: 18 }} />
          <span>Back to Home</span>
        </button>
        <button
          className="sidebar-action-btn logout-btn"
          onClick={handleLogout}
        >
          <LogOut style={{ height: 18, width: 18 }} />
          <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">A</div>
        <div className="sidebar-footer-info">
          <p>Admin</p>
          <p>admin@neurospark.com</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;