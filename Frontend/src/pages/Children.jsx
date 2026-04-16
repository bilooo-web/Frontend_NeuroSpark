import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import LinkChildModal from '../components/modals/LinkChildModal';
import { Search, UserPlus, Download, RefreshCw, Trash2, X, Brain, AlertTriangle, ChevronRight, Activity, Mic, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import guardianService from '../services/guardianService';

// ─── Child Card (therapist version — no coins) ────────────────────────────────
const TherapistChildCard = ({ child, onViewInsights, onViewAnomalies, onUnlink }) => {
  const name     = child.user?.full_name || child.name || 'Unknown';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const age      = child.age || (child.date_of_birth
    ? new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()
    : null);
  const lastActive  = child.last_activity || child.last_active || 'No recent activity';
  const games       = child.games_played  || child.game_sessions_count || 0;
  const voice       = child.voice_attempts || child.voice_attempts_count || 0;
  const recentPerf  = Math.round(child.recent_performance || child.average_accuracy || 0);
  const attention   = Math.round(child.attention_score   || 0);
  const consistency = Math.round(child.consistency_score || 0);

  const scoreColor = v => v >= 70 ? '#22C55E' : v >= 40 ? '#F59E0B' : '#EF4444';
  const scoreBg    = v => v >= 70 ? '#F0FDF4' : v >= 40 ? '#FFFBEB' : '#FEF2F2';

  const isActive = lastActive !== 'No recent activity';

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1px solid #E8EAF0',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'transform 0.18s, box-shadow 0.18s',
      cursor: 'default',
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
      {/* Active indicator strip */}
      <div style={{ height: 3, background: isActive ? 'linear-gradient(90deg,#137a76,#22C55E)' : '#E8EAF0' }} />

      {/* Unlink button */}
      <button onClick={e => { e.stopPropagation(); onUnlink(child); }} title="Unlink child"
        style={{ position:'absolute', top:14, right:14, background:'rgba(239,68,68,0.08)', border:'none', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444', cursor:'pointer', zIndex:5 }}>
        <Trash2 size={13} />
      </button>

      <div style={{ padding: '20px 20px 16px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#0F3D3A,#137a76)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0F3D3A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
            <div style={{ fontSize:12, color:'#8B8FA3', marginTop:2 }}>
              {age ? `Age ${age}` : 'Age N/A'} · <span style={{ color: isActive ? '#22C55E' : '#8B8FA3' }}>{lastActive}</span>
            </div>
          </div>
        </div>

        {/* Score pills */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {[
            { label:'Accuracy', val: recentPerf },
            { label:'Attention', val: attention },
            { label:'Consistency', val: consistency },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: scoreBg(val), borderRadius:20, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color: scoreColor(val) }}>{val}%</span>
              <span style={{ fontSize:11, color:'#6B7280' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:16, paddingTop:12, borderTop:'1px solid #F3F4F6' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' }}>
            <Gamepad2 size={14} style={{ color:'#22C55E' }} /> {games} games
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' }}>
            <Mic size={14} style={{ color:'#3B82F6' }} /> {voice} voice
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'1px solid #F3F4F6' }}>
        <button onClick={() => onViewInsights(child.id)}
          style={{ padding:'11px 8px', background:'none', border:'none', borderRight:'1px solid #F3F4F6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:600, color:'#0F3D3A', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#F0FDF4'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <Brain size={14} style={{ color:'#137a76' }} /> View Insights
        </button>
        <button onClick={() => onViewAnomalies(child.id)}
          style={{ padding:'11px 8px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:600, color:'#0F3D3A', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <AlertTriangle size={14} style={{ color:'#EF4444' }} /> Anomalies
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EAF0', overflow:'hidden', padding:20 }}>
    <div style={{ height:3, background:'#F3F4F6', marginBottom:20 }} />
    <div style={{ display:'flex', gap:14, marginBottom:16 }}>
      <div style={{ width:48, height:48, borderRadius:'50%', background:'#F3F4F6' }} />
      <div style={{ flex:1 }}>
        <div style={{ height:14, background:'#F3F4F6', borderRadius:6, marginBottom:8, width:'60%' }} />
        <div style={{ height:11, background:'#F3F4F6', borderRadius:6, width:'40%' }} />
      </div>
    </div>
    <div style={{ display:'flex', gap:8, marginBottom:16 }}>
      {[60,50,70].map(w => <div key={w} style={{ height:24, background:'#F3F4F6', borderRadius:20, width:w }} />)}
    </div>
    <div style={{ height:36, background:'#F3F4F6', borderRadius:8 }} />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Children = () => {
  const navigate = useNavigate();
  const [search, setSearch]     = useState('');
  const [children, setChildren] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childToUnlink, setChildToUnlink] = useState(null);
  const [unlinking, setUnlinking]         = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Try fast full-dashboard endpoint first (1 request, has insights)
      try {
        const res = await api.get('/guardian/dashboard/full');
        if (mounted.current) {
          const kids = (res.children || res.data?.children || []).map(c => ({
            ...c,
            user: { full_name: c.name },
          }));
          setChildren(kids);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to basic endpoint
      }

      // Fallback: basic children list
      const res = await guardianService.getChildren();
      if (mounted.current) {
        setChildren(res.children || res.data?.children || []);
      }
    } catch (err) {
      if (mounted.current) setError('Failed to load children. Please try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleUnlinkConfirm = async () => {
    if (!childToUnlink) return;
    setUnlinking(true);
    try {
      await guardianService.unlinkChild(childToUnlink.id);
      setChildren(prev => prev.filter(c => c.id !== childToUnlink.id));
      setChildToUnlink(null);
    } catch (err) {
      setError(err.data?.message || 'Failed to unlink child');
    } finally {
      setUnlinking(false);
    }
  };

  const exportCSV = () => {
    if (!children.length) return;
    const rows = [
      ['Name','Age','Games Played','Voice Attempts','Recent Performance','Attention','Consistency','Last Active'],
      ...children.map(c => [
        c.user?.full_name || c.name || '',
        c.age || '',
        c.games_played || 0,
        c.voice_attempts || 0,
        Math.round(c.recent_performance || 0),
        Math.round(c.attention_score    || 0),
        Math.round(c.consistency_score  || 0),
        c.last_activity || '',
      ])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filtered = children.filter(c =>
    (c.user?.full_name || c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Patients</div>
          <div className="ptd-page-subtitle">{children.length} {children.length === 1 ? 'patient' : 'patients'} under your care</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="ptd-btn ptd-btn-outline" onClick={load} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <RefreshCw size={15} className={loading ? 'ptd-spin' : ''} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button className="ptd-btn ptd-btn-outline" onClick={exportCSV} disabled={!children.length} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Download size={15} /> Export CSV
          </button>
          <button className="ptd-btn ptd-btn-primary" onClick={() => setShowLinkModal(true)} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <UserPlus size={15} /> Link Patient
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'#FEF2F2', color:'#991B1B', padding:'12px 16px', borderRadius:8, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>⚠️ {error}</span>
          <button onClick={load} style={{ background:'none', border:'none', color:'#991B1B', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="ptd-search-bar" style={{ marginBottom:24 }}>
        <Search size={17} />
        <input type="text" placeholder="Search patients by name…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#8B8FA3', display:'flex' }}><X size={15} /></button>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ptd-children-grid">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ptd-empty-state" style={{ textAlign:'center', padding:'60px 20px' }}>
          {children.length === 0 ? (
            <>
              <div style={{ fontSize:48, marginBottom:16, opacity:.4 }}>🧒</div>
              <h3 style={{ marginBottom:8, color:'var(--ptd-text-primary)' }}>No patients yet</h3>
              <p style={{ color:'var(--ptd-text-secondary)', marginBottom:20 }}>Link a child account to start tracking their progress.</p>
              <button className="ptd-btn ptd-btn-primary" onClick={() => setShowLinkModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <UserPlus size={15} /> Link First Patient
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize:48, marginBottom:16, opacity:.4 }}>🔍</div>
              <p style={{ color:'var(--ptd-text-secondary)' }}>No patients match "{search}"</p>
              <button className="ptd-btn ptd-btn-outline" onClick={() => setSearch('')} style={{ marginTop:12 }}>Clear Search</button>
            </>
          )}
        </div>
      ) : (
        <div className="ptd-children-grid">
          {filtered.map(child => (
            <TherapistChildCard
              key={child.id}
              child={child}
              onViewInsights={id => navigate(`/guardian/children/${id}`)}
              onViewAnomalies={id => navigate(`/guardian/children/${id}?tab=anomalies`)}
              onUnlink={c => setChildToUnlink(c)}
            />
          ))}
        </div>
      )}

      {/* Link modal */}
      <LinkChildModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSuccess={newChild => { setChildren(prev => [newChild, ...prev]); setShowLinkModal(false); }}
      />

      {/* Unlink confirm */}
      {childToUnlink && (
        <div className="ptd-modal-overlay" onClick={() => !unlinking && setChildToUnlink(null)}>
          <div className="ptd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth:400 }}>
            <div className="ptd-modal-header">
              <h3 className="ptd-modal-title">Unlink Patient</h3>
              <button className="ptd-modal-close" onClick={() => setChildToUnlink(null)} disabled={unlinking}><X size={18} /></button>
            </div>
            <div className="ptd-modal-body">
              <p style={{ marginBottom:16 }}>
                Remove <strong>{childToUnlink.user?.full_name || childToUnlink.name}</strong> from your patients? You can re-link them any time.
              </p>
              <div className="ptd-modal-actions">
                <button className="ptd-btn ptd-btn-outline" onClick={() => setChildToUnlink(null)} disabled={unlinking}>Cancel</button>
                <button className="ptd-btn ptd-btn-danger" onClick={handleUnlinkConfirm} disabled={unlinking}>
                  {unlinking ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } } .ptd-spin { animation:spin 1s linear infinite; }`}</style>
    </DashboardLayout>
  );
};

export default Children;