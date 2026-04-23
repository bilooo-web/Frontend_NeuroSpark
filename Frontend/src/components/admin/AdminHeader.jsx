// AdminHeader.jsx
import { Menu, Bell, Search, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const tColors = { success: "#10b981", warning: "#f59e0b", alert: "#ef4444", info: "#3b82f6" };
const tIcons  = { success: "✅", warning: "⚠️", alert: "🔴", info: "💬" };
const fmtD = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const AdminHeader = ({ onMenuClick }) => {
  // ── Search ──────────────────────────────────────────────────────────────
  const [searchFocused, setSearchFocused]   = useState(false);
  const [searchValue, setSearchValue]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showResults, setShowResults]       = useState(false);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);
  const navigate   = useNavigate();

  // ── Notifications ───────────────────────────────────────────────────────
  const [notifications, setNotifications]     = useState([]);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [showNotifPanel, setShowNotifPanel]   = useState(false);
  const [selectedNotif, setSelectedNotif]     = useState(null);
  const [notifLoading, setNotifLoading]       = useState(false);
  const notifRef = useRef(null);

  // ── Click-outside: search ───────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Click-outside: notif panel ──────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
        setSelectedNotif(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Fetch notifications ─────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const r = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!r.ok) return;
      const d = await r.json();
      const adminUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();

      // Filter out broadcasts that this admin themselves sent
      const list = (d.notifications || []).filter((n) => {
        if (n.is_broadcast && n.sender_name && adminUser.full_name) {
          // Hide if sender is this admin (broadcast they sent)
          if (n.sender_name === adminUser.full_name) return false;
        }
        return true;
      });

      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(
        typeof d.unread_count === "number"
          ? list.filter((n) => !n.is_read).length
          : list.filter((n) => !n.is_read).length
      );
    } catch {}
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => {
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // ── Mark read ───────────────────────────────────────────────────────────
  const markRead = async (id) => {
    const token = localStorage.getItem("token"); if (!token) return;
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      });
    } catch {}
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const openDetail = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    setSelectedNotif({ ...notif, is_read: true });
  };

  // ── Dismiss ─────────────────────────────────────────────────────────────
  const dismissNotif = async (id, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("token"); if (!token) return;
    const was = notifications.find((n) => n.id === id);
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch {}
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
    if (was && !was.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await adminService.globalSearch(val.trim());
        setSearchResults(res.results || []);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  };

  const handleClear = () => { setSearchValue(""); setSearchResults([]); setShowResults(false); };
  const handleResultClick = (result) => { setShowResults(false); setSearchValue(""); if (result.link) navigate(result.link); };

  const typeIcon = { user: "👤", game: "🎮", child: "🧒", guardian: "🛡️" };

  return (
    <>
      <style>{`
        /* ── Notification Panel ── */
        .ad-notif-wrapper { position: relative; }
        .ad-notif-bell-btn {
          position: relative; background: rgba(255,255,255,0.15); border: none;
          width: 40px; height: 40px; border-radius: 12px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          color: #1a2b4c; transition: background 0.2s, transform 0.2s;
        }
        .ad-notif-bell-btn:hover { background: rgba(255,255,255,0.35); transform: scale(1.07); }
        .ad-notif-badge {
          position: absolute; top: -5px; right: -5px;
          background: linear-gradient(135deg,#ff6b6b,#ee3030);
          color: #fff; font-size: 10px; font-weight: 800; min-width: 18px; height: 18px;
          border-radius: 9px; display: flex; align-items: center; justify-content: center;
          border: 2px solid white; padding: 0 3px; box-shadow: 0 2px 8px rgba(238,48,48,0.5);
          animation: badgePulse 2s infinite;
        }
        @keyframes badgePulse { 0%,100%{box-shadow:0 2px 8px rgba(238,48,48,0.5)} 50%{box-shadow:0 2px 16px rgba(238,48,48,0.8)} }

        .ad-notif-panel {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 380px; background: #fff; border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
          overflow: hidden; z-index: 9999;
          animation: dropIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes dropIn { from { opacity:0; transform:translateY(-10px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }

        .ad-notif-panel-header {
          padding: 16px 20px; border-bottom: 1px solid #f0f4ff;
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(135deg,#f7faff,#eef3ff);
        }
        .ad-notif-panel-header h4 { margin:0; font-size:15px; font-weight:700; color:#1a2b4c; }
        .ad-notif-unread-badge {
          background: linear-gradient(135deg,#1CC4AF,#0fa898);
          color:#fff; font-size:11px; font-weight:700;
          padding:3px 10px; border-radius:20px;
        }
        .ad-notif-panel-body { max-height: 420px; overflow-y: auto; }
        .ad-notif-panel-body::-webkit-scrollbar { width:5px; }
        .ad-notif-panel-body::-webkit-scrollbar-thumb { background:#dde6ff; border-radius:10px; }

        .ad-notif-item {
          display:flex; align-items:flex-start; gap:12px; padding:14px 18px;
          cursor:pointer; border-bottom:1px solid #f5f7ff;
          transition:background 0.15s;
        }
        .ad-notif-item:hover { background:#f7faff; }
        .ad-notif-item.unread { background:#f0f9f8; }
        .ad-notif-item-icon {
          width:40px; height:40px; border-radius:12px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center; font-size:18px;
        }
        .ad-notif-item-content { flex:1; min-width:0; }
        .ad-notif-item-title { font-size:13px; font-weight:700; color:#1a2b4c; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ad-notif-item-msg { font-size:12px; color:#6b7a99; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; line-height:1.5; }
        .ad-notif-item-time { font-size:11px; color:#aab; margin-top:4px; }
        .ad-notif-dot { width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#1CC4AF,#0fa898); flex-shrink:0; margin-top:2px; }
        .ad-notif-empty { text-align:center; padding:40px 20px; color:#aab; }
        .ad-notif-empty span { font-size:40px; display:block; margin-bottom:10px; }
      `}</style>

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
              onFocus={() => { setSearchFocused(true); if (searchResults.length > 0) setShowResults(true); }}
              onBlur={() => setSearchFocused(false)}
            />
            {searchValue && (
              <button className="ad-header-search-clear" onClick={handleClear}><X size={12} /></button>
            )}
            {showResults && (
              <div className="ad-header-search-dropdown">
                {searchLoading ? (
                  <div className="ad-header-search-loading">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, i) => (
                    <div key={`${result.type}-${result.id}-${i}`} className="ad-header-search-result" onMouseDown={() => handleResultClick(result)}>
                      <span className="ad-header-search-result-icon">{typeIcon[result.type] || "📄"}</span>
                      <div className="ad-header-search-result-text">
                        <div className="ad-header-search-result-title">{result.title}</div>
                        <div className="ad-header-search-result-subtitle">{result.subtitle}</div>
                      </div>
                      <span className="ad-header-search-result-type">{result.type}</span>
                    </div>
                  ))
                ) : (
                  <div className="ad-header-search-empty">No results found for "{searchValue}"</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ad-header-right">
          {/* ── Notification Bell ── */}
          <div className="ad-notif-wrapper" ref={notifRef}>
            <button
              className="ad-notif-bell-btn"
              onClick={() => { setShowNotifPanel((p) => !p); setSelectedNotif(null); }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="ad-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {showNotifPanel && (
              <div className="ad-notif-panel">
                <div className="ad-notif-panel-header">
                  {selectedNotif ? (
                    <button
                      onClick={() => setSelectedNotif(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#1CC4AF", fontWeight: 700 }}
                    >← Back</button>
                  ) : (
                    <h4>Notifications</h4>
                  )}
                  {!selectedNotif && unreadCount > 0 && (
                    <span className="ad-notif-unread-badge">{unreadCount} new</span>
                  )}
                </div>

                <div className="ad-notif-panel-body">
                  {selectedNotif ? (
                    /* ── Detail view ── */
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 22, flexShrink: 0,
                          background: `${tColors[selectedNotif.type] || "#3b82f6"}18`,
                          color: tColors[selectedNotif.type] || "#3b82f6",
                        }}>
                          {tIcons[selectedNotif.type] || "💬"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2b4c" }}>{selectedNotif.title}</div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>
                            {fmtD(selectedNotif.created_at)}{selectedNotif.sender_name ? ` • ${selectedNotif.sender_name}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.7, padding: "14px 0", borderTop: "1px solid #f0f0f0", whiteSpace: "pre-wrap" }}>
                        {selectedNotif.message}
                      </div>
                      {selectedNotif.is_broadcast && (
                        <div style={{ fontSize: 11, color: "#888", marginTop: 8, padding: "6px 12px", background: "#f8f8f8", borderRadius: 8, display: "inline-block" }}>
                          📢 Sent to {selectedNotif.target_role === "all" ? "everyone" : `${selectedNotif.target_role}s`}
                        </div>
                      )}
                      <button
                        onClick={() => dismissNotif(selectedNotif.id)}
                        style={{ marginTop: 18, width: "100%", padding: 10, borderRadius: 10, border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={e => e.target.style.background = "#fef2f2"}
                        onMouseLeave={e => e.target.style.background = "#fff"}
                      >
                        🗑️ Dismiss
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="ad-notif-empty">
                      <span>🔔</span>
                      <p style={{ margin: 0, fontSize: 13 }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`ad-notif-item ${n.is_read ? "" : "unread"}`}
                        onClick={() => openDetail(n)}
                      >
                        <div
                          className="ad-notif-item-icon"
                          style={{ background: `${tColors[n.type] || "#3b82f6"}18`, color: tColors[n.type] || "#3b82f6" }}
                        >
                          {tIcons[n.type] || "💬"}
                        </div>
                        <div className="ad-notif-item-content">
                          <div className="ad-notif-item-title">{n.title}</div>
                          <div className="ad-notif-item-msg">{n.message}</div>
                          <div className="ad-notif-item-time">{fmtD(n.created_at)}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          {!n.is_read && <div className="ad-notif-dot" />}
                          <button
                            onClick={(e) => dismissNotif(n.id, e)}
                            title="Dismiss"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 13, padding: 2, lineHeight: 1, transition: "color 0.15s" }}
                            onMouseEnter={e => e.target.style.color = "#ef4444"}
                            onMouseLeave={e => e.target.style.color = "#ccc"}
                          >✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="ad-header-date">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </header>
    </>
  );
};

export default AdminHeader;