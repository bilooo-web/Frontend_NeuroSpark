import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import GameSessionsBreakdownChart from '../components/charts/GameSessionsBreakdownChart';
import GameSessionsTrendChart from '../components/charts/GameSessionsTrendChart';
import VoiceInstructionBreakdownChart from '../components/charts/VoiceInstructionBreakdownChart';
import VoiceAccuracyTrendChart from '../components/charts/VoiceAccuracyTrendChart';
import AnomalyList from '../components/therapist/AnomalyList';
// ChildCard is replaced below by TherapistChildCard (same component as patients page)
import { useApp } from '../context/AppContext';
import therapistImg from '../assets/image.png';
import { Users, Target, AlertTriangle, UserCheck, Brain, Star, Gamepad2, Mic, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import guardianService from '../services/guardianService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const toKey = (d) => { try { return new Date(d).toISOString().split('T')[0]; } catch { return null; } };

const buildWeekMap = () => {
  const map = {};
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    map[d.toISOString().split('T')[0]] = { scores: [], accuracies: [], sessions: 0 };
  }
  return map;
};

const weekMapToArray = (map) =>
  Object.entries(map).map(([key, val], i) => ({
    day:      i === 6 ? 'Today' : i === 5 ? 'Yesterday' : new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score:    avg(val.scores),
    accuracy: avg(val.accuracies),
    sessions: val.sessions,
  }));

const defaultWeek = () => weekMapToArray(buildWeekMap());

// ─── Sentiment ────────────────────────────────────────────────────────────────
const sentimentIcon  = s => { const r = typeof s==='object'?s?.result:s; return r==='positive'?'😊':r==='negative'?'😞':r==='neutral'?'😐':''; };
const sentimentColor = s => { const r = typeof s==='object'?s?.result:s; return r==='positive'?'#4caf50':r==='negative'?'#f44336':r==='neutral'?'#ff9800':'#2196f3'; };
const sentimentLabel = s => { if(!s)return''; const r=typeof s==='object'?s?.result:s; return r?r.charAt(0).toUpperCase()+r.slice(1):''; };

