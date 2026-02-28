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
  Plus,
  Users,
  Megaphone,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const statusBadge = {
  pending: "badge-accent",
  accepted: "badge-success",
  expired: "badge-destructive",
  rejected: "badge-muted",
};

const typeBadge = {
  info: "badge-info",
  warning: "badge-accent",
  success: "badge-success",
  alert: "badge-destructive",
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

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await adminService.getNotifications();
      setNotifications(res.notifications || res.data || []);
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
      fetchNotifications();
      setTimeout(() => {
        setComposeModal(false);
        setComposeSuccess(false);
        setComposeData({ title: "", message: "", type: "info", target: "all", target_role: "all" });
      }, 1500);
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
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Notifications & Invitations</h1>
          <p>Send notifications and manage therapist invitations</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => { setComposeSuccess(false); setComposeModal(true); }}>
            <Megaphone style={{ height: 16, width: 16 }} />
            Broadcast Notification
          </button>
          <button className="btn btn-outline" onClick={() => { fetchInvitations(); fetchNotifications(); }}>
            <RefreshCw style={{ height: 16, width: 16 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3">
        <div className="glass-card">
          <div className="mini-stat">
            <div className="mini-stat-icon accent">
              <Clock style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="mini-stat-label">Pending Invitations</div>
              <div className="mini-stat-value">{invStats.pending}</div>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="mini-stat">
            <div className="mini-stat-icon success">
              <CheckCircle style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="mini-stat-label">Accepted Invitations</div>
              <div className="mini-stat-value">{invStats.accepted}</div>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="mini-stat">
            <div className="mini-stat-icon primary">
              <AlertCircle style={{ height: 20, width: 20 }} />
            </div>
            <div>
              <div className="mini-stat-label">Expired Invitations</div>
              <div className="mini-stat-value">{invStats.expired}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="filter-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon style={{ height: 14, width: 14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== SENT NOTIFICATIONS TAB ===== */}
      {activeTab === "notifications" && (
        <div className="glass-card" style={{ padding: 0 }}>
          {notifLoading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div className="admin-spinner" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <Bell style={{ height: 40, width: 40 }} />
              <p>No notifications sent yet</p>
              <p className="text-xs text-muted" style={{ marginTop: 4 }}>Use the "Broadcast Notification" button or send from User Management</p>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th className="th-hide-md">Type</th>
                    <th className="th-hide-md">Target</th>
                    <th className="th-hide-lg">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, i) => (
                    <tr key={n.id || i}>
                      <td>
                        <div>
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>{n.title}</p>
                          <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                            {n.message?.slice(0, 80)}{n.message?.length > 80 ? "..." : ""}
                          </p>
                        </div>
                      </td>
                      <td className="td-hide-md">
                        <span className={`badge ${typeBadge[n.type] || "badge-muted"}`}>{n.type}</span>
                      </td>
                      <td className="td-hide-md text-muted text-sm">
                        {n.target_user?.full_name || n.target_role || "All Users"}
                      </td>
                      <td className="td-hide-lg text-muted text-sm">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== INVITATIONS TAB ===== */}
      {activeTab === "invitations" && (
        <div className="glass-card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div className="admin-spinner" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <Mail style={{ height: 40, width: 40 }} />
              <p>No invitations found</p>
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Therapist Email</th>
                      <th className="th-hide-md">Guardian</th>
                      <th className="th-hide-md">Child</th>
                      <th>Status</th>
                      <th className="th-hide-lg">Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Mail style={{ height: 14, width: 14, color: "var(--muted-foreground)" }} />
                            <span className="font-medium">{inv.therapist_email || "—"}</span>
                          </div>
                        </td>
                        <td className="td-hide-md text-muted">{inv.guardian?.user?.full_name || "—"}</td>
                        <td className="td-hide-md text-muted">{inv.child?.user?.full_name || "—"}</td>
                        <td>
                          <span className={`badge ${statusBadge[inv.status] || "badge-muted"}`}>{inv.status}</span>
                        </td>
                        <td className="td-hide-lg text-muted text-sm">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div className="table-actions">
                            {inv.status === "pending" && (
                              <button
                                className="btn btn-outline"
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
                <div className="table-pagination">
                  <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
                  <div className="table-pagination-btns">
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
              <button className="btn-cancel" onClick={() => setComposeModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
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
            <CheckCircle style={{ height: 48, width: 48, color: "var(--success)", margin: "0 auto 12px" }} />
            <p className="font-semibold" style={{ fontSize: 16, color: "var(--foreground)" }}>Notification Broadcast!</p>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>Sent to {composeData.target_role === "all" ? "all users" : composeData.target_role + "s"}</p>
          </div>
        ) : (
          <div className="compose-form">
            <div className="form-group">
              <label>Send To</label>
              <select
                className="form-select"
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
            <div className="form-group">
              <label>Type</label>
              <select
                className="form-select"
                value={composeData.type}
                onChange={(e) => setComposeData({ ...composeData, type: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-input"
                type="text"
                placeholder="Notification title"
                value={composeData.title}
                onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                className="form-input"
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