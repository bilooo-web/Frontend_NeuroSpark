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
} from "lucide-react";
import logoImg from "../../assets/logo_s.png";

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

  // Get real admin info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // Get admin email - try to get from user object first, then from admin profile
  const getAdminEmail = () => {
    if (user.email) return user.email;
    
    // If user has admin profile with email
    if (user.admin && user.admin.email) {
      return user.admin.email;
    }
    
    // Try to get from stored admin data
    try {
      const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
      if (adminData.email) return adminData.email;
    } catch {
      // Ignore parse error
    }
    
    return "admin@neurospark.com"; // fallback
  };

  const adminName = user.full_name || "Admin";
  const adminEmail = getAdminEmail();
  const adminInitial = adminName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin"); // Also clear admin data if stored
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={logoImg}
            alt="NeuroSpark"
            style={{ height: 36, width: 36, borderRadius: 10, objectFit: "contain" }}
          />
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
        <button className="sidebar-action-btn home-btn" onClick={() => navigate("/")}>
          <Home style={{ height: 18, width: 18 }} />
          <span>Back to Home</span>
        </button>
        <button className="sidebar-action-btn logout-btn" onClick={handleLogout}>
          <LogOut style={{ height: 18, width: 18 }} />
          <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{adminInitial}</div>
        <div className="sidebar-footer-info">
          <p>{adminName}</p>
          <p>{adminEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;