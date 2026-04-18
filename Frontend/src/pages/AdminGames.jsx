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
        {viewModal.game && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "16px", background: "var(--ad-muted)", borderRadius: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg, #6c5ce7, #00b894)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Gamepad2 style={{ height: 26, width: 26, color: "#fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ad-foreground)" }}>{viewModal.game.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <span className={`ad-badge ${typeBadge[viewModal.game.type]}`}>{viewModal.game.type}</span>
                  <span className="ad-badge ad-badge-info" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                    <Link2 style={{ height: 10, width: 10 }} />
                    {viewModal.game.game_slug || "Not linked"}
                  </span>
                  <span className={`ad-badge ${viewModal.game.is_active ? "ad-badge-success" : "ad-badge-muted"}`}>{viewModal.game.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ textAlign: "center", padding: "14px 8px", background: "var(--ad-muted)", borderRadius: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ad-primary)" }}>{viewModal.game.avg_duration > 0 ? `${viewModal.game.avg_duration}s` : "—"}</div>
                <div style={{ fontSize: 11, color: "var(--ad-muted-foreground)", marginTop: 2 }}>Avg Duration</div>
              </div>
              <div style={{ textAlign: "center", padding: "14px 8px", background: "var(--ad-muted)", borderRadius: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#00b894" }}>{viewModal.game.computed_avg_score > 0 ? `${viewModal.game.computed_avg_score}%` : "—"}</div>
                <div style={{ fontSize: 11, color: "var(--ad-muted-foreground)", marginTop: 2 }}>Avg Score</div>
              </div>
              <div style={{ textAlign: "center", padding: "14px 8px", background: "var(--ad-muted)", borderRadius: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#6c5ce7" }}>{viewModal.game.total_sessions || 0}</div>
                <div style={{ fontSize: 11, color: "var(--ad-muted-foreground)", marginTop: 2 }}>Sessions</div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-muted-foreground)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Details</div>
            <div className="ad-modal-field"><div className="ad-modal-field-label">Description</div><div className="ad-modal-field-value" style={{ lineHeight: 1.6 }}>{viewModal.game.description || "—"}</div></div>
            <div className="ad-modal-field"><div className="ad-modal-field-label">Reward Coins</div><div className="ad-modal-field-value" style={{ display: "flex", alignItems: "center", gap: 4 }}><Coins style={{ height: 14, width: 14, color: "#e6a014" }} /> <span style={{ fontWeight: 700, color: "#e6a014" }}>{viewModal.game.reward_coins}</span> per game</div></div>
            <div className="ad-modal-field"><div className="ad-modal-field-label">Created</div><div className="ad-modal-field-value">{viewModal.game.created_at ? new Date(viewModal.game.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div></div>
          </div>
        )}
      </Modal>

      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, game: null })} title="Delete Game" footer={<><button className="ad-btn-cancel" onClick={() => setDeleteModal({ open: false, game: null })}>Cancel</button><button className="ad-btn-confirm-delete" onClick={handleDeleteGame} disabled={formLoading}>{formLoading ? "Deleting..." : "Delete Game"}</button></>}>
        <p style={{ fontSize: 14, color: "var(--ad-foreground)" }}>Are you sure you want to delete <strong>{deleteModal.game?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AdminGames;