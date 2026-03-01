import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  Power,
  Mic,
  Target,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const AdminVoiceInstructions = () => {
  const [instructions, setInstructions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [viewModal, setViewModal] = useState({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });

  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Extra metrics
  const [voiceStats, setVoiceStats] = useState({ totalAttempts: 0, avgAccuracy: 0 });

  useEffect(() => {
    fetchInstructions();
    fetchVoiceStats();
  }, []);

  const fetchInstructions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getVoiceInstructions({ page });
      const data = res.instructions || res;
      setInstructions(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to,
      });
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error("Failed to fetch voice instructions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceStats = async () => {
    try {
      const metrics = await adminService.getSystemMetrics();
      const perf = metrics?.performance_stats || {};
      setVoiceStats({
        totalAttempts: perf.total_voice_attempts || 0,
        avgAccuracy: perf.avg_voice_accuracy || 0,
      });
      // Also update stats if available from voice_instruction_stats
      if (metrics?.voice_instruction_stats) {
        setStats((prev) => ({
          total: metrics.voice_instruction_stats.total || prev.total,
          active: metrics.voice_instruction_stats.active || prev.active,
          inactive: metrics.voice_instruction_stats.inactive || prev.inactive,
        }));
      }
    } catch {
      // silent
    }
  };

  const filteredInstructions = instructions.filter((i) => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase());
    const matchActive =
      activeFilter === "all" ||
      (activeFilter === "active" && i.is_active) ||
      (activeFilter === "inactive" && !i.is_active);
    return matchSearch && matchActive;
  });

  const defaultForm = () => ({ title: "", description: "", avg_duration: "", reward_coins: "", is_active: true });

  const openAddModal = () => { setFormData(defaultForm()); setFormErrors({}); setAddModal(true); };

  const handleAdd = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      await adminService.createVoiceInstruction({
        ...formData,
        avg_duration: parseInt(formData.avg_duration),
        reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      });
      setAddModal(false);
      fetchInstructions(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (item) => {
    setFormData({
      title: item.title || "", description: item.description || "",
      avg_duration: item.avg_duration || "", reward_coins: item.reward_coins || "", is_active: item.is_active,
    });
    setFormErrors({});
    setEditModal({ open: true, item });
  };

  const handleEdit = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      await adminService.updateVoiceInstruction(editModal.item.id, {
        title: formData.title, description: formData.description,
        avg_duration: parseInt(formData.avg_duration), reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      });
      setEditModal({ open: false, item: null });
      fetchInstructions(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await adminService.deleteVoiceInstruction(deleteModal.item.id);
      setDeleteModal({ open: false, item: null });
      fetchInstructions(pagination.current_page);
    } catch (err) {
      alert(err.data?.message || err.message || "Failed to delete");
    } finally {
      setFormLoading(false);
    }
  };

  const renderField = (label, name, type = "text", options = null) => (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {options ? (
        <select className="form-select" value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}>
          {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ) : type === "textarea" ? (
        <textarea className="form-input" value={formData[name] || ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={label} />
      ) : (
        <input className="form-input" type={type} value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={label} />
      )}
      {formErrors[name] && <p style={{ color: "var(--destructive)", fontSize: 12, marginTop: 4 }}>{Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}</p>}
    </div>
  );

  const formFields = () => (
    <>
      {formErrors.general && <p style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
      {renderField("Title", "title")}
      {renderField("Description", "description", "textarea")}
      {renderField("Avg Duration (seconds)", "avg_duration", "number")}
      {renderField("Reward Coins", "reward_coins", "number")}
      {renderField("Active", "is_active", "text", [{ value: true, label: "Active" }, { value: false, label: "Inactive" }])}
    </>
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1>Voice Instructions</h1>
          <p>Manage speech therapy voice instructions</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus style={{ height: 16, width: 16 }} />
          Add Instruction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-summary-cards">
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon primary"><BookOpen style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Total Instructions</div>
            <div className="admin-summary-card-value">{stats.total}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon success"><Power style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Active</div>
            <div className="admin-summary-card-value">{stats.active}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon accent"><Mic style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Total Attempts</div>
            <div className="admin-summary-card-value">{voiceStats.totalAttempts.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon info"><Target style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Avg Accuracy</div>
            <div className="admin-summary-card-value">{voiceStats.avgAccuracy}%</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-box">
          <Search style={{ height: 16, width: 16, color: "var(--muted-foreground)" }} />
          <input placeholder="Search instructions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          {["all", "active", "inactive"].map((f) => (
            <button key={f} className={`filter-btn ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><div className="admin-spinner" /></div>
      ) : filteredInstructions.length === 0 ? (
        <div className="glass-card empty-state"><BookOpen style={{ height: 40, width: 40 }} /><p>No voice instructions found</p></div>
      ) : (
        <div className="grid-cards">
          {filteredInstructions.map((item) => (
            <div key={item.id} className="entity-card">
              <div className="entity-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="entity-card-title">{item.title}</div>
                  <div className="entity-card-badges">
                    <span className={`badge ${item.is_active ? "badge-success" : "badge-muted"}`}>{item.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className={`status-dot ${item.is_active ? "active" : "inactive"}`} />
              </div>
              <p className="text-muted text-sm" style={{ marginBottom: 12, lineHeight: 1.5 }}>{item.description?.slice(0, 120)}{item.description?.length > 120 ? "..." : ""}</p>
              <div className="entity-card-stats">
                <div className="entity-card-stat"><div className="entity-card-stat-label">Duration</div><div className="entity-card-stat-value">{item.avg_duration}s</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Coins</div><div className="entity-card-stat-value accent">{item.reward_coins}</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">ID</div><div className="entity-card-stat-value">#{item.id}</div></div>
              </div>
              <div className="entity-card-footer">
                <div className="entity-card-meta"><Clock style={{ height: 12, width: 12 }} />{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</div>
                <div className="entity-card-actions" style={{ opacity: 1 }}>
                  <button className="btn-ghost" onClick={() => setViewModal({ open: true, item })}><Eye style={{ height: 16, width: 16 }} /></button>
                  <button className="btn-ghost" onClick={() => openEditModal(item)}><Edit2 style={{ height: 16, width: 16 }} /></button>
                  <button className="btn-danger" onClick={() => setDeleteModal({ open: true, item })}><Trash2 style={{ height: 16, width: 16 }} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="glass-card" style={{ padding: 0 }}>
          <div className="table-pagination">
            <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
            <div className="table-pagination-btns">
              <button disabled={pagination.current_page === 1} onClick={() => fetchInstructions(pagination.current_page - 1)}><ChevronLeft style={{ height: 16, width: 16 }} /></button>
              <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchInstructions(pagination.current_page + 1)}><ChevronRight style={{ height: 16, width: 16 }} /></button>
            </div>
          </div>
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Voice Instruction" footer={<><button className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={formLoading}>{formLoading ? "Creating..." : "Create"}</button></>}>{formFields()}</Modal>
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, item: null })} title={`Edit — ${editModal.item?.title || ""}`} footer={<><button className="btn-cancel" onClick={() => setEditModal({ open: false, item: null })}>Cancel</button><button className="btn btn-primary" onClick={handleEdit} disabled={formLoading}>{formLoading ? "Saving..." : "Save Changes"}</button></>}>{formFields()}</Modal>
      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, item: null })} title="Voice Instruction Details">
        {viewModal.item && (
          <div>
            <div className="modal-field"><div className="modal-field-label">Title</div><div className="modal-field-value">{viewModal.item.title}</div></div>
            <div className="modal-field"><div className="modal-field-label">Description</div><div className="modal-field-value" style={{ lineHeight: 1.6 }}>{viewModal.item.description || "—"}</div></div>
            <div className="modal-field"><div className="modal-field-label">Avg Duration</div><div className="modal-field-value">{viewModal.item.avg_duration}s</div></div>
            <div className="modal-field"><div className="modal-field-label">Reward Coins</div><div className="modal-field-value">{viewModal.item.reward_coins}</div></div>
            <div className="modal-field"><div className="modal-field-label">Status</div><div className="modal-field-value"><span className={`badge ${viewModal.item.is_active ? "badge-success" : "badge-muted"}`}>{viewModal.item.is_active ? "Active" : "Inactive"}</span></div></div>
            <div className="modal-field"><div className="modal-field-label">Created</div><div className="modal-field-value">{viewModal.item.created_at ? new Date(viewModal.item.created_at).toLocaleString() : "—"}</div></div>
          </div>
        )}
      </Modal>
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} title="Delete Voice Instruction" footer={<><button className="btn-cancel" onClick={() => setDeleteModal({ open: false, item: null })}>Cancel</button><button className="btn-confirm-delete" onClick={handleDelete} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete"}</button></>}>
        <p style={{ fontSize: 14, color: "var(--foreground)" }}>Are you sure you want to delete <strong>{deleteModal.item?.title}</strong>? Instructions with existing voice attempts cannot be deleted.</p>
      </Modal>
    </div>
  );
};

export default AdminVoiceInstructions;