import { useState, useEffect } from "react";
import {
  Bell,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const statusBadge = {
  pending: "ad-badge-accent",
  accepted: "ad-badge-success",
  expired: "ad-badge-destructive",
  rejected: "ad-badge-muted",
};

const typeBadge = {
  info: "ad-badge-info",
  warning: "ad-badge-accent",
  success: "ad-badge-success",
  alert: "ad-badge-destructive",
};

const AdminNotifications = () => {
  const [invitations, setInvitations] = useState([]);
  const [invStats, setInvStats] = useState({ pending: 0, accepted: 0, expired: 0 });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(null);

  // Notification history
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifStats, setNotifStats] = useState({ total_sent: 0, total_broadcast: 0, total_direct: 0 });
  const [notifFilter, setNotifFilter] = useState("all");

  // Compose modal
  const [composeModal, setComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    title: "",
    message: "",
    type: "info",
    target: "all",
    target_role: "all",
  });
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeSuccess, setComposeSuccess] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("notifications");

  useEffect(() => {
    fetchInvitations();
    fetchNotifications();
  }, []);

  const fetchInvitations = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getInvitations({ page });
      const data = res.invitations || res;
      setInvitations(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to,
      });
      if (res.stats) setInvStats(res.stats);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (filter = notifFilter) => {
    try {
      setNotifLoading(true);
      const params = {};
      if (filter !== "all") params.filter = filter;
      const res = await adminService.getNotifications(params);
      setNotifications(res.notifications || res.data || []);
      if (res.stats) setNotifStats(res.stats);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleResend = async (id) => {
    try {
      setResending(id);
      await adminService.resendInvitation(id);
      alert("Invitation resent successfully");
    } catch (err) {
      alert(err.data?.message || err.message || "Failed to resend");
    } finally {
      setResending(null);
    }
  };

  // Broadcast notification
  const handleComposeSend = async () => {
    if (!composeData.title.trim() || !composeData.message.trim()) return;
    setComposeLoading(true);
    setComposeSuccess(false);
    try {
      await adminService.broadcastNotification(composeData);
      setComposeSuccess(true);
      setTimeout(async () => {
        await fetchNotifications("all");
        setNotifFilter("all");
        setComposeModal(false);
        setComposeSuccess(false);
        setComposeData({ title: "", message: "", type: "info", target: "all", target_role: "all" });
      }, 1200);
    } catch (err) {
      alert(err.data?.message || err.message || "Failed to send notification");
    } finally {
      setComposeLoading(false);
    }
  };

  const tabs = [
    { id: "notifications", label: "Sent Notifications", icon: Bell },
    { id: "invitations", label: "Therapist Invitations", icon: Mail },
  ];

  return (
    <div className="ad-page-section">
      <div className="ad-page-header">
        <div>
          <h1>Notifications & Invitations</h1>
          <p>Send notifications and manage therapist invitations</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ad-btn ad-btn-primary" onClick={() => { setComposeSuccess(false); setComposeModal(true); }}>
            <Megaphone style={{ height: 16, width: 16 }} />
            Broadcast Notification
          </button>
          <button className="ad-btn ad-btn-outline" onClick={() => { fetchInvitations(); fetchNotifications(); }}>
            <RefreshCw style={{ height: 16, width: 16 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ad-grid-3">
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-primary">
              <Bell style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Total Sent</div>
              <div className="ad-mini-stat-value">{notifStats.total_sent}</div>
            </div>
          </div>
        </div>
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-accent">
              <Megaphone style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Broadcast</div>
              <div className="ad-mini-stat-value">{notifStats.total_broadcast}</div>
            </div>
          </div>
        </div>
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-success">
              <Send style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Direct</div>
              <div className="ad-mini-stat-value">{notifStats.total_direct}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Stats */}
      <div className="ad-grid-3">
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-accent">
              <Clock style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Pending Invitations</div>
              <div className="ad-mini-stat-value">{invStats.pending}</div>
            </div>
          </div>
        </div>
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-success">
              <CheckCircle style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Accepted Invitations</div>
              <div className="ad-mini-stat-value">{invStats.accepted}</div>
            </div>
          </div>
        </div>
        <div className="ad-glass-card">
          <div className="ad-mini-stat">
            <div className="ad-mini-stat-icon ad-primary">
              <AlertCircle style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="ad-mini-stat-label">Expired Invitations</div>
              <div className="ad-mini-stat-value">{invStats.expired}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="ad-filter-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ad-filter-btn ${activeTab === tab.id ? "ad-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon style={{ height: 14, width: 14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== SENT NOTIFICATIONS TAB ===== */}
      {activeTab === "notifications" && (
        <>
          {/* Filter buttons */}
          <div className="ad-filter-group" style={{ marginBottom: 16, gap: 8 }}>
            {[
              { id: "all", label: `All (${notifStats.total_sent || 0})`, icon: Bell },
              { id: "broadcast", label: `Broadcast (${notifStats.total_broadcast || 0})`, icon: Megaphone },
              { id: "direct", label: `Direct (${notifStats.total_direct || 0})`, icon: Send },
            ].map((f) => (
              <button
                key={f.id}
                className={`ad-filter-btn ${notifFilter === f.id ? "ad-active" : ""}`}
                onClick={() => { setNotifFilter(f.id); fetchNotifications(f.id); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <f.icon style={{ height: 13, width: 13 }} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="ad-glass-card" style={{ padding: 0 }}>
            {notifLoading ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div className="ad-spinner" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="ad-empty-state" style={{ padding: 48 }}>
                <Bell style={{ height: 40, width: 40 }} />
                <p>No notifications sent yet</p>
                <p className="ad-text-xs ad-text-muted" style={{ marginTop: 4 }}>Use the "Broadcast Notification" button or send from User Management</p>
              </div>
            ) : (
              <div className="ad-data-table-wrapper">
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="ad-th-hide-md">Type</th>
                      <th>Delivery</th>
                      <th className="ad-th-hide-md">Sent By</th>
                      <th className="ad-th-hide-lg">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n, i) => (
                      <tr key={n.id || i}>
                        <td>
                          <div>
                            <p className="ad-font-medium" style={{ color: "var(--ad-foreground)" }}>{n.title}</p>
                            <p className="ad-text-xs ad-text-muted" style={{ marginTop: 2 }}>
                              {n.message?.slice(0, 80)}{n.message?.length > 80 ? "..." : ""}
                            </p>
                          </div>
                        </td>
                        <td className="ad-td-hide-md">
                          <span className={`ad-badge ${typeBadge[n.type] || "ad-badge-muted"}`}>{n.type}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className={`ad-badge ${n.is_broadcast ? "ad-badge-accent" : "ad-badge-primary"}`} style={{ fontSize: 10 }}>
                              {n.is_broadcast ? "Broadcast" : "Direct"}
                            </span>
                            <span className="ad-text-muted ad-text-xs">
                              {n.is_broadcast
                                ? (n.target_role === "all" ? "All Users" : (n.target_role ? n.target_role.charAt(0).toUpperCase() + n.target_role.slice(1) + "s" : "All Users"))
                                : (n.target_user?.full_name || "Unknown")
                              }
                            </span>
                          </div>
                        </td>
                        <td className="ad-td-hide-md ad-text-muted ad-text-sm">
                          {n.sender_name || n.sender?.full_name || "System"}
                        </td>
                        <td className="ad-td-hide-lg ad-text-muted ad-text-sm">
                          {n.created_at ? new Date(n.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== INVITATIONS TAB ===== */}
      {activeTab === "invitations" && (
        <div className="ad-glass-card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div className="ad-spinner" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="ad-empty-state" style={{ padding: 48 }}>
              <Mail style={{ height: 40, width: 40 }} />
              <p>No invitations found</p>
            </div>
          ) : (
            <>
              <div className="ad-data-table-wrapper">
                <table className="ad-data-table">
                  <thead>
                    <tr>
                      <th>Therapist Email</th>
                      <th className="ad-th-hide-md">Guardian</th>
                      <th className="ad-th-hide-md">Child</th>
                      <th>Status</th>
                      <th className="ad-th-hide-lg">Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Mail style={{ height: 14, width: 14, color: "var(--ad-muted-foreground)" }} />
                            <span className="ad-font-medium">{inv.therapist_email || "—"}</span>
                          </div>
                        </td>
                        <td className="ad-td-hide-md ad-text-muted">{inv.guardian?.user?.full_name || "—"}</td>
                        <td className="ad-td-hide-md ad-text-muted">{inv.child?.user?.full_name || "—"}</td>
                        <td>
                          <span className={`ad-badge ${statusBadge[inv.status] || "ad-badge-muted"}`}>{inv.status}</span>
                        </td>
                        <td className="ad-td-hide-lg ad-text-muted ad-text-sm">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div className="ad-table-actions">
                            {inv.status === "pending" && (
                              <button
                                className="ad-btn ad-btn-outline"
                                style={{ padding: "6px 12px", fontSize: 13 }}
                                onClick={() => handleResend(inv.id)}
                                disabled={resending === inv.id}
                              >
                                <Send style={{ height: 14, width: 14 }} />
                                {resending === inv.id ? "Sending..." : "Resend"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.last_page > 1 && (
                <div className="ad-table-pagination">
                  <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
                  <div className="ad-table-pagination-btns">
                    <button disabled={pagination.current_page === 1} onClick={() => fetchInvitations(pagination.current_page - 1)}>
                      <ChevronLeft style={{ height: 16, width: 16 }} />
                    </button>
                    <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchInvitations(pagination.current_page + 1)}>
                      <ChevronRight style={{ height: 16, width: 16 }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== COMPOSE BROADCAST MODAL ===== */}
      <Modal
        open={composeModal}
        onClose={() => setComposeModal(false)}
        title="Broadcast Notification"
        footer={
          !composeSuccess ? (
            <>
              <button className="ad-btn-cancel" onClick={() => setComposeModal(false)}>Cancel</button>
              <button
                className="ad-btn ad-btn-primary"
                onClick={handleComposeSend}
                disabled={composeLoading || !composeData.title.trim() || !composeData.message.trim()}
              >
                <Send style={{ height: 14, width: 14 }} />
                {composeLoading ? "Sending..." : "Send to All"}
              </button>
            </>
          ) : null
        }
      >
        {composeSuccess ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle style={{ height: 48, width: 48, color: "var(--ad-success)", margin: "0 auto 12px" }} />
            <p className="ad-font-semibold" style={{ fontSize: 16, color: "var(--ad-foreground)" }}>Notification Broadcast!</p>
            <p className="ad-text-muted ad-text-sm" style={{ marginTop: 4 }}>Sent to {composeData.target_role === "all" ? "all users" : composeData.target_role + "s"}</p>
          </div>
        ) : (
          <div className="ad-compose-form">
            <div className="ad-form-group">
              <label>Send To</label>
              <select
                className="ad-form-select"
                value={composeData.target_role}
                onChange={(e) => setComposeData({ ...composeData, target_role: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="child">All Children</option>
                <option value="guardian">All Guardians (Parents & Therapists)</option>
                <option value="parent">Parents Only</option>
                <option value="therapist">Therapists Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            <div className="ad-form-group">
              <label>Type</label>
              <select
                className="ad-form-select"
                value={composeData.type}
                onChange={(e) => setComposeData({ ...composeData, type: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="ad-form-group">
              <label>Title</label>
              <input
                className="ad-form-input"
                type="text"
                placeholder="Notification title"
                value={composeData.title}
                onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
              />
            </div>
            <div className="ad-form-group">
              <label>Message</label>
              <textarea
                className="ad-form-input"
                placeholder="Write your broadcast message..."
                value={composeData.message}
                onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminNotifications;