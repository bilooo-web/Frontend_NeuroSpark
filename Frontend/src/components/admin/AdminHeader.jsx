import { Menu, Bell, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

const AdminHeader = ({ onMenuClick }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await adminService.globalSearch(val.trim());
        setSearchResults(res.results || []);
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleClear = () => {
    setSearchValue("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchValue("");
    if (result.link) {
      navigate(result.link);
    }
  };

  const typeIcon = {
    user: "👤",
    game: "🎮",
    child: "🧒",
    guardian: "🛡️",
  };

  return (
    <header className="ad-header">
      <div className="ad-header-left">
        <button onClick={onMenuClick} className="ad-header-menu-btn">
          <Menu style={{ height: 20, width: 20 }} />
        </button>

        <div className={`ad-header-search ${searchFocused ? "ad-focused" : ""}`} ref={searchRef}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users, games, children..."
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => {
              setSearchFocused(true);
              if (searchResults.length > 0) setShowResults(true);
            }}
            onBlur={() => setSearchFocused(false)}
          />
          {searchValue && (
            <button className="ad-header-search-clear" onClick={handleClear}>
              <X size={12} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="ad-header-search-dropdown">
              {searchLoading ? (
                <div className="ad-header-search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  {searchResults.map((result, i) => (
                    <div
                      key={`${result.type}-${result.id}-${i}`}
                      className="ad-header-search-result"
                      onMouseDown={() => handleResultClick(result)}
                    >
                      <span className="ad-header-search-result-icon">{typeIcon[result.type] || "📄"}</span>
                      <div className="ad-header-search-result-text">
                        <div className="ad-header-search-result-title">{result.title}</div>
                        <div className="ad-header-search-result-subtitle">{result.subtitle}</div>
                      </div>
                      <span className="ad-header-search-result-type">{result.type}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="ad-header-search-empty">No results found for "{searchValue}"</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ad-header-right">
        <button className="ad-header-notif-btn">
          <Bell size={20} />
          <span className="ad-header-notif-dot" />
        </button>
        <span className="ad-header-date">
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