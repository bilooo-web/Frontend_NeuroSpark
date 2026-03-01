import { Menu, Bell, Search } from "lucide-react";
import { useState } from "react";

const AdminHeader = ({ onMenuClick }) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button onClick={onMenuClick} className="header-menu-btn">
          <Menu style={{ height: 20, width: 20 }} />
        </button>

        <div className={`header-search ${searchFocused ? "focused" : ""}`}>
          <Search style={{ height: 16, width: 16, color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder="Search users, games..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      <div className="header-right">
        <button className="header-notif-btn">
          <Bell style={{ height: 20, width: 20 }} />
          <span className="header-notif-dot" />
        </button>
        <span className="header-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </header>
  );
};

export default AdminHeader;