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
  const [voiceStats, setVoiceStats] = useState({ totalAttempts: 0, avgAccuracy: 0, avgDuration: 0, avgSpeechRate: 0 });

  useEffect(() => {
    fetchInstructions();
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
      // Use global_performance from the same response
      if (res.global_performance) {
        setVoiceStats({
          totalAttempts: res.global_performance.total_attempts || 0,
          avgAccuracy: res.global_performance.avg_accuracy || 0,
          avgDuration: res.global_performance.avg_duration || 0,
          avgSpeechRate: res.global_performance.avg_speech_rate || 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch voice instructions:", err);
    } finally {
      setLoading(false);
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

  const defaultForm = () => ({ title: "", description: "", story_slug: "", story_content: "", page_count: "", cover_image_url: "", reward_coins: "", is_active: true });

  const openAddModal = () => { setFormData(defaultForm()); setFormErrors({}); setAddModal(true); };

  const handleAdd = async () => {
    setFormErrors({});

    // Frontend validation
    const errors = {};
    if (!formData.title?.trim()) errors.title = "Title is required.";
    if (!formData.description?.trim()) errors.description = "Description is required.";

    const rewardCoins = parseInt(formData.reward_coins);
    if (!formData.reward_coins || isNaN(rewardCoins) || rewardCoins < 1) {
      errors.reward_coins = "Reward coins must be a positive integer (min 1).";
    } else if (rewardCoins > 1000) {
      errors.reward_coins = "Reward coins cannot exceed 1000.";
    }

    const pageCount = formData.page_count ? parseInt(formData.page_count) : null;
    if (formData.page_count && (isNaN(pageCount) || pageCount < 1)) {
      errors.page_count = "Page count must be a positive integer (min 1).";
    }

    let storyContent = null;
    if (formData.story_content && typeof formData.story_content === "string" && formData.story_content.trim()) {
      try {
        storyContent = JSON.parse(formData.story_content);
        if (!Array.isArray(storyContent)) {
          errors.story_content = "Story content must be a JSON array. Example: [{\"text\":\"Page 1 text\"}]";
          storyContent = null;
        }
      } catch {
        errors.story_content = "Invalid JSON format. Example: [{\"text\":\"Page 1 text\"},{\"text\":\"Page 2 text\"}]";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reward_coins: rewardCoins,
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      if (formData.story_slug?.trim()) payload.story_slug = formData.story_slug.trim();
      if (storyContent) payload.story_content = storyContent;
      if (pageCount) payload.page_count = pageCount;
      if (formData.cover_image_url?.trim()) payload.cover_image_url = formData.cover_image_url.trim();

      await adminService.createVoiceInstruction(payload);
      setAddModal(false);
      fetchInstructions(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.data?.message || err.message || "Failed to create voice instruction." });
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (item) => {
    setFormData({
      title: item.title || "", description: item.description || "",
      story_slug: item.story_slug || "",
      story_content: item.story_content ? JSON.stringify(item.story_content, null, 2) : "",
      page_count: item.page_count || "",
      cover_image_url: item.cover_image_url || "",
      reward_coins: item.reward_coins || "", is_active: item.is_active,
    });
    setFormErrors({});
    setEditModal({ open: true, item });
  };

  const handleEdit = async () => {
    setFormErrors({});

    const errors = {};
    if (!formData.title?.trim()) errors.title = "Title is required.";
    if (!formData.description?.trim()) errors.description = "Description is required.";

    const rewardCoins = parseInt(formData.reward_coins);
    if (!formData.reward_coins || isNaN(rewardCoins) || rewardCoins < 1) {
      errors.reward_coins = "Reward coins must be a positive integer (min 1).";
    } else if (rewardCoins > 1000) {
      errors.reward_coins = "Reward coins cannot exceed 1000.";
    }

    const pageCount = formData.page_count ? parseInt(formData.page_count) : null;
    if (formData.page_count && (isNaN(pageCount) || pageCount < 1)) {
      errors.page_count = "Page count must be a positive integer (min 1).";
    }

    let storyContent = undefined;
    if (formData.story_content && typeof formData.story_content === "string" && formData.story_content.trim()) {
      try {
        storyContent = JSON.parse(formData.story_content);
        if (!Array.isArray(storyContent)) {
          errors.story_content = "Story content must be a JSON array.";
          storyContent = undefined;
        }
      } catch {
        errors.story_content = "Invalid JSON format.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        reward_coins: rewardCoins,
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      if (formData.story_slug?.trim()) payload.story_slug = formData.story_slug.trim();
      if (storyContent) payload.story_content = storyContent;
      if (pageCount) payload.page_count = pageCount;
      if (formData.cover_image_url !== undefined) payload.cover_image_url = formData.cover_image_url?.trim() || null;

      await adminService.updateVoiceInstruction(editModal.item.id, payload);
      setEditModal({ open: false, item: null });
      fetchInstructions(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.data?.message || err.message || "Failed to update voice instruction." });
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

  const renderField = (label, name, type = "text", options = null, extra = {}) => (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label>{label}{extra.required && <span style={{ color: "var(--destructive)" }}> *</span>}</label>
      {extra.hint && <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "2px 0 6px" }}>{extra.hint}</p>}
      {options ? (
        <select className="form-select" value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}>
          {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ) : type === "textarea" ? (
        <textarea className="form-input" value={formData[name] || ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={extra.placeholder || label} rows={extra.rows || 3} style={extra.style || {}} />
      ) : (
        <input className="form-input" type={type} value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={extra.placeholder || label} min={type === "number" ? "1" : undefined} step={type === "number" ? "1" : undefined} />
      )}
      {formErrors[name] && <p style={{ color: "var(--destructive)", fontSize: 12, marginTop: 4 }}>{Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}</p>}
    </div>
  );

  const formFields = () => (
    <>
      {formErrors.general && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ color: "#b91c1c", fontSize: 13, margin: 0 }}>{formErrors.general}</p></div>}
      {renderField("Title", "title", "text", null, { required: true, placeholder: "e.g. Ginger The Giraffe" })}
      {renderField("Description", "description", "textarea", null, { required: true, placeholder: "Brief description of the story" })}
      {renderField("Story Slug", "story_slug", "text", null, { hint: "URL-friendly identifier (auto-generated from title if empty). Must match the slug in storiesData.js", placeholder: "ginger-the-giraffe" })}
      {renderField("Page Count", "page_count", "number", null, { hint: "Number of pages in the story (positive integer)", placeholder: "e.g. 4" })}
      {renderField("Reward Coins", "reward_coins", "number", null, { required: true, hint: "Maximum coins a child can earn when reading this story (1–1000)", placeholder: "e.g. 50" })}
      {renderField("Cover Image URL", "cover_image_url", "text", null, { hint: "Optional URL for the story cover image", placeholder: "https://..." })}
      {renderField("Story Content (JSON)", "story_content", "textarea", null, { hint: "Optional. JSON array of pages. Leave empty if story content is static in the frontend.", rows: 4, style: { fontFamily: "monospace", fontSize: 12 }, placeholder: "[{\"text\":\"Once upon a time...\"}]" })}
      {renderField("Status", "is_active", "text", [{ value: true, label: "Active" }, { value: false, label: "Inactive" }])}
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
            <div className="admin-summary-card-label">Total Stories</div>
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
            <div className="admin-summary-card-label">Total Readings</div>
            <div className="admin-summary-card-value">{voiceStats.totalAttempts.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon info"><Target style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Avg Score</div>
            <div className="admin-summary-card-value">{voiceStats.avgAccuracy}%</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon primary"><Clock style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Avg Duration</div>
            <div className="admin-summary-card-value">{voiceStats.avgDuration}s</div>
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
                <div className="entity-card-stat"><div className="entity-card-stat-label">Pages</div><div className="entity-card-stat-value">{item.page_count || 0}</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Max Coins</div><div className="entity-card-stat-value accent">{item.reward_coins}</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Attempts</div><div className="entity-card-stat-value">{item.computed_stats?.total_attempts || 0}</div></div>
              </div>
              <div className="entity-card-stats" style={{ marginTop: 0 }}>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Avg Score</div><div className="entity-card-stat-value">{item.computed_stats?.avg_accuracy || 0}%</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Avg Duration</div><div className="entity-card-stat-value">{item.computed_stats?.avg_duration || 0}s</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Slug</div><div className="entity-card-stat-value" style={{ fontSize: 11 }}>{item.story_slug || "—"}</div></div>
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
        {viewModal.item && (() => {
          const vi = viewModal.item;
          const cs = vi.computed_stats || {};
          const hasStats = cs.total_attempts > 0;
          const accuracyPct = cs.avg_accuracy || 0;
          const pronPct = cs.avg_pronunciation || 0;
          const barColor = (v) => v >= 90 ? "#00b894" : v >= 70 ? "#0984e3" : v >= 50 ? "#fdcb6e" : "#e17055";
          return (
            <div>
              {/* Hero Header */}
              <div style={{
                background: "linear-gradient(135deg, #6c5ce7 0%, #0984e3 50%, #00b894 100%)",
                borderRadius: 16, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "absolute", bottom: -30, left: "40%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <BookOpen style={{ height: 28, width: 28, color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{vi.title}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{
                        background: vi.is_active ? "rgba(0,184,148,0.3)" : "rgba(255,255,255,0.15)",
                        color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}>{vi.is_active ? "✓ Active" : "Inactive"}</span>
                      {vi.story_slug && (
                        <span style={{
                          background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 600,
                          padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)",
                          fontFamily: "monospace",
                        }}>{vi.story_slug}</span>
                      )}
                      <span style={{
                        background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)",
                      }}>{vi.page_count || 0} pages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              {hasStats ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Readings", value: cs.total_attempts, color: "#6c5ce7", icon: "📖" },
                    { label: "Avg Duration", value: `${cs.avg_duration || 0}s`, color: "#e84393", icon: "⏱" },
                    { label: "Coins Awarded", value: cs.total_coins || 0, color: "#fdcb6e", icon: "🪙" },
                  ].map((m, i) => (
                    <div key={i} style={{
                      textAlign: "center", padding: "14px 8px", background: "var(--muted)", borderRadius: 12,
                      border: "1px solid var(--border)", transition: "transform 0.15s",
                    }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.color, marginTop: 2 }}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</div>
                      <div style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: "center", padding: "24px 16px", background: "var(--muted)", borderRadius: 12,
                  marginBottom: 20, border: "1px dashed var(--border)",
                }}>
                  <Mic style={{ height: 32, width: 32, color: "var(--muted-foreground)", marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>No reading attempts yet</p>
                </div>
              )}

              {/* Accuracy & Pronunciation Bars */}
              {hasStats && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Reading Quality</div>
                  {[
                    { label: "Accuracy", value: accuracyPct, desc: "Correct words ÷ total words" },
                    { label: "Pronunciation", value: pronPct, desc: "Correct spoken ÷ words attempted" },
                  ].map((bar, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{bar.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: barColor(bar.value) }}>{Math.round(bar.value)}%</span>
                      </div>
                      <div style={{ height: 10, background: "var(--muted)", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(bar.value, 100)}%`,
                          background: `linear-gradient(90deg, ${barColor(bar.value)}, ${barColor(bar.value)}cc)`,
                          borderRadius: 5, transition: "width 0.6s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>{bar.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Engagement Metrics */}
              {hasStats && (cs.avg_speaker_clicks > 0 || cs.avg_word_clicks > 0 || cs.avg_speech_rate > 0) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Help & Engagement</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { icon: "🔊", label: "Avg Read-Alouds", value: cs.avg_speaker_clicks || 0 },
                      { icon: "👆", label: "Avg Word Taps", value: cs.avg_word_clicks || 0 },
                      { icon: "🗣️", label: "Avg Speech Rate", value: `${cs.avg_speech_rate || 0} wpm` },
                      { icon: "⏸️", label: "Avg Pause Time", value: `${Math.round(cs.avg_pause_duration || 0)}s` },
                    ].map((m, i) => (
                      <div key={i} style={{
                        background: "var(--card-hover)", borderRadius: 10, padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)",
                      }}>
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600 }}>{m.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)" }}>{m.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description & Details */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Details</div>
              <div className="modal-field"><div className="modal-field-label">Description</div><div className="modal-field-value" style={{ lineHeight: 1.7 }}>{vi.description || "—"}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <div className="modal-field">
                  <div className="modal-field-label">Max Reward</div>
                  <div className="modal-field-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Coins style={{ height: 14, width: 14, color: "#e6a014" }} />
                    <span style={{ fontWeight: 700, color: "#e6a014" }}>{vi.reward_coins}</span> coins
                  </div>
                </div>
                <div className="modal-field">
                  <div className="modal-field-label">Created</div>
                  <div className="modal-field-value">{vi.created_at ? new Date(vi.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, item: null })} title="Delete Voice Instruction" footer={<><button className="btn-cancel" onClick={() => setDeleteModal({ open: false, item: null })}>Cancel</button><button className="btn-confirm-delete" onClick={handleDelete} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete"}</button></>}>
        <p style={{ fontSize: 14, color: "var(--foreground)" }}>Are you sure you want to delete <strong>{deleteModal.item?.title}</strong>? Instructions with existing voice attempts cannot be deleted.</p>
      </Modal>
    </div>
  );
};

export default AdminVoiceInstructions;