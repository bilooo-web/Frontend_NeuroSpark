import { useState, useEffect } from "react";
import {
  Gamepad2,
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
  BarChart3,
  Star,
  Link2,
  CheckCircle,
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";
import gameRegistry from "../data/gameRegistry";

const typeBadge = {
  cognitive: "ad-badge-primary",
  focus: "ad-badge-info",
  memory: "ad-badge-accent",
  emotional: "ad-badge-success",
  organizational: "ad-badge-muted",
};

const AdminGames = () => {
  const [games, setGames] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, game: null });
  const [viewModal, setViewModal] = useState({ open: false, game: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, game: null });

  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successToast, setSuccessToast] = useState({ show: false, message: "", detail: "" });

  const showSuccess = (message, detail = "") => {
    setSuccessToast({ show: true, message, detail });
    setTimeout(() => setSuccessToast({ show: false, message: "", detail: "" }), 2500);
  };

  const [gameStats, setGameStats] = useState({ total: 0, active: 0, totalSessions: 0, avgScore: 0, overallAvgDuration: 0 });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getGames({ page });
      const gamesData = res.games || res;
      setGames(gamesData.data || []);
      setPagination({
        current_page: gamesData.current_page,
        last_page: gamesData.last_page,
        total: gamesData.total,
        from: gamesData.from,
        to: gamesData.to,
      });
      const gamesList = gamesData.data || [];
      const totalSess = gamesList.reduce((sum, g) => sum + (g.total_sessions || 0), 0);
      const avgScores = gamesList.filter(g => g.computed_avg_score > 0);
      const avgScoreVal = avgScores.length > 0 ? (avgScores.reduce((sum, g) => sum + g.computed_avg_score, 0) / avgScores.length).toFixed(1) : 0;
      setGameStats({
        total: gamesData.total || gamesList.length,
        active: gamesList.filter((g) => g.is_active).length,
        totalSessions: totalSess,
        avgScore: avgScoreVal,
        overallAvgDuration: res.overall_avg_duration || 0,
      });
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      setLoading(false);
    }
  };

  const computedStats = gameStats;

  const filteredGames = games.filter((g) => {
    const matchSearch = !search || g.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || g.type === typeFilter;
    return matchSearch && matchType;
  });

  const defaultFormData = () => ({
    name: "",
    game_slug: "",
    type: "cognitive",
    description: "",
    reward_coins: "",
    is_active: true,
  });

  const openAddModal = () => {
    setFormData(defaultFormData());
    setFormErrors({});
    setAddModal(true);
  };

  const isSlugDuplicate = (slug, excludeGameId = null) => {
    return games.some((g) => g.game_slug === slug && g.id !== excludeGameId);
  };

  const handleAddGame = async () => {
    setFormLoading(true);
    setFormErrors({});

    if (isSlugDuplicate(formData.game_slug)) {
      setFormErrors({ game_slug: "This game logic (slug) is already used by another game. Each slug must be unique." });
      setFormLoading(false);
      return;
    }

    if (!formData.reward_coins || parseInt(formData.reward_coins) < 1) {
      setFormErrors({ reward_coins: "Reward coins must be a positive number (1 or more)." });
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        game_slug: formData.game_slug,
        type: formData.type,
        description: formData.description,
        reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      await adminService.createGame(payload);
      setAddModal(false);
      showSuccess("Game Created Successfully", `${formData.name} has been added to the platform.`);
      fetchGames(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (game) => {
    setFormData({
      name: game.name || "",
      game_slug: game.game_slug || "",
      type: game.type || "cognitive",
      description: game.description || "",
      reward_coins: game.reward_coins || "",
      is_active: game.is_active,
    });
    setFormErrors({});
    setEditModal({ open: true, game });
  };

  const handleEditGame = async () => {
    setFormLoading(true);
    setFormErrors({});

    if (isSlugDuplicate(formData.game_slug, editModal.game?.id)) {
      setFormErrors({ game_slug: "This game logic (slug) is already used by another game. Each slug must be unique." });
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        game_slug: formData.game_slug,
        type: formData.type,
        description: formData.description,
        reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      await adminService.updateGame(editModal.game.id, payload);
      setEditModal({ open: false, game: null });
      showSuccess("Game Updated Successfully", `${formData.name} has been updated.`);
      fetchGames(pagination.current_page);
    } catch (err) {
      if (err.data?.errors) setFormErrors(err.data.errors);
      else setFormErrors({ general: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    setFormLoading(true);
    setDeleteError("");
    try {
      const deletedName = deleteModal.game?.name;
      await adminService.deleteGame(deleteModal.game.id);
      setDeleteModal({ open: false, game: null });
      showSuccess("Game Deleted Successfully", `${deletedName} has been removed from the platform.`);
      fetchGames(pagination.current_page);
    } catch (err) {
      setDeleteError(err.data?.message || err.message || "Failed to delete game");
    } finally {
      setFormLoading(false);
    }
  };

  const renderField = (label, name, type = "text", options = null) => (
    <div className="ad-form-group" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {options ? (
        <select className="ad-form-select" value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}>
          {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ) : type === "textarea" ? (
        <textarea className="ad-form-input" value={formData[name] || ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={label} />
      ) : (
        <input className="ad-form-input" type={type} value={formData[name] ?? ""} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} placeholder={label} />
      )}
      {formErrors[name] && (
        <p style={{ color: "var(--ad-destructive)", fontSize: 12, marginTop: 4 }}>{Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}</p>
      )}
    </div>
  );

  const renderSlugField = () => {
    const usedSlugs = games
      .filter((g) => g.id !== editModal.game?.id)
      .map((g) => g.game_slug);

    return (
      <div className="ad-form-group" style={{ marginBottom: 14 }}>
        <label>Game Logic (Frontend Component)</label>
        <select
          className="ad-form-select"
          value={formData.game_slug || ""}
          onChange={(e) => setFormData({ ...formData, game_slug: e.target.value })}
        >
          <option value="">— Select game logic —</option>
          {gameRegistry.map((g) => {
            const isUsed = usedSlugs.includes(g.slug);
            return (
              <option key={g.slug} value={g.slug} disabled={isUsed}>
                {g.label} ({g.slug}){isUsed ? " — Already used" : ""}
              </option>
            );
          })}
        </select>
        {formErrors.game_slug && (
          <p style={{ color: "var(--ad-destructive)", fontSize: 12, marginTop: 4 }}>
            {Array.isArray(formErrors.game_slug) ? formErrors.game_slug[0] : formErrors.game_slug}
          </p>
        )}
        <p className="ad-text-muted" style={{ fontSize: 11, marginTop: 4 }}>
          Each game logic can only be linked to one game. Already-used slugs are disabled.
        </p>
      </div>
    );
  };

  const gameFormFields = () => (
    <>
      {formErrors.general && <p style={{ color: "var(--ad-destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
      {renderField("Game Name", "name")}
      {renderSlugField()}
      {renderField("Type", "type", "text", [
        { value: "cognitive", label: "Cognitive" }, { value: "focus", label: "Focus" }, { value: "memory", label: "Memory" }, { value: "emotional", label: "Emotional" }, { value: "organizational", label: "Organizational" },
      ])}
      {renderField("Description", "description", "textarea")}
      <div className="ad-form-group" style={{ marginBottom: 14 }}>
        <label>Reward Coins</label>
        <input
          className="ad-form-input"
          type="number"
          min="1"
          value={formData.reward_coins ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || parseInt(val) >= 1) {
              setFormData({ ...formData, reward_coins: val });
            }
          }}
          placeholder="Reward Coins (must be positive)"
        />
        {formErrors.reward_coins && (
          <p style={{ color: "var(--ad-destructive)", fontSize: 12, marginTop: 4 }}>
            {Array.isArray(formErrors.reward_coins) ? formErrors.reward_coins[0] : formErrors.reward_coins}
          </p>
        )}
        <p className="ad-text-muted" style={{ fontSize: 11, marginTop: 4 }}>
          Must be a positive number (1 or more). Coins are awarded to children proportionally based on their score.
        </p>
      </div>
      {renderField("Active", "is_active", "text", [{ value: true, label: "Active" }, { value: false, label: "Inactive" }])}
    </>
  );

  return (
    <div className="ad-page-section">
      <div className="ad-page-header">
        <div>
          <h1>Games & Learning</h1>
          <p>Manage all platform games</p>
        </div>
        <button className="ad-btn ad-btn-primary" onClick={openAddModal}>
          <Plus style={{ height: 16, width: 16 }} />
          Add Game
        </button>
      </div>

      <div className="ad-summary-cards">
        <div className="ad-summary-card">
          <div className="ad-summary-card-icon ad-primary"><Gamepad2 style={{ height: 22, width: 22 }} /></div>
          <div className="ad-summary-card-content">
            <div className="ad-summary-card-label">Total Games</div>
            <div className="ad-summary-card-value">{computedStats.total}</div>
          </div>
        </div>
        <div className="ad-summary-card">
          <div className="ad-summary-card-icon ad-success"><Power style={{ height: 22, width: 22 }} /></div>
          <div className="ad-summary-card-content">
            <div className="ad-summary-card-label">Active</div>
            <div className="ad-summary-card-value">{computedStats.active}</div>
          </div>
        </div>
        <div className="ad-summary-card">
          <div className="ad-summary-card-icon ad-accent"><BarChart3 style={{ height: 22, width: 22 }} /></div>
          <div className="ad-summary-card-content">
            <div className="ad-summary-card-label">Total Sessions</div>
            <div className="ad-summary-card-value">{computedStats.totalSessions.toLocaleString()}</div>
          </div>
        </div>
        <div className="ad-summary-card">
          <div className="ad-summary-card-icon ad-info"><Star style={{ height: 22, width: 22 }} /></div>
          <div className="ad-summary-card-content">
            <div className="ad-summary-card-label">Avg Score</div>
            <div className="ad-summary-card-value">{computedStats.avgScore}%</div>
          </div>
        </div>
        <div className="ad-summary-card">
          <div className="ad-summary-card-icon ad-primary"><Clock style={{ height: 22, width: 22 }} /></div>
          <div className="ad-summary-card-content">
            <div className="ad-summary-card-label">Overall Avg Duration</div>
            <div className="ad-summary-card-value">{computedStats.overallAvgDuration > 0 ? `${computedStats.overallAvgDuration}s` : "—"}</div>
          </div>
        </div>
      </div>

      <div className="ad-filters-row">
        <div className="ad-search-box">
          <Search style={{ height: 16, width: 16, color: "var(--ad-muted-foreground)" }} />
          <input placeholder="Search games..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ad-filter-group">
          {["all", "cognitive", "focus", "memory", "emotional", "organizational"].map((t) => (
            <button key={t} className={`ad-filter-btn ${typeFilter === t ? "ad-active" : ""}`} onClick={() => setTypeFilter(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><div className="ad-spinner" /></div>
      ) : filteredGames.length === 0 ? (
        <div className="ad-glass-card ad-empty-state"><Gamepad2 style={{ height: 40, width: 40 }} /><p>No games found</p></div>
      ) : (
        <div className="ad-grid-cards">
          {filteredGames.map((game) => (
            <div key={game.id} className="ad-entity-card">
              <div className="ad-entity-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-entity-card-title">{game.name}</div>
                  <div className="ad-entity-card-badges">
                    <span className={`ad-badge ${typeBadge[game.type] || "ad-badge-muted"}`}>{game.type}</span>
                    {game.game_slug && (
                      <span className="ad-badge ad-badge-info" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                        <Link2 style={{ height: 10, width: 10 }} />
                        {game.game_slug}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`ad-status-dot ${game.is_active ? "ad-active" : "ad-inactive"}`} />
              </div>
              <p className="ad-text-muted ad-text-sm" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                {game.description?.slice(0, 100)}{game.description?.length > 100 ? "..." : ""}
              </p>
              <div className="ad-entity-card-stats">
                <div className="ad-entity-card-stat"><div className="ad-entity-card-stat-label">Avg Duration</div><div className="ad-entity-card-stat-value">{game.avg_duration > 0 ? `${game.avg_duration}s` : "—"}</div></div>
                <div className="ad-entity-card-stat"><div className="ad-entity-card-stat-label">Avg Score</div><div className="ad-entity-card-stat-value">{game.computed_avg_score > 0 ? `${game.computed_avg_score}%` : "—"}</div></div>
                <div className="ad-entity-card-stat"><div className="ad-entity-card-stat-label">Sessions</div><div className="ad-entity-card-stat-value">{game.total_sessions || 0}</div></div>
                <div className="ad-entity-card-stat"><div className="ad-entity-card-stat-label">Coins</div><div className="ad-entity-card-stat-value ad-accent">{game.reward_coins}</div></div>
              </div>
              <div className="ad-entity-card-footer">
                <div className="ad-entity-card-meta"><Clock style={{ height: 12, width: 12 }} />{game.created_at ? new Date(game.created_at).toLocaleDateString() : "—"}</div>
                <div className="ad-entity-card-actions" style={{ opacity: 1 }}>
                  <button className="ad-btn-ghost" onClick={() => setViewModal({ open: true, game })}><Eye style={{ height: 16, width: 16 }} /></button>
                  <button className="ad-btn-ghost" onClick={() => openEditModal(game)}><Edit2 style={{ height: 16, width: 16 }} /></button>
                  <button className="ad-btn-danger" onClick={() => setDeleteModal({ open: true, game })}><Trash2 style={{ height: 16, width: 16 }} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="ad-glass-card" style={{ padding: 0 }}>
          <div className="ad-table-pagination">
            <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
            <div className="ad-table-pagination-btns">
              <button disabled={pagination.current_page === 1} onClick={() => fetchGames(pagination.current_page - 1)}><ChevronLeft style={{ height: 16, width: 16 }} /></button>
              <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchGames(pagination.current_page + 1)}><ChevronRight style={{ height: 16, width: 16 }} /></button>
            </div>
          </div>
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Game" footer={<><button className="ad-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button><button className="ad-btn ad-btn-primary" onClick={handleAddGame} disabled={formLoading}>{formLoading ? "Creating..." : "Create Game"}</button></>}>{gameFormFields()}</Modal>

      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, game: null })} title={`Edit Game — ${editModal.game?.name || ""}`} footer={<><button className="ad-btn-cancel" onClick={() => setEditModal({ open: false, game: null })}>Cancel</button><button className="ad-btn ad-btn-primary" onClick={handleEditGame} disabled={formLoading}>{formLoading ? "Saving..." : "Save Changes"}</button></>}>{gameFormFields()}</Modal>

      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, game: null })} title="Game Details">
        {viewModal.game && (() => {
          const g = viewModal.game;
          return (
            <div>
              {/* Hero Header */}
              <div style={{
                background: "linear-gradient(135deg, #6c5ce7 0%, #00b894 100%)",
                borderRadius: 16, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Gamepad2 style={{ height: 28, width: 28, color: "#fff" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{g.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>{g.type}</span>
                      {g.game_slug && (
                        <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)", fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Link2 style={{ height: 10, width: 10 }} />{g.game_slug}
                        </span>
                      )}
                      <span style={{ background: g.is_active ? "rgba(0,184,148,0.3)" : "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.25)" }}>{g.is_active ? "✓ Active" : "Inactive"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Avg Duration", value: g.avg_duration > 0 ? `${g.avg_duration}s` : "—", color: "#6c5ce7", icon: "⏱" },
                  { label: "Avg Score", value: g.computed_avg_score > 0 ? `${g.computed_avg_score}%` : "—", color: "#00b894", icon: "📊" },
                  { label: "Sessions", value: g.total_sessions || 0, color: "#e84393", icon: "🎮" },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "14px 8px", background: "var(--ad-muted)", borderRadius: 12, border: "1px solid var(--ad-border)" }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color, marginTop: 2 }}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</div>
                    <div style={{ fontSize: 10, color: "var(--ad-muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Details</div>
              <div className="ad-modal-field"><div className="ad-modal-field-label">Description</div><div className="ad-modal-field-value" style={{ lineHeight: 1.6 }}>{g.description || "—"}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <div className="ad-modal-field">
                  <div className="ad-modal-field-label">Reward Coins</div>
                  <div className="ad-modal-field-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Coins style={{ height: 14, width: 14, color: "#e6a014" }} />
                    <span style={{ fontWeight: 700, color: "#e6a014" }}>{g.reward_coins}</span> per game
                  </div>
                </div>
                <div className="ad-modal-field">
                  <div className="ad-modal-field-label">Created</div>
                  <div className="ad-modal-field-value">{g.created_at ? new Date(g.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={deleteModal.open} onClose={() => { setDeleteModal({ open: false, game: null }); setDeleteError(""); }} title="Delete Game" footer={<><button className="ad-btn-cancel" onClick={() => { setDeleteModal({ open: false, game: null }); setDeleteError(""); }}>Cancel</button><button className="ad-btn-confirm-delete" onClick={handleDeleteGame} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete Game"}</button></>}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Trash2 style={{ height: 28, width: 28, color: "#ef4444" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ad-foreground)", marginBottom: 8 }}>Delete {deleteModal.game?.name}?</p>
          <p style={{ fontSize: 13, color: "var(--ad-muted-foreground)", lineHeight: 1.6 }}>
            This will permanently remove this game and all its configuration. Games with existing sessions cannot be deleted.
          </p>
          {deleteError && (
            <div style={{ marginTop: 16, padding: "10px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
              <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{deleteError}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Success Toast */}
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
    </div>
  );
};

export default AdminGames;