import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Minus, Check,
  Trash2, Star, StarOff, RefreshCw, Download, Search, Filter,
} from "lucide-react";
import api from "../services/api";

const SENTIMENT_COLORS = {
  positive: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  neutral:  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  negative: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
};

const SentimentBadge = ({ type }) => {
  const c = SENTIMENT_COLORS[type] || SENTIMENT_COLORS.neutral;
  const Icon = type === "positive" ? ThumbsUp : type === "negative" ? ThumbsDown : Minus;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 10px", borderRadius:999, fontSize:12, fontWeight:600,
      backgroundColor:c.bg, color:c.text, border:`1px solid ${c.border}`,
    }}>
      <Icon size={11}/> {type || "—"}
    </span>
  );
};

const StarRating = ({ rate }) => (
  <span style={{ color:"#f59e0b", fontSize:14 }}>
    {"★".repeat(Math.round(rate||0))}{"☆".repeat(5-Math.round(rate||0))}
  </span>
);

const StatBox = ({ label, value, color }) => (
  <div style={{
    background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
    padding:"16px 20px", flex:1, minWidth:110, textAlign:"center",
  }}>
    <div style={{ fontSize:26, fontWeight:700, color }}>{value ?? 0}</div>
    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{label}</div>
  </div>
);

const Btn = ({ onClick, disabled, title, bg, color, children }) => (
  <button title={title} disabled={disabled} onClick={onClick} style={{
    background:bg, border:"none", borderRadius:6, padding:"5px 9px",
    cursor:disabled?"not-allowed":"pointer", color, opacity:disabled?0.5:1,
    display:"flex", alignItems:"center", gap:3,
  }}>
    {children}
  </button>
);

