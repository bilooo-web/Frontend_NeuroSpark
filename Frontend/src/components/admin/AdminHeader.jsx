import { Menu, Bell, Search, X } from "lucide-react";
import { useState } from "react";

const AdminHeader = ({ onMenuClick }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleClear = () => {
    setSearchValue('');
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button onClick={onMenuClick} className="header-menu-btn">
          <Menu style={{ height: 20, width: 20 }} />
        </button>

        <div className={`header-search ${searchFocused ? "focused" : ""}`}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchValue && (
            <button className="header-search-clear" onClick={handleClear}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="header-notif-btn">
          <Bell size={20} />
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

