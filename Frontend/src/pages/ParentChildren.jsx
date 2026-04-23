import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import LinkChildModal from '../components/modals/LinkChildModal';
import {
  Search, UserPlus, Download, RefreshCw, X,
  TrendingUp, TrendingDown, Minus, Target,
  Gamepad2, Mic, Award, ChevronRight, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import guardianService from '../services/guardianService';

// ─── Helpers (same as ParentDashboard) ───────────────────────────────────────
const fmt     = v => v != null ? Math.round(parseFloat(v)) : 0;
const fmtPct  = v => `${fmt(v)}%`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return '—'; } };
const fmtTime = d => { try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

const scoreColor  = v => v >= 70 ? '#16a34a' : v >= 45 ? '#d97706' : '#dc2626';
const scoreBg     = v => v >= 70 ? '#f0fdf4' : v >= 45 ? '#fffbeb' : '#fef2f2';
const scoreBorder = v => v >= 70 ? '#bbf7d0' : v >= 45 ? '#fde68a' : '#fecaca';

const getTrend = (sessions) => {
  if (!sessions || sessions.length < 2) return 'flat';
  const recent = sessions.slice(0, 3).map(s => parseFloat(s.score) || 0);
  const older  = sessions.slice(3, 6).map(s => parseFloat(s.score) || 0);
  if (!older.length) return 'flat';
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg  = older.reduce((a, b) => a + b, 0) / older.length;
  if (recentAvg - olderAvg > 5) return 'up';
  if (olderAvg - recentAvg > 5) return 'down';
  return 'flat';
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ scores = [], color = '#16a34a' }) => {
  if (scores.length < 2) return null;
  const pts   = scores.slice(-8).reverse();
  const max   = Math.max(...pts, 1);
  const min   = Math.min(...pts, 0);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = pts.map((v, i) => [
    (i / (pts.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} />
    </svg>
  );
};

// ─── Circular progress ────────────────────────────────────────────────────────
const CircleProgress = ({ value = 0, size = 62, stroke = 6, color = '#16a34a' }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        fontSize={size * 0.22} fontWeight="800" fill={color}>{pct}</text>
    </svg>
  );
};

// ─── Child card (identical to ParentDashboard) ────────────────────────────────
const ChildCard = ({ child, onViewDetail, onUnlink }) => {
  const name       = child.name || child.user?.full_name || 'Child';
  const initials   = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const perf       = fmt(child.recent_performance || 0);
  const games      = child.games_played  || child.game_sessions_count  || 0;
  const voice      = child.voice_attempts || child.voice_attempts_count || 0;
  const coins      = child.total_coins   || 0;
  const attention  = fmt(child.attention_score || 0);
  const lastActive = child.last_activity || child.last_active || null;
  const isActive   = lastActive && lastActive !== 'No recent activity';
  const sessions   = child.sessions || [];
  const trend      = getTrend(sessions);
  const scores     = sessions.map(s => parseFloat(s.score) || 0);
  const color      = scoreColor(perf);
  const bg         = scoreBg(perf);
  const border     = scoreBorder(perf);

  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#9ca3af';
  const trendLabel = trend === 'up' ? 'Improving'  : trend === 'down' ? 'Declining' : 'Stable';

  return (
    <div style={{
      background: 'white', borderRadius: 18, border: `1px solid ${border}`,
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      transition: 'transform 0.18s, box-shadow 0.18s', position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
    >
      {/* Top colour bar */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      {/* Unlink button */}
      {onUnlink && (
        <button
          onClick={e => { e.stopPropagation(); onUnlink(child); }}
          title="Unlink child"
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 5,
            background: 'rgba(239,68,68,0.08)', border: 'none',
            borderRadius: 6, width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          }}>×</button>
      )}

      <div style={{ padding: '20px 20px 16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
            border: `2px solid ${color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, color,
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 12, color: isActive ? '#16a34a' : '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
              {isActive ? `Active ${lastActive}` : 'No recent activity'}
            </div>
          </div>

          <CircleProgress value={perf} size={62} stroke={6} color={color} />
        </div>

        {/* Status + trend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ background: bg, borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={13} color={color} />
            <span style={{ fontSize: 12, fontWeight: 700, color }}>
              {perf >= 70 ? 'On Track' : perf >= 45 ? 'Progressing' : 'Needs Support'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: trendColor, fontWeight: 600 }}>
            <TrendIcon size={14} />
            {trendLabel}
          </div>
        </div>

        {/* Sparkline */}
        {scores.length >= 2 && (
          <div style={{ marginBottom: 16, background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8, letterSpacing: 0.4 }}>SCORE TREND (LAST 8 SESSIONS)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Sparkline scores={scores} color={color} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Latest</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{fmtPct(scores[0])}</div>
              </div>
            </div>
          </div>
        )}

        {/* 4 stat chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { icon: '🎮', label: 'Games',     val: games },
            { icon: '🎤', label: 'Voice',     val: voice },
            { icon: '🧠', label: 'Attention', val: `${attention}%` },
            { icon: '🪙', label: 'Coins',     val: coins },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{s.val}</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Last session */}
        {sessions[0] && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gamepad2 size={14} color="#6b7280" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
                  {sessions[0].game?.name || 'Last Session'}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>
                  {fmtDate(sessions[0].played_at)} · {fmtTime(sessions[0].played_at)}
                </div>
              </div>
            </div>
            <span style={{
              background: scoreBg(sessions[0].score), color: scoreColor(sessions[0].score),
              borderRadius: 99, padding: '3px 9px', fontSize: 12, fontWeight: 700,
            }}>{fmtPct(sessions[0].score)}</span>
          </div>
        )}
      </div>

      {/* View button */}
      <button
        onClick={() => onViewDetail(child.id)}
        style={{
          width: '100%', padding: '13px', background: bg,
          border: 'none', borderTop: `1px solid ${border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          fontSize: 13, fontWeight: 700, color,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
        onMouseLeave={e => e.currentTarget.style.background = bg}
      >
        View Full Progress <ChevronRight size={15} />
      </button>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div style={{ height: 5, background: '#f3f4f6' }} />
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#f3f4f6', borderRadius: 6, width: '55%', marginBottom: 8 }} />
          <div style={{ height: 11, background: '#f3f4f6', borderRadius: 6, width: '35%' }} />
        </div>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#f3f4f6' }} />
      </div>
      <div style={{ height: 32, background: '#f3f4f6', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 60, background: '#f3f4f6', borderRadius: 10, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ height: 56, background: '#f3f4f6', borderRadius: 10 }} />)}
      </div>
    </div>
    <div style={{ height: 46, background: '#f9fafb', borderTop: '1px solid #f3f4f6' }} />
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ParentChildren = () => {
  const navigate = useNavigate();
  const [search,       setSearch]       = useState('');
  const [children,     setChildren]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showLink,     setShowLink]     = useState(false);
  const [childToUnlink, setChildToUnlink] = useState(null);
  const [unlinking,    setUnlinking]    = useState(false);
  const [sortBy,       setSortBy]       = useState('name'); // name | performance | activity
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      // Full dashboard has sessions data for sparklines
      try {
        const res = await api.get('/guardian/dashboard/full');
        if (mounted.current) {
          setChildren(res.children || res.data?.children || []);
          setLoading(false);
          return;
        }
      } catch { /* fallback */ }

      const res = await guardianService.getChildren();
      if (mounted.current) setChildren(res.children || res.data?.children || []);
    } catch {
      if (mounted.current) setError('Failed to load children. Please try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!childToUnlink) return;
    setUnlinking(true);
    try {
      await guardianService.unlinkChild(childToUnlink.id);
      setChildren(prev => prev.filter(c => c.id !== childToUnlink.id));
      setChildToUnlink(null);
    } catch {
      setError('Failed to unlink child. Please try again.');
    } finally {
      setUnlinking(false);
    }
  };

  const exportCSV = () => {
    if (!children.length) return;
    const rows = [
      ['Name', 'Games Played', 'Voice Attempts', 'Performance %', 'Attention %', 'Coins', 'Last Active'],
      ...children.map(c => [
        c.name || c.user?.full_name || '',
        c.games_played  || 0,
        c.voice_attempts || 0,
        Math.round(c.recent_performance || 0),
        Math.round(c.attention_score    || 0),
        c.total_coins || 0,
        c.last_activity || '',
      ])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `children_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  // Filter + sort
  const filtered = children
    .filter(c => (c.name || c.user?.full_name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'performance') return (b.recent_performance || 0) - (a.recent_performance || 0);
      if (sortBy === 'activity') {
        const aActive = a.last_activity && a.last_activity !== 'No recent activity';
        const bActive = b.last_activity && b.last_activity !== 'No recent activity';
        return bActive - aActive;
      }
      return (a.name || a.user?.full_name || '').localeCompare(b.name || b.user?.full_name || '');
    });

  // Summary stats
  const avgPerf  = children.length ? Math.round(children.reduce((s, c) => s + (c.recent_performance || 0), 0) / children.length) : 0;
  const topKid   = [...children].sort((a, b) => (b.recent_performance || 0) - (a.recent_performance || 0))[0];
  const needsAttn = children.filter(c => (c.recent_performance || 0) < 45 || !c.games_played).length;

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">My Children</div>
          <div className="ptd-page-subtitle">
            {children.length} {children.length === 1 ? 'child' : 'children'} linked
            {avgPerf > 0 && ` · Avg performance ${avgPerf}%`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ptd-btn ptd-btn-outline" onClick={load} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button className="ptd-btn ptd-btn-outline" onClick={exportCSV} disabled={!children.length}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={15} /> Export CSV
          </button>
          <button className="ptd-btn ptd-btn-primary" onClick={() => setShowLink(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={15} /> Link Child
          </button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {error}</span>
          <button onClick={load} style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* ── Summary strip (only when children exist) ─────────────────────── */}
      {children.length > 0 && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Avg Performance', value: `${avgPerf}%`,          color: avgPerf >= 70 ? '#16a34a' : avgPerf >= 45 ? '#d97706' : '#dc2626', bg: avgPerf >= 70 ? '#f0fdf4' : avgPerf >= 45 ? '#fffbeb' : '#fef2f2' },
            { label: 'Top Performer',   value: topKid ? (topKid.name || topKid.user?.full_name || '—').split(' ')[0] : '—', color: '#2563eb', bg: '#eff6ff' },
            { label: 'Need Attention',  value: needsAttn,               color: needsAttn > 0 ? '#dc2626' : '#16a34a', bg: needsAttn > 0 ? '#fef2f2' : '#f0fdf4' },
            { label: 'Total Children',  value: children.length,         color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: `1px solid ${s.bg}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + sort bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="ptd-search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={17} />
          <input type="text" placeholder="Search by name…" value={search}
            onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151', background: 'white' }}>
          <option value="name">Sort: Name</option>
          <option value="performance">Sort: Performance</option>
          <option value="activity">Sort: Recent Activity</option>
        </select>
      </div>

      {/* ── Children grid ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          {children.length === 0 ? (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>👶</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', marginBottom: 8 }}>No children linked yet</div>
              <p style={{ color: '#6b7280', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Link your child's account to start tracking their learning journey and celebrate every milestone together.
              </p>
              <button className="ptd-btn ptd-btn-primary" onClick={() => setShowLink(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={15} /> Link First Child
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔍</div>
              <p style={{ color: '#6b7280' }}>No children match "{search}"</p>
              <button className="ptd-btn ptd-btn-outline" onClick={() => setSearch('')} style={{ marginTop: 12 }}>Clear Search</button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
          {filtered.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              onViewDetail={id => navigate(`/guardian/children/${id}`)}
              onUnlink={c => setChildToUnlink(c)}
            />
          ))}
        </div>
      )}

      {/* ── Link modal ───────────────────────────────────────────────────── */}
      <LinkChildModal
        isOpen={showLink}
        onClose={() => setShowLink(false)}
        onSuccess={newChild => { setChildren(prev => [newChild, ...prev]); setShowLink(false); }}
      />

      {/* ── Unlink confirm modal ─────────────────────────────────────────── */}
      {childToUnlink && (
        <div className="ptd-modal-overlay" onClick={() => !unlinking && setChildToUnlink(null)}>
          <div className="ptd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="ptd-modal-header">
              <h3 className="ptd-modal-title">Unlink Child</h3>
              <button className="ptd-modal-close" onClick={() => setChildToUnlink(null)} disabled={unlinking}>
                <X size={18} />
              </button>
            </div>
            <div className="ptd-modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: '#374151', lineHeight: 1.6 }}>
                  Remove <strong>{childToUnlink.name || childToUnlink.user?.full_name}</strong> from your account?
                  You can re-link them at any time.
                </p>
              </div>
              <div className="ptd-modal-actions">
                <button className="ptd-btn ptd-btn-outline" onClick={() => setChildToUnlink(null)} disabled={unlinking}>Cancel</button>
                <button className="ptd-btn ptd-btn-danger" onClick={handleUnlink} disabled={unlinking}>
                  {unlinking ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ParentChildren;