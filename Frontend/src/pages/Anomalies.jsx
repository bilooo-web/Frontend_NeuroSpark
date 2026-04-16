import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Eye, Brain } from 'lucide-react';
import api from '../services/api';
import guardianService from '../services/guardianService';

const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return d||'—'; } };

const Anomalies = () => {
  const { isTherapist } = useApp();
  const navigate = useNavigate();

  const [anomalies,  setAnomalies]  = useState([]);
  const [children,   setChildren]   = useState([]); // for "needs attention" section
  const [hydrating,  setHydrating]  = useState(true);
  const [error,      setError]      = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!isTherapist) { navigate('/guardian/dashboard'); return; }
    load();
    return () => { mounted.current = false; };
  }, [isTherapist]);

  const load = async () => {
    setError('');
    try {
      // Try fast full-dashboard endpoint first (has anomalies + children with scores)
      try {
        const res = await api.get('/guardian/dashboard/full');
        if (!mounted.current) return;
        setAnomalies(res.anomalies || res.data?.anomalies || []);
        setChildren(res.children   || res.data?.children  || []);
        setHydrating(false);
        return;
      } catch { /* fall through */ }

      // Fallback: separate calls
      const [anomRes] = await Promise.all([
        guardianService.getAllAnomalies(),
      ]);
      if (!mounted.current) return;
      setAnomalies(anomRes.data || []);
    } catch (err) {
      if (mounted.current) setError('Failed to load anomaly data.');
    } finally {
      if (mounted.current) setHydrating(false);
    }
  };

  if (!isTherapist) return null;

  // Patients flagged for attention (low scores, no sessions)
  const needsAttention = children.filter(c => {
    const att  = c.attention_score    || 0;
    const acc  = c.recent_performance || c.average_accuracy || 0;
    const sess = c.games_played       || c.game_sessions_count || 0;
    return att < 50 || acc < 50 || sess === 0;
  });

  const scoreColor = v => v >= 70 ? '#22C55E' : v >= 40 ? '#F59E0B' : '#EF4444';
  const scoreBg    = v => v >= 70 ? '#D1FAE5' : v >= 40 ? '#FEF3C7' : '#FEE2E2';

  return (
    <DashboardLayout>
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Anomalies & Attention</div>
          <div className="ptd-page-subtitle">
            {anomalies.length} flagged sessions · {needsAttention.length} patients need attention
          </div>
        </div>
        <button className="ptd-btn ptd-btn-outline" onClick={load} disabled={hydrating}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={15} style={{ animation: hydrating ? 'spin 1s linear infinite' : 'none' }} />
          {hydrating ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', color:'#991B1B', padding:'12px 16px', borderRadius:8, marginBottom:16, display:'flex', justifyContent:'space-between' }}>
          <span>⚠️ {error}</span>
          <button onClick={load} style={{ background:'none', border:'none', color:'#991B1B', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>Retry</button>
        </div>
      )}

      {/* ── Needs Attention Section ────────────────────────────────────────── */}
      {(needsAttention.length > 0 || hydrating) && (
        <div className="ptd-card" style={{ marginBottom:24, borderLeft:'4px solid #EF4444' }}>
          <div className="ptd-card-header">
            <span className="ptd-card-title">⚠️ Patients Needing Attention ({needsAttention.length})</span>
          </div>
          {hydrating && needsAttention.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #FEE2E2' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#F3F4F6' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ height:12, background:'#F3F4F6', borderRadius:6, width:'35%', marginBottom:6 }}/>
                    <div style={{ height:10, background:'#F3F4F6', borderRadius:6, width:'55%' }}/>
                  </div>
                  <div style={{ width:60, height:28, background:'#F3F4F6', borderRadius:8 }}/>
                </div>
              ))}
            </div>
          ) : needsAttention.map((c, i) => {
            const name = c.user?.full_name || c.name || 'Unknown';
            const att  = Math.round(c.attention_score    || 0);
            const acc  = Math.round(c.recent_performance || c.average_accuracy || 0);
            const sess = c.games_played || c.game_sessions_count || 0;
            const reasons = [];
            if (att  < 50) reasons.push(`Low attention (${att}%)`);
            if (acc  < 50) reasons.push(`Low accuracy (${acc}%)`);
            if (sess === 0) reasons.push('No sessions recorded');
            return (
              <div key={c.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<needsAttention.length-1?'1px solid #FEE2E2':'none' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#991B1B', flexShrink:0 }}>
                  {name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0F3D3A' }}>{name}</div>
                  <div style={{ fontSize:12, color:'#EF4444', marginTop:2 }}>{reasons.join(' · ')}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => navigate(`/guardian/children/${c.id}`)}
                    style={{ background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <Brain size={12}/> Insights
                  </button>
                  <button onClick={() => navigate(`/guardian/children/${c.id}?tab=anomalies`)}
                    style={{ background:'#0F3D3A', color:'white', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <Eye size={12}/> Details
                  </button>
                </div>
              </div>
            );
          })}
          {needsAttention.length === 0 && !hydrating && (
            <div style={{ padding:'16px 0', color:'#22C55E', fontWeight:600, textAlign:'center' }}>
              ✅ All patients performing within normal range
            </div>
          )}
        </div>
      )}

      {/* ── Flagged Sessions Table ─────────────────────────────────────────── */}
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">
            <AlertTriangle size={16} style={{ display:'inline', marginRight:6, verticalAlign:'middle', color:'#F59E0B' }}/>
            Flagged Sessions ({anomalies.length})
          </span>
        </div>
       

        {hydrating && anomalies.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[1,2,3,4,5].map(i=>(
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ width:'18%', height:11, background:'#F3F4F6', borderRadius:6 }}/>
                <div style={{ width:'18%', height:11, background:'#F3F4F6', borderRadius:6 }}/>
                <div style={{ width:'40%', height:11, background:'#F3F4F6', borderRadius:6 }}/>
                <div style={{ width:'12%', height:11, background:'#F3F4F6', borderRadius:6 }}/>
              </div>
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'#8B8FA3' }}>
            <AlertTriangle size={36} style={{ opacity:.3, marginBottom:12 }}/>
            <p>No anomalies detected. All sessions are within normal range.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #E8EAF0' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Patient','Date','Score','Severity','Reason','Action'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#5A6170', fontWeight:600, fontSize:12, borderBottom:'1px solid #E8EAF0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr key={a.session_id||i} style={{ background: i%2===0?'white':'#FAFAFA' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color:'#0F3D3A' }}>{a.child_name || '—'}</td>
                    <td style={{ padding:'10px 14px', color:'#374151' }}>{fmtDate(a.played_at || a.date)}</td>
                    <td style={{ padding:'10px 14px' }}>
                      {a.score != null ? (
                        <span style={{ background:scoreBg(a.score), color:scoreColor(a.score), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                          {Math.round(a.score)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{
                        background: a.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                        color:      a.severity === 'critical' ? '#991B1B' : '#92400E',
                        borderRadius: 20, padding:'2px 10px', fontSize:11, fontWeight:700
                      }}>
                        {a.severity === 'critical' ? '🔴 Critical' : '🟡 Warning'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#374151', fontSize:12, maxWidth:420, lineHeight:1.6 }}>
                      {a.reason
                        ? a.reason.split(' · ').map((r, idx, arr) => (
                            <div key={idx} style={{ marginBottom: idx < arr.length - 1 ? 8 : 0 }}>
                              <span style={{ color:'#EF4444', fontWeight:600, marginRight:4 }}>→</span>{r}
                            </div>
                          ))
                        : '—'}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <button
                        onClick={() => navigate(`/guardian/children/${a.child_id}?tab=anomalies`)}
                        style={{ background:'#0F3D3A', color:'white', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <Eye size={12}/> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </DashboardLayout>
  );
};

export default Anomalies;