// ─── Therapist Child Card (matches Patients page exactly) ────────────────────
const TherapistChildCard = ({ child, onViewInsights, onViewAnomalies }) => {
  const navigate    = useNavigate();
  const name        = child.user?.full_name || child.name || 'Unknown';
  const initials    = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const age         = child.age || (child.date_of_birth
    ? new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()
    : null);
  const lastActive  = child.last_activity || child.last_active || 'No recent activity';
  const games       = child.games_played  || child.game_sessions_count || 0;
  const voice       = child.voice_attempts || child.voice_attempts_count || 0;
  const recentPerf  = Math.round(child.recent_performance || child.average_accuracy || 0);
  const attention   = Math.round(child.attention_score   || 0);
  const consistency = Math.round(child.consistency_score || 0);
  const sc          = v => v >= 70 ? '#22C55E' : v >= 40 ? '#F59E0B' : '#EF4444';
  const sbg         = v => v >= 70 ? '#F0FDF4' : v >= 40 ? '#FFFBEB' : '#FEF2F2';
  const isActive    = lastActive !== 'No recent activity';

  return (
    <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EAF0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', transition:'transform 0.18s, box-shadow 0.18s', cursor:'default', position:'relative' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; }}>
      <div style={{ height:3, background: isActive ? 'linear-gradient(90deg,#137a76,#22C55E)' : '#E8EAF0' }} />
      <div style={{ padding:'20px 20px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#0F3D3A,#137a76)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, flexShrink:0 }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0F3D3A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
            <div style={{ fontSize:12, color:'#8B8FA3', marginTop:2 }}>
              {age ? `Age ${age}` : 'Age N/A'} · <span style={{ color: isActive ? '#22C55E' : '#8B8FA3' }}>{lastActive}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {[{ label:'Accuracy', val:recentPerf },{ label:'Attention', val:attention },{ label:'Consistency', val:consistency }].map(({ label, val }) => (
            <div key={label} style={{ background:sbg(val), borderRadius:20, padding:'4px 10px', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:sc(val) }}>{val}%</span>
              <span style={{ fontSize:11, color:'#6B7280' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, paddingTop:12, borderTop:'1px solid #F3F4F6' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' }}><Gamepad2 size={14} style={{ color:'#22C55E' }} /> {games} games</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' }}><Mic size={14} style={{ color:'#3B82F6' }} /> {voice} voice</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:'1px solid #F3F4F6' }}>
        <button onClick={() => navigate(`/guardian/children/${child.id}`)}
          style={{ padding:'11px 8px', background:'none', border:'none', borderRight:'1px solid #F3F4F6', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:600, color:'#0F3D3A', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#F0FDF4'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <Brain size={14} style={{ color:'#137a76' }} /> View Insights
        </button>
        <button onClick={() => navigate(`/guardian/children/${child.id}?tab=anomalies`)}
          style={{ padding:'11px 8px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, fontWeight:600, color:'#0F3D3A', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
          <AlertTriangle size={14} style={{ color:'#EF4444' }} /> Anomalies
        </button>
      </div>
    </div>
  );
};

// ─── Needs Attention ──────────────────────────────────────────────────────────
const NeedsAttentionWidget = ({ children, onView }) => {
  const flagged = children.filter(c => {
    const att  = c.attention_score  || 0;
    const acc  = c.recent_performance || c.average_accuracy || 0;
    // Use games_played from dashboard (real count), not sessions cache
    const sess = c.games_played || c.game_sessions_count || 0;
    return att < 50 || acc < 50 || sess === 0;
  });

  if (!flagged.length) return (
    <div className="ptd-card" style={{ borderLeft: '4px solid #22C55E' }}>
      <div className="ptd-card-header"><span className="ptd-card-title">✅ All Patients On Track</span></div>
      <div className="ptd-empty-state" style={{ color: '#22C55E' }}>No patients need immediate attention</div>
    </div>
  );

  return (
    <div className="ptd-card" style={{ borderLeft: '4px solid #EF4444' }}>
      <div className="ptd-card-header">
        <span className="ptd-card-title">⚠️ Needs Attention ({flagged.length})</span>
        <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Action Required</span>
      </div>
      {flagged.map((c, i) => {
        const name = c.user?.full_name || c.name || 'Unknown';
        const att  = Math.round(c.attention_score    || 0);
        const acc  = Math.round(c.recent_performance || c.average_accuracy || 0);
        const sess = c.games_played || c.game_sessions_count || 0;
        const reasons = [];
        if (att  < 50)  reasons.push(`Low attention (${att}%)`);
        if (acc  < 50)  reasons.push(`Low accuracy (${acc}%)`);
        if (sess === 0) reasons.push('No sessions recorded');
        return (
          <div key={c.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<flagged.length-1?'1px solid #FEE2E2':'none' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#991B1B', flexShrink:0 }}>
              {name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#0F3D3A' }}>{name}</div>
              <div style={{ fontSize:12, color:'#EF4444', marginTop:2 }}>{reasons.join(' · ')}</div>
            </div>
            <button onClick={()=>onView(c.id)} style={{ background:'#FEE2E2', color:'#991B1B', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>View</button>
          </div>
        );
      })}
    </div>
  );
};

// ─── Reading Progress Table ───────────────────────────────────────────────────
const ReadingProgressTable = ({ data }) => {
  if (!data?.length) return (
    <div className="ptd-card">
      <div className="ptd-card-header"><span className="ptd-card-title">📚 Reading Progress</span></div>
      <div className="ptd-empty-state">No reading data yet</div>
    </div>
  );
  return (
    <div className="ptd-card">
      <div className="ptd-card-header"><span className="ptd-card-title">📚 Reading Progress</span></div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid #E8EAF0' }}>
              {['Patient','Stories','Best Accuracy','Avg Accuracy','Last Read','Trend'].map(h=>(
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#8B8FA3', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #F3F4F6' }}>
                <td style={{ padding:'10px 12px', fontWeight:600, color:'#0F3D3A' }}>{row.name}</td>
                <td style={{ padding:'10px 12px', color:'#374151' }}>{row.storiesRead??'—'}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ background:row.bestAcc>=75?'#D1FAE5':row.bestAcc>=50?'#FEF3C7':'#FEE2E2', color:row.bestAcc>=75?'#065F46':row.bestAcc>=50?'#92400E':'#991B1B', borderRadius:9999, padding:'2px 10px', fontWeight:700, fontSize:12 }}>{row.bestAcc??0}%</span>
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ background:row.avgAcc>=75?'#D1FAE5':row.avgAcc>=50?'#FEF3C7':'#FEE2E2', color:row.avgAcc>=75?'#065F46':row.avgAcc>=50?'#92400E':'#991B1B', borderRadius:9999, padding:'2px 10px', fontWeight:700, fontSize:12 }}>{row.avgAcc??0}%</span>
                </td>
                <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:12 }}>{row.lastRead??'—'}</td>
                <td style={{ padding:'10px 12px' }}>
                  {row.trend==='up'   && <span style={{ color:'#22C55E', fontWeight:700 }}>↑ Improving</span>}
                  {row.trend==='down' && <span style={{ color:'#EF4444', fontWeight:700 }}>↓ Declining</span>}
                  {row.trend==='flat' && <span style={{ color:'#9CA3AF' }}>→ Stable</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Chart computation (pure, no API calls) ───────────────────────────────────
const computeCharts = (childrenData, filterChildId = 'all') => {
  const targets = filterChildId === 'all'
    ? childrenData
    : childrenData.filter(c => String(c.id) === String(filterChildId));

  const weekMap     = buildWeekMap();
  const gameCounts  = {};
  const voiceBreak  = {};
  const voiceTrend  = buildWeekMap();

  targets.forEach(child => {
    // Sessions
    (child.sessions || []).forEach(s => {
      const key = toKey(s.played_at);
      if (key && weekMap[key]) {
        if (s.score    != null) weekMap[key].scores.push(parseFloat(s.score));
        if (s.accuracy != null) weekMap[key].accuracies.push(parseFloat(s.accuracy));
        weekMap[key].sessions += 1;
      }
      const gName = s.game?.name || s.game?.game_slug || 'Unknown';
      gameCounts[gName] = (gameCounts[gName] || 0) + 1;
    });

    // Voice
    (child.voice_attempts_detail || []).forEach(v => {
      const title = v.voice_instruction?.title || 'Unknown';
      voiceBreak[title] = (voiceBreak[title] || 0) + 1;
      const key = toKey(v.created_at);
      if (key && voiceTrend[key]) {
        if (v.accuracy_score      != null) voiceTrend[key].scores.push(parseFloat(v.accuracy_score));
        if (v.pronunciation_score != null) voiceTrend[key].accuracies.push(parseFloat(v.pronunciation_score));
      }
    });
  });

  const weeklyProgress = weekMapToArray(weekMap);

  const gameSessionsBreakdown = Object.entries(gameCounts)
    .map(([name, play_count]) => ({ name, play_count }))
    .sort((a,b) => b.play_count - a.play_count).slice(0, 8);

  const gameSessionsTrend = weekMapToArray(weekMap);

  const voiceInstructionBreakdown = Object.entries(voiceBreak)
    .map(([name, attemptCount]) => ({ name, attemptCount }))
    .sort((a,b) => b.attemptCount - a.attemptCount).slice(0, 8);

  const voiceAccuracyTrend = weekMapToArray(voiceTrend).map((d, i) => ({
    day:           weeklyProgress[i]?.day || d.day,
    accuracy:      d.score,
    pronunciation: d.accuracy,
  }));

  // Reading — only for "all" view
  const readingProgress = filterChildId === 'all' ? targets.flatMap(child => {
    const stories = child.story_progress || [];
    if (!stories.length) return [];
    const name    = child.user?.full_name || child.name;
    const bestAcc = Math.round(Math.max(...stories.map(s => s.best_accuracy || 0), 0));
    const avgAcc  = avg(stories.map(s => s.avg_accuracy || 0));
    const lastRead = stories.reduce((l, s) => {
      if (!s.last_played) return l;
      return !l || new Date(s.last_played) > new Date(l) ? s.last_played : l;
    }, null);
    return [{ name, storiesRead: stories.length, bestAcc, avgAcc, lastRead: lastRead ? new Date(lastRead).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—', trend: avgAcc>=70?'up':avgAcc>=40?'flat':'down' }];
  }) : null;

  return { weeklyProgress, gameSessionsBreakdown, gameSessionsTrend, voiceInstructionBreakdown, voiceAccuracyTrend, readingProgress };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TherapistDashboard = () => {
  const { user } = useApp();
  const navigate  = useNavigate();
  const mounted   = useRef(true);

  const [rating,          setRating]          = useState(0);
  const [feedback,        setFeedback]        = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError,   setFeedbackError]   = useState('');
  const [loadError,       setLoadError]       = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('all');

  // Raw children data stored for chart recomputation
  const childrenDataRef = useRef([]);

  const [data, setData] = useState({
    children:                  [],
    activities:                [],
    anomalies:                 [],
    weeklyProgress:            defaultWeek(),
    gameSessionsBreakdown:     [],
    gameSessionsTrend:         defaultWeek(),
    voiceInstructionBreakdown: [],
    voiceAccuracyTrend:        defaultWeek(),
    readingProgress:           [],
    stats: { totalChildren:0, activeChildren:0, avgAccuracy:0, avgAttention:0 },
  });

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, []);

  // Instant chart recompute from cache — zero network calls
  useEffect(() => {
    if (!childrenDataRef.current.length) return;
    const charts = computeCharts(childrenDataRef.current, selectedChildId);
    setData(prev => ({ ...prev, ...charts }));
  }, [selectedChildId]);

  const load = async () => {
    try {
      setLoadError(null);

      // ONE request — replaces 24 individual requests
      const res = await api.get('/guardian/dashboard/full');
      if (!mounted.current) return;

      const childrenData = res.children || res.data?.children || [];
      childrenDataRef.current = childrenData;

      // Format children for ChildCard (expects user.full_name or name)
      const formattedChildren = childrenData.map(c => ({
        ...c,
        user:              { full_name: c.name },
        attention_score:   c.attention_score   || 0,
        impulsivity_score: c.impulsivity_score || 0,
        consistency_score: c.consistency_score || 0,
        average_accuracy:  c.recent_performance || 0,
        game_sessions_count: c.games_played || 0,
        voice_attempts_count: c.voice_attempts || 0,
      }));

      const active  = formattedChildren.filter(c => c.last_activity && c.last_activity !== 'No recent activity').length;
      const avgAcc  = avg(formattedChildren.map(c => parseFloat(c.recent_performance || 0)));
      const avgAtt  = avg(formattedChildren.map(c => parseFloat(c.attention_score    || 0)));

      const charts = computeCharts(childrenData, 'all');

      setData({
        children:   formattedChildren,
        activities: res.recent_activities || res.data?.recent_activities || [],
        anomalies:  res.anomalies         || res.data?.anomalies         || [],
        stats: {
          totalChildren:  res.total_children || res.data?.total_children || formattedChildren.length,
          activeChildren: active,
          avgAccuracy:    avgAcc,
          avgAttention:   avgAtt,
        },
        ...charts,
      });

    } catch (err) {
      console.error('Dashboard load failed:', err);
      // Fallback: try old endpoint
      try {
        await loadFallback();
      } catch (e) {
        if (mounted.current) setLoadError('Failed to load dashboard data.');
      }
    }
  };

  // Fallback to old multi-request approach if new endpoint doesn't exist yet
  const loadFallback = async () => {
    const [dashRes, anomaliesRes] = await Promise.all([
      guardianService.getDashboardOverview(),
      guardianService.getAllAnomalies().catch(() => ({ data: [] })),
    ]);
    if (!mounted.current) return;
    const dashData = dashRes?.data || dashRes || {};
    const children = dashData.children || [];
    const anomalies = anomaliesRes?.data || [];
    const active = children.filter(c => c.last_activity && c.last_activity !== 'No recent activity').length;
    setData(prev => ({
      ...prev,
      children:   children.map(c => ({ ...c, user: { full_name: c.name } })),
      activities: dashData.recent_activities || [],
      anomalies,
      stats: { totalChildren: dashData.total_children || children.length, activeChildren: active, avgAccuracy: avg(children.map(c=>parseFloat(c.recent_performance||0))), avgAttention: 0 },
    }));
  };

  const handleFeedbackSubmit = async () => {
    if (!rating)          { setFeedbackError('Please select a rating');     return; }
    if (!feedback.trim()) { setFeedbackError('Please enter your feedback'); return; }

    setFeedbackError(''); setFeedbackSuccess(null);

    // Clear form instantly — don't make the user wait for Python sentiment analysis
    const savedText   = feedback;
    const savedRating = rating;
    setRating(0);
    setFeedback('');
    setFeedbackSuccess('sending'); // show a subtle "sending" state

    try {
      const r = await guardianService.submitFeedback({ text: savedText, rating: savedRating });
      if (r.success) {
        const s = r.feedback?.sentiment;
        setFeedbackSuccess(typeof s==='object' ? s?.result : s);
        setTimeout(() => setFeedbackSuccess(null), 4000);
      } else {
        setFeedbackError('Submission failed.');
        setFeedbackSuccess(null);
        // Restore form on failure
        setFeedback(savedText);
        setRating(savedRating);
      }
    } catch (err) {
      setFeedbackError(err.data?.message || err.message || 'Failed to submit');
      setFeedbackSuccess(null);
      setFeedback(savedText);
      setRating(savedRating);
    }
  };

  return (
    <DashboardLayout>

      <div className="ptd-doctor-welcome">
        <div className="ptd-doctor-emoji">
          <img src={therapistImg} alt="Therapist" className="welcome-illustration" style={{ height:100, width:'auto' }} />
        </div>
        <div className="ptd-doctor-content">
          <div className="ptd-doctor-title">Welcome back, Dr. {user?.full_name?.split(' ').slice(-1)[0]||'User'}!</div>
          <div className="ptd-doctor-text">
            You have {data.stats.activeChildren} active patients today.
            {data.anomalies.length>0 && ` ${data.anomalies.length} anomalies need review.`}
          </div>
        </div>
      </div>

      {loadError && (
        <div style={{ backgroundColor:'#ffebee', color:'#c62828', padding:'16px 20px', borderRadius:8, marginBottom:24, borderLeft:'4px solid #c62828', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>⚠️ {loadError}</span>
          <button onClick={()=>{setLoadError(null);load();}} style={{ background:'#c62828', color:'white', border:'none', padding:'8px 16px', borderRadius:4, cursor:'pointer', fontSize:14 }}>Retry</button>
        </div>
      )}

     

      <div className="ptd-stats-grid five-cols">
        <StatsCard title="Total Patients"   value={data.stats.totalChildren}      icon={<Users />}         iconColor="green" />
        <StatsCard title="Active This Week" value={data.stats.activeChildren}     icon={<UserCheck />}     iconColor="teal"   />
        <StatsCard title="Avg. Accuracy"    value={`${data.stats.avgAccuracy}%`}  icon={<Target />}        iconColor="green"  />
        <StatsCard title="Avg. Attention"   value={`${data.stats.avgAttention}%`} icon={<Brain />}         iconColor="blue"  />
        <StatsCard title="Anomalies"        value={(() => {
          const flaggedChildren = data.children.filter(c => {
            const att  = c.attention_score  || 0;
            const acc  = c.recent_performance || c.average_accuracy || 0;
            const sess = c.games_played || c.game_sessions_count || 0;
            return att < 50 || acc < 50 || sess === 0;
          }).length;
          return data.anomalies.length || flaggedChildren;
        })()}                              icon={<AlertTriangle />} iconColor="red" />
      </div>

      <div className="ptd-content-grid">
        <div className="ptd-content-left">

          <div style={{ marginBottom:18 }}>
            <ProgressLineChart data={data.weeklyProgress} title="Daily Performance Overview (Last 7 Days)" />
          </div>
          {data.anomalies.length>0 && (
                  <div className="ptd-alert-banner">
                    <div className="ptd-alert-banner-icon"><AlertTriangle /></div>
                    <div className="ptd-alert-banner-content">
                      <div className="ptd-alert-banner-title">You have {data.anomalies.length} anomalies today</div>
                      <div className="ptd-alert-banner-text">{data.anomalies[0]?.child_name} – {String(data.anomalies[0]?.reason||'').slice(0,60)}</div>
                    </div>
                    <button className="ptd-alert-banner-action" onClick={()=>navigate('/guardian/anomalies')}>Review Now</button>
                  </div>
                )}
          <div style={{ marginBottom:18 }}>
            <NeedsAttentionWidget children={data.children} onView={id=>navigate(`/guardian/children/${id}`)} />
          </div>

          <div style={{ marginBottom:18, display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ fontWeight:600, fontSize:14, color:'#0F3D3A' }}>View Charts For:</label>
            <select value={selectedChildId} onChange={e=>setSelectedChildId(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d0d5dd', fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'#0F3D3A', backgroundColor:'white' }}>
              <option value="all">All Patients</option>
              {data.children.map(c=>(
                <option key={c.id} value={c.id}>{c.user?.full_name||c.name||`Child ${c.id}`}</option>
              ))}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))', gap:18, marginBottom:18 }}>
            <GameSessionsBreakdownChart data={data.gameSessionsBreakdown} title="Game Sessions by Type" />
            <GameSessionsTrendChart     data={data.gameSessionsTrend}     title="Game Sessions (Last 7 Days)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))', gap:18, marginBottom:18 }}>
            <VoiceInstructionBreakdownChart data={data.voiceInstructionBreakdown} title="Voice Attempts by Instruction" />
            <VoiceAccuracyTrendChart        data={data.voiceAccuracyTrend}        title="Voice Performance (Last 7 Days)" />
          </div>

          <div style={{ marginBottom:18 }}>
            <ReadingProgressTable data={data.readingProgress} />
          </div>

          <div className="ptd-card">
            <div className="ptd-card-header">
              <span className="ptd-card-title">Your Patients</span>
              <button className="ptd-card-action" onClick={()=>navigate('/guardian/children')}>See all</button>
            </div>
            <div className="ptd-children-grid">
              {data.children.slice(0,4).map(child=>(
                <TherapistChildCard key={child.id} child={child} />
              ))}
              {!data.children.length && <div className="ptd-empty-state" style={{ gridColumn:'1/-1' }}>No patients linked yet.</div>}
            </div>
          </div>



   

          {feedbackSuccess && feedbackSuccess !== 'sending' && (
            <div style={{ backgroundColor:sentimentColor(feedbackSuccess), color:'white', padding:'12px 20px', borderRadius:8, marginTop:24, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:24 }}>{sentimentIcon(feedbackSuccess)}</span>
              <div><strong>Thank you!</strong><div>Sentiment: {sentimentLabel(feedbackSuccess)}</div></div>
            </div>
          )}
          {feedbackSuccess === 'sending' && (
            <div style={{ backgroundColor:'#F0FDF4', color:'#065F46', padding:'12px 20px', borderRadius:8, marginTop:24, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid #BBF7D0', borderTopColor:'#22C55E', animation:'spin 0.7s linear infinite' }} />
              <div>Feedback submitted — analysing sentiment…</div>
            </div>
          )}
          {feedbackError && (
            <div style={{ backgroundColor:'#ffebee', color:'#c62828', padding:'12px 20px', borderRadius:8, marginTop:16, borderLeft:'4px solid #c62828' }}>❌ {feedbackError}</div>
          )}

          <div className="ptd-feedback-card" style={{ marginTop:18 }}>
            <div className="ptd-feedback-header">📝 Share Your Feedback</div>
            <div className="ptd-stars">
              {[1,2,3,4,5].map(star=>(
                <button key={star} type="button" className={`ptd-star ${star<=rating?'filled':'empty'}`} onClick={()=>setRating(star)} disabled={submitting}><Star /></button>
              ))}
              {rating>0 && <span style={{ fontSize:13, color:'var(--ptd-text-secondary)', marginLeft:8, alignSelf:'center' }}>{rating===5?'Excellent!':rating===4?'Great':rating===3?'Good':rating===2?'Fair':'Poor'}</span>}
            </div>
            <div className="ptd-feedback-row">
              <textarea className="ptd-textarea" placeholder="How was your experience today?" value={feedback} onChange={e=>setFeedback(e.target.value)} style={{ minHeight:60 }} disabled={submitting} />
              <button className="ptd-feedback-submit" onClick={handleFeedbackSubmit} disabled={submitting}>
                {feedbackSuccess === 'sending' ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default TherapistDashboard;