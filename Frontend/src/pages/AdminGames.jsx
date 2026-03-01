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
} from "lucide-react";
import Modal from "../components/admin/Modal";
import adminService from "../services/adminService";

const difficultyBadge = {
  easy: "badge-success",
  medium: "badge-accent",
  hard: "badge-destructive",
  expert: "badge-info",
};

const typeBadge = {
  cognitive: "badge-primary",
  focus: "badge-info",
  memory: "badge-accent",
  emotional: "badge-success",
  organizational: "badge-muted",
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

  // Stats from metrics
  const [gameStats, setGameStats] = useState({ total: 0, active: 0, totalSessions: 0, avgScore: 0 });

  useEffect(() => {
    fetchGames();
    fetchGameStats();
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
    } catch (err) {
      console.error("Failed to fetch games:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameStats = async () => {
    try {
      const metrics = await adminService.getSystemMetrics();
      const perf = metrics?.performance_stats || {};
      const allGames = games.length || perf.total_games || 0;
      setGameStats({
        total: perf.total_games || allGames,
        active: perf.active_games || 0,
        totalSessions: perf.total_game_sessions || 0,
        avgScore: perf.avg_game_score || 0,
      });
    } catch {
      // silent — stats are nice-to-have
    }
  };

  // Compute stats from loaded games as fallback
  const computedStats = {
    total: games.length || gameStats.total,
    active: games.filter((g) => g.is_active).length || gameStats.active,
    totalSessions: gameStats.totalSessions,
    avgScore: gameStats.avgScore,
  };

  const filteredGames = games.filter((g) => {
    const matchSearch = !search || g.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || g.type === typeFilter;
    return matchSearch && matchType;
  });

  const defaultFormData = () => ({
    name: "",
    difficulty_level: "easy",
    type: "cognitive",
    description: "",
    avg_duration: "",
    reward_coins: "",
    is_active: true,
  });

  const openAddModal = () => {
    setFormData(defaultFormData());
    setFormErrors({});
    setAddModal(true);
  };

  const handleAddGame = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      const payload = {
        ...formData,
        avg_duration: parseInt(formData.avg_duration),
        reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      await adminService.createGame(payload);
      setAddModal(false);
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
      difficulty_level: game.difficulty_level || "easy",
      type: game.type || "cognitive",
      description: game.description || "",
      avg_duration: game.avg_duration || "",
      reward_coins: game.reward_coins || "",
      is_active: game.is_active,
    });
    setFormErrors({});
    setEditModal({ open: true, game });
  };

  const handleEditGame = async () => {
    setFormLoading(true);
    setFormErrors({});
    try {
      const payload = {
        name: formData.name,
        difficulty_level: formData.difficulty_level,
        type: formData.type,
        description: formData.description,
        avg_duration: parseInt(formData.avg_duration),
        reward_coins: parseInt(formData.reward_coins),
        is_active: formData.is_active === true || formData.is_active === "true",
      };
      await adminService.updateGame(editModal.game.id, payload);
      setEditModal({ open: false, game: null });
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
    try {
      await adminService.deleteGame(deleteModal.game.id);
      setDeleteModal({ open: false, game: null });
      fetchGames(pagination.current_page);
    } catch (err) {
      alert(err.data?.message || err.message || "Failed to delete game");
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
      {formErrors[name] && (
        <p style={{ color: "var(--destructive)", fontSize: 12, marginTop: 4 }}>{Array.isArray(formErrors[name]) ? formErrors[name][0] : formErrors[name]}</p>
      )}
    </div>
  );

  const gameFormFields = () => (
    <>
      {formErrors.general && <p style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 12 }}>{formErrors.general}</p>}
      {renderField("Game Name", "name")}
      {renderField("Difficulty Level", "difficulty_level", "text", [
        { value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }, { value: "expert", label: "Expert" },
      ])}
      {renderField("Type", "type", "text", [
        { value: "cognitive", label: "Cognitive" }, { value: "focus", label: "Focus" }, { value: "memory", label: "Memory" }, { value: "emotional", label: "Emotional" }, { value: "organizational", label: "Organizational" },
      ])}
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
          <h1>Games & Learning</h1>
          <p>Manage all platform games</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus style={{ height: 16, width: 16 }} />
          Add Game
        </button>
      </div>

      {/* Summary Cards like screenshot */}
      <div className="admin-summary-cards">
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon primary"><Gamepad2 style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Total Games</div>
            <div className="admin-summary-card-value">{computedStats.total}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon success"><Power style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Active</div>
            <div className="admin-summary-card-value">{computedStats.active}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon accent"><BarChart3 style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Total Sessions</div>
            <div className="admin-summary-card-value">{computedStats.totalSessions.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-icon info"><Star style={{ height: 22, width: 22 }} /></div>
          <div className="admin-summary-card-content">
            <div className="admin-summary-card-label">Avg Score</div>
            <div className="admin-summary-card-value">{computedStats.avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-box">
          <Search style={{ height: 16, width: 16, color: "var(--muted-foreground)" }} />
          <input placeholder="Search games..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          {["all", "cognitive", "focus", "memory", "emotional", "organizational"].map((t) => (
            <button key={t} className={`filter-btn ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><div className="admin-spinner" /></div>
      ) : filteredGames.length === 0 ? (
        <div className="glass-card empty-state"><Gamepad2 style={{ height: 40, width: 40 }} /><p>No games found</p></div>
      ) : (
        <div className="grid-cards">
          {filteredGames.map((game) => (
            <div key={game.id} className="entity-card">
              <div className="entity-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="entity-card-title">{game.name}</div>
                  <div className="entity-card-badges">
                    <span className={`badge ${difficultyBadge[game.difficulty_level] || "badge-muted"}`}>{game.difficulty_level}</span>
                    <span className={`badge ${typeBadge[game.type] || "badge-muted"}`}>{game.type}</span>
                  </div>
                </div>
                <div className={`status-dot ${game.is_active ? "active" : "inactive"}`} />
              </div>
              <p className="text-muted text-sm" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                {game.description?.slice(0, 100)}{game.description?.length > 100 ? "..." : ""}
              </p>
              <div className="entity-card-stats">
                <div className="entity-card-stat"><div className="entity-card-stat-label">Duration</div><div className="entity-card-stat-value">{game.avg_duration}s</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Coins</div><div className="entity-card-stat-value accent">{game.reward_coins}</div></div>
                <div className="entity-card-stat"><div className="entity-card-stat-label">Status</div><div className="entity-card-stat-value">{game.is_active ? "Active" : "Inactive"}</div></div>
              </div>
              <div className="entity-card-footer">
                <div className="entity-card-meta"><Clock style={{ height: 12, width: 12 }} />{game.created_at ? new Date(game.created_at).toLocaleDateString() : "—"}</div>
                <div className="entity-card-actions" style={{ opacity: 1 }}>
                  <button className="btn-ghost" onClick={() => setViewModal({ open: true, game })}><Eye style={{ height: 16, width: 16 }} /></button>
                  <button className="btn-ghost" onClick={() => openEditModal(game)}><Edit2 style={{ height: 16, width: 16 }} /></button>
                  <button className="btn-danger" onClick={() => setDeleteModal({ open: true, game })}><Trash2 style={{ height: 16, width: 16 }} /></button>
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
              <button disabled={pagination.current_page === 1} onClick={() => fetchGames(pagination.current_page - 1)}><ChevronLeft style={{ height: 16, width: 16 }} /></button>
              <button disabled={pagination.current_page === pagination.last_page} onClick={() => fetchGames(pagination.current_page + 1)}><ChevronRight style={{ height: 16, width: 16 }} /></button>
            </div>
          </div>
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Game" footer={<><button className="btn-cancel" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddGame} disabled={formLoading}>{formLoading ? "Creating..." : "Create Game"}</button></>}>{gameFormFields()}</Modal>
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, game: null })} title={`Edit Game — ${editModal.game?.name || ""}`} footer={<><button className="btn-cancel" onClick={() => setEditModal({ open: false, game: null })}>Cancel</button><button className="btn btn-primary" onClick={handleEditGame} disabled={formLoading}>{formLoading ? "Saving..." : "Save Changes"}</button></>}>{gameFormFields()}</Modal>
      <Modal open={viewModal.open} onClose={() => setViewModal({ open: false, game: null })} title="Game Details">
        {viewModal.game && (
          <div>
            <div className="modal-field"><div className="modal-field-label">Name</div><div className="modal-field-value">{viewModal.game.name}</div></div>
            <div className="modal-field"><div className="modal-field-label">Difficulty</div><div className="modal-field-value"><span className={`badge ${difficultyBadge[viewModal.game.difficulty_level]}`}>{viewModal.game.difficulty_level}</span></div></div>
            <div className="modal-field"><div className="modal-field-label">Type</div><div className="modal-field-value"><span className={`badge ${typeBadge[viewModal.game.type]}`}>{viewModal.game.type}</span></div></div>
            <div className="modal-field"><div className="modal-field-label">Description</div><div className="modal-field-value">{viewModal.game.description || "—"}</div></div>
            <div className="modal-field"><div className="modal-field-label">Avg Duration</div><div className="modal-field-value">{viewModal.game.avg_duration}s</div></div>
            <div className="modal-field"><div className="modal-field-label">Reward Coins</div><div className="modal-field-value">{viewModal.game.reward_coins}</div></div>
            <div className="modal-field"><div className="modal-field-label">Status</div><div className="modal-field-value"><span className={`badge ${viewModal.game.is_active ? "badge-success" : "badge-muted"}`}>{viewModal.game.is_active ? "Active" : "Inactive"}</span></div></div>
          </div>
        )}
      </Modal>
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, game: null })} title="Delete Game" footer={<><button className="btn-cancel" onClick={() => setDeleteModal({ open: false, game: null })}>Cancel</button><button className="btn-confirm-delete" onClick={handleDeleteGame} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete Game"}</button></>}>
        <p style={{ fontSize: 14, color: "var(--foreground)" }}>Are you sure you want to delete <strong>{deleteModal.game?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AdminGames;