export default function AdminFeedback() {
  const [list, setList]             = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState({});
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState("");
  const [sentiment, setSentiment]   = useState("all");
  const [selected, setSelected]     = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (sentiment !== "all") params.sentiment = sentiment;
      const [fbRes, statsRes] = await Promise.all([
        api.get("/admin/feedback/all", params),
        api.get("/admin/feedback/stats"),
      ]);
      setList(fbRes.data || []);
      setTotalPages(fbRes.pagination?.last_page || 1);
      setTotal(fbRes.pagination?.total || 0);
      setStats(statsRes.stats || null);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, sentiment]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const withBusy = async (id, fn) => {
    setBusy(p => ({ ...p, [id]: true }));
    try { await fn(); await fetchAll(); }
    catch (e) { alert("Failed: " + (e.message || "unknown")); }
    finally { setBusy(p => { const n={...p}; delete n[id]; return n; }); }
  };

  // Approve = show on homepage (not featured)
  const approve = (id) => withBusy(id, () =>
    api.put(`/admin/feedback/${id}/approve`, { is_featured: false })
  );

  // Feature = show in the "Fan Mail" cards on homepage
  const feature = (id) => withBusy(id, () =>
    api.put(`/admin/feedback/${id}/approve`, { is_featured: true })
  );

  // Unfeature = keep approved but remove from featured cards
  const unfeature = (id) => withBusy(id, () =>
    api.put(`/admin/feedback/${id}/approve`, { is_featured: false })
  );

  // Reject = permanently delete
  const reject = (id) => {
    if (!confirm("Reject and permanently delete this feedback?")) return;
    withBusy(id, () => api.delete(`/admin/feedback/${id}`));
  };

  const bulkApprove = async () => {
    if (!selected.length) return;
    setBusy(p => ({ ...p, bulk: true }));
    try {
      await api.post("/admin/feedback/bulk-approve", { ids: selected });
      setSelected([]); await fetchAll();
    } catch (e) { alert("Bulk approve failed: " + e.message); }
    finally { setBusy(p => { const n={...p}; delete n.bulk; return n; }); }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const base  = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const res   = await fetch(`${base}/admin/feedback/export?format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "feedback.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed: " + e.message); }
  };

  const toggleSelect    = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleSelectAll = () => setSelected(selected.length === list.length ? [] : list.map(f=>f.id));

  return (
    <div className="page-section">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display:"flex", alignItems:"center", gap:8 }}>
            <MessageSquare size={22}/> Feedback Management
          </h1>
          <p style={{ color:"#6b7280", marginTop:4, fontSize:13 }}>
            ✓ Approve → shows on homepage &nbsp;·&nbsp; ★ Feature → appears in "Fan Mail" cards &nbsp;·&nbsp; 🗑 Reject → permanently deleted
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-outline" onClick={fetchAll}><RefreshCw size={14}/> Refresh</button>
          <button className="btn btn-outline" onClick={exportCSV}><Download size={14}/> Export</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
          <StatBox label="Total"      value={stats.total}    color="#374151"/>
          <StatBox label="Positive"   value={stats.positive} color="#059669"/>
          <StatBox label="Neutral"    value={stats.neutral}  color="#d97706"/>
          <StatBox label="Negative"   value={stats.negative} color="#dc2626"/>
          <StatBox label="Avg Rating" value={stats.average_rating ? `${stats.average_rating}★` : "—"} color="#f59e0b"/>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding:"12px 16px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}>
          <Search size={14} style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search feedback..."
            style={{ width:"100%", padding:"8px 8px 8px 30px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:13 }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Filter size={14} style={{ color:"#9ca3af" }}/>
          <select value={sentiment} onChange={e => { setSentiment(e.target.value); setPage(1); }}
            style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #e5e7eb", fontSize:13 }}>
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        {selected.length > 0 && (
          <button className="btn btn-primary" disabled={!!busy.bulk} onClick={bulkApprove} style={{ marginLeft:"auto" }}>
            <Check size={13}/> Approve {selected.length} selected
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding:14, marginBottom:14, background:"#fee2e2", color:"#991b1b", borderRadius:8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow:"hidden", padding:0 }}>
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#9ca3af" }}>
            <div className="admin-spinner" style={{ margin:"0 auto 12px" }}/>
            Loading feedback...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding:60, textAlign:"center", color:"#9ca3af" }}>
            <MessageSquare size={38} style={{ margin:"0 auto 10px", opacity:0.25 }}/>
            <p>No feedback found</p>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                <th style={{ padding:"11px 14px", width:36 }}>
                  <input type="checkbox"
                    checked={selected.length===list.length && list.length>0}
                    onChange={toggleSelectAll}/>
                </th>
                {["User","Feedback","Sentiment","Rating","Status","Date","Actions"].map(h => (
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"#6b7280", fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((fb, i) => {
                const name     = fb.guardian?.user?.full_name || fb.guardian?.user?.name || "Unknown User";
                const approved = !!fb.is_approved;
                const featured = !!fb.is_featured;
                const isBusy   = !!busy[fb.id];

                return (
                  <tr key={fb.id} style={{ borderBottom:"1px solid #f3f4f6", background:i%2===0?"#fff":"#fafafa" }}>

                    <td style={{ padding:"11px 14px" }}>
                      <input type="checkbox" checked={selected.includes(fb.id)} onChange={() => toggleSelect(fb.id)}/>
                    </td>

                    <td style={{ padding:"11px 14px", minWidth:130 }}>
                      <div style={{ fontWeight:600, color:"#111827" }}>{name}</div>
                    </td>

                    <td style={{ padding:"11px 14px", maxWidth:280 }}>
                      <div style={{ color:"#374151", lineHeight:1.5 }}>
                        {fb.text?.length > 110 ? fb.text.slice(0,110)+"…" : fb.text}
                      </div>
                    </td>

                    <td style={{ padding:"11px 14px" }}>
                      <SentimentBadge type={fb.type}/>
                    </td>

                    <td style={{ padding:"11px 14px" }}>
                      <StarRating rate={fb.rate}/>
                    </td>

                    <td style={{ padding:"11px 14px", minWidth:100 }}>
                      {featured ? (
                        <span style={{ color:"#f59e0b", fontWeight:700, fontSize:12 }}>★ Featured</span>
                      ) : approved ? (
                        <span style={{ color:"#059669", fontWeight:600, fontSize:12 }}>✓ Approved</span>
                      ) : (
                        <span style={{ color:"#9ca3af", fontSize:12 }}>Pending</span>
                      )}
                    </td>

                    <td style={{ padding:"11px 14px", color:"#9ca3af", fontSize:12, whiteSpace:"nowrap" }}>
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : "—"}
                    </td>

                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex", gap:5 }}>

                        {/* Approve — only when pending */}
                        {!approved && (
                          <Btn title="Approve — show on homepage" disabled={isBusy}
                            onClick={() => approve(fb.id)} bg="#d1fae5" color="#065f46">
                            {isBusy ? "…" : <><Check size={12}/> Approve</>}
                          </Btn>
                        )}

                        {/* Feature — approved but not yet featured */}
                        {approved && !featured && (
                          <Btn title="Feature in Fan Mail cards on homepage" disabled={isBusy}
                            onClick={() => feature(fb.id)} bg="#fef3c7" color="#92400e">
                            {isBusy ? "…" : <><Star size={12}/> Feature</>}
                          </Btn>
                        )}

                        {/* Unfeature — currently featured */}
                        {approved && featured && (
                          <Btn title="Remove from Fan Mail cards" disabled={isBusy}
                            onClick={() => unfeature(fb.id)} bg="#f3f4f6" color="#6b7280">
                            {isBusy ? "…" : <><StarOff size={12}/> Unfeature</>}
                          </Btn>
                        )}

                        {/* Reject = Delete */}
                        <Btn title="Reject & permanently delete" disabled={isBusy}
                          onClick={() => reject(fb.id)} bg="#fee2e2" color="#991b1b">
                          {isBusy ? "…" : <><Trash2 size={12}/> Reject</>}
                        </Btn>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:18 }}>
          <button className="btn btn-outline" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
          <span style={{ color:"#6b7280", fontSize:13 }}>Page {page} / {totalPages} &nbsp;({total} total)</span>
          <button className="btn btn-outline" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}