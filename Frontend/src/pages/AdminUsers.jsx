import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Send,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const roleBadge = {
  admin: "badge-info",
  guardian: "badge-primary",
  child: "badge-accent",
};

const statusBadge = {
  active: "badge-success",
  inactive: "badge-muted",
  suspended: "badge-destructive",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal states
  const [viewModal, setViewModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [addModal, setAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [notifyModal, setNotifyModal] = useState({ open: false, user: null });

  // Form state
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Notification form
  const [notifyData, setNotifyData] = useState({ title: "", message: "", type: "info" });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ page });
      setUsers(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ADD USER
  const openAddModal = () => {
    setFormData({
      full_name: "",
      username: "",
      password: "",
      password_confirmation: "",
      role: "child",
      status: "active",
      email: "",
      guardian_type: "parent",
      phone_number: "",
      date_of_birth: "",
    });
    setFormErrors({});
    setAddModal(true);
  };

  const handleAddUser = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      const payload = { ...formData };
      if (payload.role === "child") {
        delete payload.email;
        delete payload.guardian_type;
        delete payload.phone_number;
      } else if (payload.role === "admin") {
        delete payload.guardian_type;
        delete payload.phone_number;
        delete payload.date_of_birth;
      } else if (payload.role === "guardian") {
        delete payload.date_of_birth;
      }
      await adminService.createUser(payload);
      setAddModal(false);
      fetchUsers(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setFormErrors({ general: err.message });
      }
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT USER
  const openEditModal = (user) => {
    setFormData({
      full_name: user.full_name || "",
      username: user.username || "",
      status: user.status || "active",
      email: user.guardian?.email || user.admin?.email || "",
      guardian_type: user.guardian?.guardian_type || "parent",
      phone_number: user.guardian?.phone_number || "",
      date_of_birth: user.child?.date_of_birth || "",
      total_coins: user.child?.total_coins || 0,
    });
    setFormErrors({});
    setEditModal({ open: true, user });
  };

  const handleEditUser = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      const user = editModal.user;
      const payload = {};
      if (formData.full_name !== user.full_name) payload.full_name = formData.full_name;
      if (formData.username !== user.username) payload.username = formData.username;
      if (formData.status !== user.status) payload.status = formData.status;

      if (user.role === "admin" || user.role === "guardian") {
        const currentEmail = user.guardian?.email || user.admin?.email || "";
        if (formData.email !== currentEmail) payload.email = formData.email;
      }
      if (user.role === "guardian") {
        if (formData.guardian_type !== user.guardian?.guardian_type)
          payload.guardian_type = formData.guardian_type;
        if (formData.phone_number !== user.guardian?.phone_number)
          payload.phone_number = formData.phone_number;
      }
      if (user.role === "child") {
        if (formData.date_of_birth !== user.child?.date_of_birth)
          payload.date_of_birth = formData.date_of_birth;
        if (parseInt(formData.total_coins) !== user.child?.total_coins)
          payload.total_coins = parseInt(formData.total_coins);
      }

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      if (Object.keys(payload).length === 0) {
        setEditModal({ open: false, user: null });
        return;
      }

      await adminService.updateUser(user.id, payload);
      setEditModal({ open: false, user: null });
      fetchUsers(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      } else {
        setFormErrors({ general: err.message });
      }
    } finally {
      setFormLoading(false);
    }
  };

  // VIEW USER
  const openViewModal = async (user) => {
    try {
      const res = await adminService.getUser(user.id);
      setViewModal({ open: true, user: res.user || res });
    } catch {
      setViewModal({ open: true, user });
    }
  };

  // DELETE USER
  const handleDeleteUser = async () => {
    setFormLoading(true);
    try {
      await adminService.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers(pagination.current_page);
    } catch (err) {
      alert(err.message || "Failed to delete user");
    } finally {
      setFormLoading(false);
    }
  };

  // ACTIVATE / SUSPEND
  const handleActivate = async (user) => {
    try {
      await adminService.activateUser(user.id);
      fetchUsers(pagination.current_page);
    } catch (err) {
      alert(err.message || "Failed to activate user");
    }
  };

  const handleSuspend = async (user) => {
    try {
      await adminService.suspendUser(user.id);
      fetchUsers(pagination.current_page);
    } catch (err) {
      alert(err.message || "Failed to suspend user");
    }
  };

  // SEND NOTIFICATION
  const openNotifyModal = (user) => {
    setNotifyData({ title: "", message: "", type: "info" });
    setNotifySuccess(false);
    setNotifyModal({ open: true, user });
  };

  const handleSendNotification = async () => {
    if (!notifyData.title.trim() || !notifyData.message.trim()) return;
    setNotifyLoading(true);
    setNotifySuccess(false);
    try {
      await adminService.sendNotification(notifyModal.user.id, notifyData);
      setNotifySuccess(true);
      setTimeout(() => {
        setNotifyModal({ open: false, user: null });
        setNotifySuccess(false);
      }, 1500);
    } catch (err) {
      alert(err.data?.message || err.message || "Failed to send notification");
    } finally {
      setNotifyLoading(false);
    }
  };

  const renderFormField = (label, name, type = "text", options = null) => (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {options ? (
        <select
          className="form-select"
          value={formData[name] || ""}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="form-input"
          type={type}
          value={formData[name] || ""}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          placeholder={label}
        />
      )}
      {formErrors[name] && (
        <p style={{ color: "var(--destructive)", fontSize: 12, marginTop: 4 }}>
          {Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all platform users</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus style={{ height: 16, width: 16 }} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-box">
          <Search style={{ height: 16, width: 16, color: "var(--muted-foreground)" }} />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {["all", "admin", "guardian", "child"].map((r) => (
            <button
              key={r}
              className={`filter-btn ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div className="admin-spinner" />
          </div>
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th className="th-hide-md">Status</th>
                    <th className="th-hide-lg">Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                        <p className="text-muted">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="table-user-cell">
                            <div className="table-avatar">
                              {user.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="table-user-name">{user.full_name}</div>
                              <div className="table-user-username">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${roleBadge[user.role] || "badge-muted"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="td-hide-md">
                          <span className={`badge ${statusBadge[user.status] || "badge-muted"}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="td-hide-lg text-muted text-sm">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-ghost" title="View" onClick={() => openViewModal(user)}>
                              <Eye style={{ height: 16, width: 16 }} />
                            </button>
                            <button className="btn-ghost" title="Edit" onClick={() => openEditModal(user)}>
                              <Edit2 style={{ height: 16, width: 16 }} />
                            </button>
                            <button
                              className="btn-ghost"
                              title="Send Notification"
                              onClick={() => openNotifyModal(user)}
                              style={{ color: "var(--info)" }}
                            >
                              <Bell style={{ height: 16, width: 16 }} />
                            </button>
                            {user.status !== "active" ? (
                              <button className="btn-success" title="Activate" onClick={() => handleActivate(user)}>
                                <CheckCircle style={{ height: 16, width: 16 }} />
                              </button>
                            ) : (
                              <button className="btn-danger" title="Suspend" onClick={() => handleSuspend(user)}>
                                <XCircle style={{ height: 16, width: 16 }} />
                              </button>
                            )}
                            <button className="btn-danger" title="Delete" onClick={() => setDeleteModal({ open: true, user })}>
                              <Trash2 style={{ height: 16, width: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pagination.last_page > 1 && (
              <div className="table-pagination">
                <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
                <div className="table-pagination-btns">
                  <button disabled={pagination.current_page === 1} onClick={() => fetchUsers(pagination.current_page - 1)}>
                    <ChevronLeft style={{ height: 16, width: 16 }} />
                  </button>
                  <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchUsers(pagination.current_page + 1)}>
                    <ChevronRight style={{ height: 16, width: 16 }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== ADD USER MODAL ===== */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New User"
        footer={<>
          <button className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddUser} disabled={formLoading}>
            {formLoading ? "Creating..." : "Create User"}
          </button>
        </>}
      >
        {formErrors.general && <p style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
        {renderFormField("Full Name", "full_name")}
        {renderFormField("Username", "username")}
        {renderFormField("Role", "role", "text", [
          { value: "child", label: "Child" },
          { value: "guardian", label: "Guardian" },
          { value: "admin", label: "Admin" },
        ])}
        {renderFormField("Status", "status", "text", [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ])}
        {(formData.role === "admin" || formData.role === "guardian") && renderFormField("Email", "email", "email")}
        {formData.role === "guardian" && (<>
          {renderFormField("Guardian Type", "guardian_type", "text", [
            { value: "parent", label: "Parent" },
            { value: "therapist", label: "Therapist" },
          ])}
          {renderFormField("Phone Number", "phone_number", "tel")}
        </>)}
        {formData.role === "child" && renderFormField("Date of Birth", "date_of_birth", "date")}
        {renderFormField("Password", "password", "password")}
        {renderFormField("Confirm Password", "password_confirmation", "password")}
      </Modal>

      {/* ===== EDIT USER MODAL ===== */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, user: null })}
        title={`Edit User — ${editModal.user?.full_name || ""}`}
        footer={<>
          <button className="btn-cancel" onClick={() => setEditModal({ open: false, user: null })}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEditUser} disabled={formLoading}>
            {formLoading ? "Saving..." : "Save Changes"}
          </button>
        </>}
      >
        {formErrors.general && <p style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
        {renderFormField("Full Name", "full_name")}
        {renderFormField("Username", "username")}
        {renderFormField("Status", "status", "text", [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ])}
        {(editModal.user?.role === "admin" || editModal.user?.role === "guardian") && renderFormField("Email", "email", "email")}
        {editModal.user?.role === "guardian" && (<>
          {renderFormField("Guardian Type", "guardian_type", "text", [
            { value: "parent", label: "Parent" },
            { value: "therapist", label: "Therapist" },
          ])}
          {renderFormField("Phone Number", "phone_number", "tel")}
        </>)}
        {editModal.user?.role === "child" && (<>
          {renderFormField("Date of Birth", "date_of_birth", "date")}
          {renderFormField("Total Coins", "total_coins", "number")}
        </>)}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
          <p className="text-muted text-sm" style={{ marginBottom: 8 }}>Change Password (leave blank to keep current)</p>
          {renderFormField("New Password", "password", "password")}
          {renderFormField("Confirm Password", "password_confirmation", "password")}
        </div>
      </Modal>

      {/* ===== VIEW USER MODAL ===== */}
      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, user: null })} title="User Details">
        {viewModal.user && (
          <div>
            <div className="modal-field"><div className="modal-field-label">Full Name</div><div className="modal-field-value">{viewModal.user.full_name}</div></div>
            <div className="modal-field"><div className="modal-field-label">Username</div><div className="modal-field-value">@{viewModal.user.username}</div></div>
            <div className="modal-field"><div className="modal-field-label">Role</div><div className="modal-field-value"><span className={`badge ${roleBadge[viewModal.user.role]}`}>{viewModal.user.role}</span></div></div>
            <div className="modal-field"><div className="modal-field-label">Status</div><div className="modal-field-value"><span className={`badge ${statusBadge[viewModal.user.status]}`}>{viewModal.user.status}</span></div></div>
            {(viewModal.user.role === "admin" || viewModal.user.role === "guardian") && (
              <div className="modal-field"><div className="modal-field-label">Email</div><div className="modal-field-value">{viewModal.user.guardian?.email || viewModal.user.admin?.email || "—"}</div></div>
            )}
            {viewModal.user.role === "guardian" && (<>
              <div className="modal-field"><div className="modal-field-label">Guardian Type</div><div className="modal-field-value">{viewModal.user.guardian?.guardian_type || "—"}</div></div>
              <div className="modal-field"><div className="modal-field-label">Phone</div><div className="modal-field-value">{viewModal.user.guardian?.phone_number || "—"}</div></div>
            </>)}
            {viewModal.user.role === "child" && (<>
              <div className="modal-field"><div className="modal-field-label">Date of Birth</div><div className="modal-field-value">{viewModal.user.child?.date_of_birth || "—"}</div></div>
              <div className="modal-field"><div className="modal-field-label">Total Coins</div><div className="modal-field-value">{viewModal.user.child?.total_coins || 0}</div></div>
            </>)}
            <div className="modal-field"><div className="modal-field-label">Joined</div><div className="modal-field-value">{viewModal.user.created_at ? new Date(viewModal.user.created_at).toLocaleString() : "—"}</div></div>
          </div>
        )}
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, user: null })} title="Delete User"
        footer={<>
          <button className="btn-cancel" onClick={() => setDeleteModal({ open: false, user: null })}>Cancel</button>
          <button className="btn-confirm-delete" onClick={handleDeleteUser} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete User"}</button>
        </>}
      >
        <p style={{ fontSize: 14, color: "var(--foreground)" }}>
          Are you sure you want to delete <strong>{deleteModal.user?.full_name}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ===== SEND NOTIFICATION MODAL ===== */}
      <Modal
        open={notifyModal.open}
        onClose={() => setNotifyModal({ open: false, user: null })}
        title={`Send Notification`}
        footer={
          !notifySuccess ? (
            <>
              <button className="btn-cancel" onClick={() => setNotifyModal({ open: false, user: null })}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSendNotification}
                disabled={notifyLoading || !notifyData.title.trim() || !notifyData.message.trim()}
              >
                <Send style={{ height: 14, width: 14 }} />
                {notifyLoading ? "Sending..." : "Send"}
              </button>
            </>
          ) : null
        }
      >
        {notifySuccess ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle style={{ height: 48, width: 48, color: "var(--success)", margin: "0 auto 12px" }} />
            <p className="font-semibold" style={{ fontSize: 16, color: "var(--foreground)" }}>Notification Sent!</p>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              Successfully sent to {notifyModal.user?.full_name}
            </p>
          </div>
        ) : (
          <div className="compose-form">
            {notifyModal.user && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, background: "var(--muted)", marginBottom: 4,
              }}>
                <div className="table-avatar" style={{ height: 32, width: 32, fontSize: 12 }}>
                  {notifyModal.user.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{notifyModal.user.full_name}</p>
                  <p className="text-xs text-muted">{notifyModal.user.role} — @{notifyModal.user.username}</p>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Type</label>
              <select className="form-select" value={notifyData.type} onChange={(e) => setNotifyData({ ...notifyData, type: e.target.value })}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" type="text" placeholder="Notification title" value={notifyData.title} onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea className="form-input" placeholder="Write your notification message..." value={notifyData.message} onChange={(e) => setNotifyData({ ...notifyData, message: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;