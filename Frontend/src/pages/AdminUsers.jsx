import { useState, useEffect, useRef } from "react";
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
  Mail,
  Phone,
  Calendar,
  Coins,
  Shield,
  Baby,
  Link2,
  UserCheck,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const roleBadge = {
  admin: "ad-badge-info",
  guardian: "ad-badge-primary",
  child: "ad-badge-accent",
};

const statusBadge = {
  active: "ad-badge-success",
  inactive: "ad-badge-muted",
  suspended: "ad-badge-destructive",
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

  // Success toast state
  const [successToast, setSuccessToast] = useState({ show: false, message: "", detail: "" });

  // Notification form
  const [notifyData, setNotifyData] = useState({ title: "", message: "", type: "info" });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const showSuccess = (message, detail = "") => {
    setSuccessToast({ show: true, message, detail });
    setTimeout(() => setSuccessToast({ show: false, message: "", detail: "" }), 2500);
  };

  useEffect(() => {
    fetchUsers(1, "all", "");
  }, []);

  // Ref to hold current filter values for use inside callbacks
  const searchTimerRef = useRef(null);

  const fetchUsers = async (page = 1, role = roleFilter, searchVal = search) => {
    try {
      setLoading(true);
      const params = { page };
      if (role && role !== "all") params.role = role;
      if (searchVal && searchVal.trim()) params.search = searchVal.trim();
      const res = await adminService.getUsers(params);
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

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    fetchUsers(1, role, search);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchUsers(1, roleFilter, value);
    }, 400);
  };

  const refreshCurrentPage = () => {
    fetchUsers(pagination.current_page || 1, roleFilter, search);
  };

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
      showSuccess("User Created Successfully", `${formData.full_name} has been added to the platform.`);
      refreshCurrentPage();
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
      showSuccess("User Updated Successfully", `${formData.full_name}'s profile has been updated.`);
      refreshCurrentPage();
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
  const [viewLoading, setViewLoading] = useState(false);

  const openViewModal = async (user) => {
    setViewModal({ open: true, user: null });
    setViewLoading(true);
    try {
      const res = await adminService.getUser(user.id);
      setViewModal({ open: true, user: res.user || res });
    } catch {
      // Fallback to list data if fetch fails
      setViewModal({ open: true, user });
    } finally {
      setViewLoading(false);
    }
  };

  // DELETE USER
  const [deleteError, setDeleteError] = useState("");
  const handleDeleteUser = async () => {
    setFormLoading(true);
    setDeleteError("");
    try {
      const deletedName = deleteModal.user?.full_name;
      await adminService.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      showSuccess("User Deleted Successfully", `${deletedName} has been removed from the platform.`);
      refreshCurrentPage();
    } catch (err) {
      setDeleteError(err.data?.message || err.message || "Failed to delete user");
    } finally {
      setFormLoading(false);
    }
  };

  // ACTIVATE / SUSPEND
  const handleActivate = async (user) => {
    try {
      await adminService.activateUser(user.id);
      showSuccess("User Activated", `${user.full_name} is now active.`);
      refreshCurrentPage();
    } catch (err) {
      showSuccess("Action Failed", err.message || "Failed to activate user");
    }
  };

  const handleSuspend = async (user) => {
    try {
      await adminService.suspendUser(user.id);
      showSuccess("User Suspended", `${user.full_name} has been suspended.`);
      refreshCurrentPage();
    } catch (err) {
      showSuccess("Action Failed", err.message || "Failed to suspend user");
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
    <div className="ad-form-group" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {options ? (
        <select
          className="ad-form-select"
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
          className="ad-form-input"
          type={type}
          value={formData[name] || ""}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          placeholder={label}
        />
      )}
      {formErrors[name] && (
        <p style={{ color: "var(--ad-destructive)", fontSize: 12, marginTop: 4 }}>
          {Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="ad-page-section">
      <div className="ad-page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all platform users</p>
        </div>
        <button className="ad-btn ad-btn-primary" onClick={openAddModal}>
          <Plus style={{ height: 16, width: 16 }} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="ad-filters-row">
        <div className="ad-search-box">
          <Search style={{ height: 16, width: 16, color: "var(--ad-muted-foreground)" }} />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="ad-filter-group">
          {["all", "admin", "guardian", "child"].map((r) => (
            <button
              key={r}
              className={`ad-filter-btn ${roleFilter === r ? "ad-active" : ""}`}
              onClick={() => handleRoleFilterChange(r)}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ad-glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div className="ad-spinner" />
          </div>
        ) : (
          <>
            <div className="ad-data-table-wrapper">
              <table className="ad-data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th className="ad-th-hide-md">Status</th>
                    <th className="ad-th-hide-lg">Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                        <p className="ad-text-muted">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="ad-table-user-cell">
                            <div className="ad-table-avatar">
                              {user.full_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="ad-table-user-name">{user.full_name}</div>
                              <div className="ad-table-user-username">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`ad-badge ${roleBadge[user.role] || "ad-badge-muted"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="ad-td-hide-md">
                          <span className={`ad-badge ${statusBadge[user.status] || "ad-badge-muted"}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="ad-td-hide-lg ad-text-muted ad-text-sm">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <div className="ad-table-actions">
                            <button className="ad-btn-ghost" title="View" onClick={() => openViewModal(user)}>
                              <Eye style={{ height: 16, width: 16 }} />
                            </button>
                            <button className="ad-btn-ghost" title="Edit" onClick={() => openEditModal(user)}>
                              <Edit2 style={{ height: 16, width: 16 }} />
                            </button>
                            <button
                              className="ad-btn-ghost"
                              title="Send Notification"
                              onClick={() => openNotifyModal(user)}
                              style={{ color: "var(--ad-info)" }}
                            >
                              <Bell style={{ height: 16, width: 16 }} />
                            </button>
                            {user.status !== "active" ? (
                              <button className="ad-btn-success" title="Activate" onClick={() => handleActivate(user)}>
                                <CheckCircle style={{ height: 16, width: 16 }} />
                              </button>
                            ) : (
                              <button className="ad-btn-danger" title="Suspend" onClick={() => handleSuspend(user)}>
                                <XCircle style={{ height: 16, width: 16 }} />
                              </button>
                            )}
                            <button className="ad-btn-danger" title="Delete" onClick={() => setDeleteModal({ open: true, user })}>
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
              <div className="ad-table-pagination">
                <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
                <div className="ad-table-pagination-btns">
                  <button disabled={pagination.current_page === 1} onClick={() => fetchUsers(pagination.current_page - 1, roleFilter, search)}>
                    <ChevronLeft style={{ height: 16, width: 16 }} />
                  </button>
                  <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchUsers(pagination.current_page + 1, roleFilter, search)}>
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
        footer={(
          <>
            <button className="ad-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="ad-btn ad-btn-primary" onClick={handleAddUser} disabled={formLoading}>
              {formLoading ? "Creating..." : "Create User"}
            </button>
          </>
        )}
      >
        {formErrors.general && <p style={{ color: "var(--ad-destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
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
        {formData.role === "guardian" && (
          <>
            {renderFormField("Guardian Type", "guardian_type", "text", [
              { value: "parent", label: "Parent" },
              { value: "therapist", label: "Therapist" },
            ])}
            {renderFormField("Phone Number", "phone_number", "tel")}
          </>
        )}
        {formData.role === "child" && renderFormField("Date of Birth", "date_of_birth", "date")}
        {renderFormField("Password", "password", "password")}
        {renderFormField("Confirm Password", "password_confirmation", "password")}
      </Modal>

      {/* ===== EDIT USER MODAL ===== */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, user: null })}
        title={`Edit User — ${editModal.user?.full_name || ""}`}
        footer={(
          <>
            <button className="ad-btn-cancel" onClick={() => setEditModal({ open: false, user: null })}>Cancel</button>
            <button className="ad-btn ad-btn-primary" onClick={handleEditUser} disabled={formLoading}>
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      >
        {formErrors.general && <p style={{ color: "var(--ad-destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
        {renderFormField("Full Name", "full_name")}
        {renderFormField("Username", "username")}
        {renderFormField("Status", "status", "text", [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ])}
        {(editModal.user?.role === "admin" || editModal.user?.role === "guardian") && renderFormField("Email", "email", "email")}
        {editModal.user?.role === "guardian" && (
          <>
            {renderFormField("Guardian Type", "guardian_type", "text", [
              { value: "parent", label: "Parent" },
              { value: "therapist", label: "Therapist" },
            ])}
            {renderFormField("Phone Number", "phone_number", "tel")}
          </>
        )}
        {editModal.user?.role === "child" && (
          <>
            {renderFormField("Date of Birth", "date_of_birth", "date")}
            {renderFormField("Total Coins", "total_coins", "number")}
          </>
        )}
        <div style={{ borderTop: "1px solid var(--ad-border)", paddingTop: 12, marginTop: 8 }}>
          <p className="ad-text-muted ad-text-sm" style={{ marginBottom: 8 }}>Change Password (leave blank to keep current)</p>
          {renderFormField("New Password", "password", "password")}
          {renderFormField("Confirm Password", "password_confirmation", "password")}
        </div>
      </Modal>

      {/* ===== VIEW USER MODAL ===== */}
      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, user: null })} title="User Details">
        {viewLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="ad-spinner" />
            <p className="ad-text-muted" style={{ marginTop: 12, fontSize: 13 }}>Loading user details...</p>
          </div>
        ) : viewModal.user && (() => {
          const u = viewModal.user;
          const roleColors = { admin: "#6c5ce7", guardian: "#00a896", child: "#3282dc" };
          const avatarBg = roleColors[u.role] || "#888";
          const guardianChildren = u.guardian?.children || [];
          const childGuardians = u.child?.guardians || [];

          return (
            <div>
              {/* Header with avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: 16, background: "var(--ad-muted)", borderRadius: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
                  {u.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ad-foreground)" }}>{u.full_name}</div>
                  <div style={{ fontSize: 13, color: "var(--ad-muted-foreground)", marginTop: 2 }}>@{u.username}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <span className={`ad-badge ${roleBadge[u.role]}`}>{u.role}</span>
                    {u.role === "guardian" && u.guardian?.guardian_type && (
                      <span className={`ad-badge ${u.guardian.guardian_type === "therapist" ? "ad-badge-info" : "ad-badge-accent"}`}>{u.guardian.guardian_type}</span>
                    )}
                    <span className={`ad-badge ${statusBadge[u.status]}`}>{u.status}</span>
                  </div>
                </div>
              </div>

              {/* ═══ SECTION: Account ═══ */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Account</div>
              <div className="ad-modal-field"><div className="ad-modal-field-label">User ID</div><div className="ad-modal-field-value">#{u.id}</div></div>
              <div className="ad-modal-field"><div className="ad-modal-field-label"><Calendar style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Joined</div><div className="ad-modal-field-value">{u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</div></div>
              {u.updated_at && u.updated_at !== u.created_at && (
                <div className="ad-modal-field"><div className="ad-modal-field-label">Last Updated</div><div className="ad-modal-field-value">{new Date(u.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div></div>
              )}

              {/* ═══ ADMIN-SPECIFIC ═══ */}
              {u.role === "admin" && u.admin && (
                <>
                  <div style={{ height: 1, background: "var(--ad-border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                    <Shield style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Admin Profile
                  </div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label"><Mail style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Email</div><div className="ad-modal-field-value">{u.admin.email || "—"}</div></div>
                </>
              )}

              {/* ═══ GUARDIAN-SPECIFIC (Parent or Therapist) ═══ */}
              {u.role === "guardian" && u.guardian && (
                <>
                  <div style={{ height: 1, background: "var(--ad-border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                    <UserCheck style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />
                    {u.guardian.guardian_type === "therapist" ? "Therapist" : "Parent"} Profile
                  </div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label"><Mail style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Email</div><div className="ad-modal-field-value">{u.guardian.email || "—"}</div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label"><Phone style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Phone</div><div className="ad-modal-field-value">{u.guardian.phone_number || "—"}</div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label">Guardian Type</div><div className="ad-modal-field-value"><span className={`ad-badge ${u.guardian.guardian_type === "therapist" ? "ad-badge-info" : "ad-badge-primary"}`} style={{ fontSize: 12 }}>{u.guardian.guardian_type}</span></div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label">Guardian ID</div><div className="ad-modal-field-value">#{u.guardian.id}</div></div>

                  {/* Linked Children */}
                  <div style={{ height: 1, background: "var(--ad-border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                    <Link2 style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />
                    Linked Children ({guardianChildren.length})
                  </div>
                  {guardianChildren.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {guardianChildren.map((child) => (
                        <div key={child.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--ad-muted)", borderRadius: 10, border: "1px solid var(--ad-border)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3282dc, #3282dcaa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {child.user?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ad-foreground)" }}>{child.user?.full_name || "Unknown"}</div>
                            <div style={{ fontSize: 11, color: "var(--ad-muted-foreground)" }}>
                              @{child.user?.username || "—"} · {child.date_of_birth ? Math.floor((new Date() - new Date(child.date_of_birth)) / (365.25*24*60*60*1000)) + " yrs" : "—"} · <Coins style={{ height: 11, width: 11, verticalAlign: "middle" }} /> {child.total_coins || 0}
                            </div>
                          </div>
                          <span className="ad-badge ad-badge-accent" style={{ fontSize: 10 }}>{child.pivot?.relation_type || u.guardian.guardian_type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "16px", background: "var(--ad-muted)", borderRadius: 10, textAlign: "center" }}>
                      <Baby style={{ height: 24, width: 24, color: "var(--ad-muted-foreground)", margin: "0 auto 6px" }} />
                      <p style={{ fontSize: 13, color: "var(--ad-muted-foreground)" }}>No children linked to this {u.guardian.guardian_type}</p>
                    </div>
                  )}
                </>
              )}

              {/* ═══ CHILD-SPECIFIC ═══ */}
              {u.role === "child" && u.child && (
                <>
                  <div style={{ height: 1, background: "var(--ad-border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                    <Baby style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Child Profile
                  </div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label"><Calendar style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Date of Birth</div><div className="ad-modal-field-value">{u.child.date_of_birth ? new Date(u.child.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label">Age</div><div className="ad-modal-field-value">{u.child.date_of_birth ? Math.floor((new Date() - new Date(u.child.date_of_birth)) / (365.25*24*60*60*1000)) + " years old" : "—"}</div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label"><Coins style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />Total Coins</div><div className="ad-modal-field-value"><span style={{ color: "#e6a014", fontWeight: 700, fontSize: 16 }}>{u.child.total_coins || 0}</span></div></div>
                  <div className="ad-modal-field"><div className="ad-modal-field-label">Child ID</div><div className="ad-modal-field-value">#{u.child.id}</div></div>

                  {/* Linked Guardians */}
                  <div style={{ height: 1, background: "var(--ad-border)", margin: "16px 0" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                    <Link2 style={{ height: 13, width: 13, marginRight: 4, verticalAlign: "middle" }} />
                    Linked Guardians ({childGuardians.length})
                  </div>
                  {childGuardians.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {childGuardians.map((g) => (
                        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--ad-muted)", borderRadius: 10, border: "1px solid var(--ad-border)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${g.guardian_type === "therapist" ? "#6c5ce7" : "#00a896"}, ${g.guardian_type === "therapist" ? "#6c5ce7aa" : "#00a896aa"})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {g.user?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ad-foreground)" }}>{g.user?.full_name || "Unknown"}</div>
                            <div style={{ fontSize: 11, color: "var(--ad-muted-foreground)" }}>
                              {g.email || "—"} · {g.phone_number || "—"}
                            </div>
                          </div>
                          <span className={`ad-badge ${g.guardian_type === "therapist" ? "ad-badge-info" : "ad-badge-primary"}`} style={{ fontSize: 10 }}>{g.guardian_type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "16px", background: "var(--ad-muted)", borderRadius: 10, textAlign: "center" }}>
                      <Shield style={{ height: 24, width: 24, color: "var(--ad-muted-foreground)", margin: "0 auto 6px" }} />
                      <p style={{ fontSize: 13, color: "var(--ad-muted-foreground)" }}>No guardians linked to this child</p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal open={deleteModal.open} onClose={() => { setDeleteModal({ open: false, user: null }); setDeleteError(""); }} title="Delete User"
        footer={(
          <>
            <button className="ad-btn-cancel" onClick={() => { setDeleteModal({ open: false, user: null }); setDeleteError(""); }}>Cancel</button>
            <button className="ad-btn-confirm-delete" onClick={handleDeleteUser} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete User"}</button>
          </>
        )}
      >
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trash2 style={{ height: 28, width: 28, color: "#ef4444" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ad-foreground)", marginBottom: 8 }}>Delete {deleteModal.user?.full_name}?</p>
          <p style={{ fontSize: 13, color: "var(--ad-muted-foreground)", lineHeight: 1.6 }}>
            This will permanently remove this {deleteModal.user?.role} account and all associated data. This action cannot be undone.
          </p>
          {deleteError && (
            <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
              <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{deleteError}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== SUCCESS TOAST ===== */}
      {successToast.show && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 10000,
          background: "var(--ad-card)", border: "1px solid var(--ad-border)",
          borderLeft: "4px solid #10b981", borderRadius: 12,
          padding: "16px 20px", minWidth: 320, maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", alignItems: "flex-start", gap: 12,
          animation: "slideInRight 0.3s ease-out",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle style={{ height: 20, width: 20, color: "#10b981" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ad-foreground)", margin: 0 }}>{successToast.message}</p>
            {successToast.detail && <p style={{ fontSize: 12, color: "var(--ad-muted-foreground)", margin: "4px 0 0" }}>{successToast.detail}</p>}
          </div>
        </div>
      )}
      <style>{`@keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      {/* ===== SEND NOTIFICATION MODAL ===== */}
      <Modal
        open={notifyModal.open}
        onClose={() => setNotifyModal({ open: false, user: null })}
        title={`Send Notification`}
        footer={
          !notifySuccess ? (
            <>
              <button className="ad-btn-cancel" onClick={() => setNotifyModal({ open: false, user: null })}>Cancel</button>
              <button
                className="ad-btn ad-btn-primary"
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
            <CheckCircle style={{ height: 48, width: 48, color: "var(--ad-success)", margin: "0 auto 12px" }} />
            <p className="ad-font-semibold" style={{ fontSize: 16, color: "var(--ad-foreground)" }}>Notification Sent!</p>
            <p className="ad-text-muted ad-text-sm" style={{ marginTop: 4 }}>
              Successfully sent to {notifyModal.user?.full_name}
            </p>
          </div>
        ) : (
          <div className="ad-compose-form">
            {notifyModal.user && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, background: "var(--ad-muted)", marginBottom: 4,
              }}>
                <div className="ad-table-avatar" style={{ height: 32, width: 32, fontSize: 12 }}>
                  {notifyModal.user.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="ad-font-medium ad-text-sm" style={{ color: "var(--ad-foreground)" }}>{notifyModal.user.full_name}</p>
                  <p className="ad-text-xs ad-text-muted">{notifyModal.user.role} — @{notifyModal.user.username}</p>
                </div>
              </div>
            )}
            <div className="ad-form-group">
              <label>Type</label>
              <select className="ad-form-select" value={notifyData.type} onChange={(e) => setNotifyData({ ...notifyData, type: e.target.value })}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="ad-form-group">
              <label>Title</label>
              <input className="ad-form-input" type="text" placeholder="Notification title" value={notifyData.title} onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })} />
            </div>
            <div className="ad-form-group">
              <label>Message</label>
              <textarea className="ad-form-input" placeholder="Write your notification message..." value={notifyData.message} onChange={(e) => setNotifyData({ ...notifyData, message: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;