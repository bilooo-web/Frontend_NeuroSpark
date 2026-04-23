import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Gamepad2, Mic, Brain, AlertTriangle, FileText, Download, CheckCircle, Clock, Target, Activity, TrendingUp, TrendingDown, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import api from '../services/api';
import guardianService from '../services/guardianService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = v => v != null ? Math.round(parseFloat(v)) : '—';
const fmtPct = v => v != null ? `${Math.round(parseFloat(v))}%` : '—';
const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return '—'; } };
const fmtTime = d => { try { return new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); } catch { return ''; } };
const scoreColor = v => v >= 70 ? '#22C55E' : v >= 40 ? '#F59E0B' : '#EF4444';
const scoreBg    = v => v >= 70 ? '#F0FDF4' : v >= 40 ? '#FFFBEB' : '#FEF2F2';

// ─── Gauge Chart (pure SVG, no deps) ─────────────────────────────────────────
const Gauge = ({ value = 0, label, color = '#137a76', size = 130 }) => {
  const r   = 44;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, value)) / 100;
  const dash = pct * circ * 0.75;
  const gap  = circ - dash;
  const rot  = -225;
  return (
    <div style={{ textAlign:'center', padding:'12px 8px' }}>
      <svg width={size} height={size * 0.78} viewBox="0 0 100 78">
        <circle cx="50" cy="58" r={r} fill="none" stroke="#E8EAF0" strokeWidth="8"
          strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeLinecap="round"
          transform={`rotate(${rot} 50 58)`} />
        <circle cx="50" cy="58" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${gap + circ*0.25}`} strokeLinecap="round"
          transform={`rotate(${rot} 50 58)`}
          style={{ transition:'stroke-dasharray 0.8s ease' }} />
        <text x="50" y="62" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{value ?? 0}</text>
        <text x="50" y="74" textAnchor="middle" fontSize="9" fill="#8B8FA3">{label}</text>
      </svg>
      <div style={{ fontSize:11, color:scoreColor(value), fontWeight:600, marginTop:2 }}>
        {value >= 70 ? '● Good' : value >= 40 ? '● Moderate' : '● Needs Support'}
      </div>
    </div>
  );
};

// ─── Note cell — editable for therapist, read-only for parent ────────────────
const NoteCell = ({ sessionId, type, existingNote, onSave, readOnly = false }) => {
  const [open, setOpen]     = useState(false);
  const [text, setText]     = useState(existingNote || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(sessionId, text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  // Parent view: just show the note text if it exists, nothing if not
  if (readOnly) {
    if (!existingNote) return <span style={{ color:'#9CA3AF', fontSize:12, fontStyle:'italic' }}>—</span>;
    return (
      <div>
        <button onClick={() => setOpen(o => !o)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#137a76', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          View Note
        </button>
        {open && (
          <div style={{ marginTop:8, padding:'8px 10px', background:'#F0FDF4', borderRadius:8, border:'1px solid #BBF7D0', fontSize:12, color:'#374151', lineHeight:1.5 }}>
            {existingNote}
          </div>
        )}
      </div>
    );
  }

  // Therapist view: full editable note
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#137a76', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, padding:0 }}>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {existingNote ? 'Edit Note' : 'Add Note'}
      </button>
      {open && (
        <div style={{ marginTop:8 }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder={`Add therapist note & recommendation for this ${type === 'game' ? 'game session' : 'voice attempt'}…`}
            style={{ width:'100%', minHeight:72, padding:'8px 10px', borderRadius:8, border:'1px solid #d0d5dd', fontSize:12, resize:'vertical', fontFamily:'inherit', outline:'none', lineHeight:1.5 }} />
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
            <button onClick={save} disabled={saving || !text.trim()}
              style={{ background: saving||!text.trim() ? '#E8EAF0' : '#137a76', color: saving||!text.trim() ? '#8B8FA3' : 'white', border:'none', borderRadius:6, padding:'5px 14px', fontSize:12, fontWeight:600, cursor: saving||!text.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <Save size={12} /> {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span style={{ fontSize:12, color:'#22C55E', fontWeight:600 }}>✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Table wrapper ────────────────────────────────────────────────────────────
const TableWrap = ({ children }) => (
  <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #E8EAF0' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>{children}</table>
  </div>
);
const TH = ({ children, style }) => (
  <th style={{ padding:'10px 14px', textAlign:'left', background:'#F8FAFC', color:'#5A6170', fontWeight:600, fontSize:12, borderBottom:'1px solid #E8EAF0', whiteSpace:'nowrap', ...style }}>{children}</th>
);
const TD = ({ children, style }) => (
  <td style={{ padding:'10px 14px', borderBottom:'1px solid #F3F4F6', color:'#374151', verticalAlign:'top', ...style }}>{children}</td>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ icon, text }) => (
  <div style={{ textAlign:'center', padding:'48px 24px', color:'#8B8FA3' }}>
    <div style={{ fontSize:40, marginBottom:12, opacity:.4 }}>{icon}</div>
    <p style={{ fontSize:14 }}>{text}</p>
  </div>
);

// ─── Recommendation card ──────────────────────────────────────────────────────
const RecCard = ({ text }) => (
  <div style={{ padding:'10px 14px', background:'#F0FDF4', borderLeft:'3px solid #22C55E', borderRadius:'0 8px 8px 0', marginBottom:8, fontSize:13, color:'#374151', lineHeight:1.5 }}>{text}</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ChildDetail = () => {
  const { isTherapist, isParent } = useApp();
  const { id }             = useParams();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  const initialTab         = searchParams.get('tab') || 'games';

  const [activeTab, setActiveTab] = useState(initialTab);

  // Data
  const [child,     setChild]     = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [voice,     setVoice]     = useState([]);
  const [insights,  setInsights]  = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Notes state keyed by id
  const [gameNotes,  setGameNotes]  = useState({});
  const [voiceNotes, setVoiceNotes] = useState({});

  // Export
  const [therapistNotes, setTherapistNotes] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [genPdf, setGenPdf]       = useState(false);
  const [genCsv, setGenCsv]       = useState(false);

  // UI
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadAll();
    return () => { mounted.current = false; };
  }, [id]);

  // ── Load everything in one parallel blast ──────────────────────────────────
  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [sessRes, voiceRes, insRes, anomRes, progRes] = await Promise.all([
        api.get(`/guardian/children/${id}/sessions`).catch(() => null),
        guardianService.getChildVoiceAttempts(id).catch(() => null),
        guardianService.getChildInsights(id).catch(() => null),
        guardianService.getChildAnomalies(id).catch(() => null),
        guardianService.getChildProgress(id).catch(() => null),
      ]);
      if (!mounted.current) return;

      // Sessions
      const sessData = sessRes?.sessions || sessRes?.data?.sessions || [];
      setSessions(sessData);

      // Pre-populate note state from existing guardian_note
      const gn = {};
      sessData.forEach(s => { if (s.guardian_note) gn[s.id] = s.guardian_note; });
      setGameNotes(gn);

      // Voice
      const voiceData = Array.isArray(voiceRes) ? voiceRes : (voiceRes?.data || []);
      setVoice(voiceData);
      const vn = {};
      voiceData.forEach(v => { if (v.guardian_note) vn[v.id] = v.guardian_note; });
      setVoiceNotes(vn);

      // Insights
      const ins = insRes?.insights || insRes?.data?.insights || insRes?.data || null;
      setInsights(ins);

      // Anomalies — API first, full 6-signal client-side fallback (mirrors AnalyticsService.php)
      const apiAnomalies = anomRes?.anomalies || anomRes?.data?.anomalies || anomRes?.data || [];
      const anomaliesArr = Array.isArray(apiAnomalies) ? apiAnomalies : [];
      if (anomaliesArr.length > 0) {
        setAnomalies(anomaliesArr);
      } else {
        const allSess   = sessRes?.sessions || sessRes?.data?.sessions || [];
        const completed = allSess
          .filter(s => s.score != null && s.session_status === 'completed' && (s.total_attempts || 0) > 0)
          .slice()
          .sort((a, b) => new Date(a.played_at) - new Date(b.played_at));
        const detected  = [];

        if (completed.length >= 2) {
          // Personal score baseline
          const scores   = completed.map(s => parseFloat(s.score) || 0);
          const mean     = scores.reduce((a, b) => a + b, 0) / scores.length;
          const variance = scores.length > 1
            ? scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (scores.length - 1)
            : 0;
          const std = Math.sqrt(variance);

          // Personal median response time (signal 4 baseline — robust, ignores its own spikes)
          const rts      = completed.map(s => parseFloat(s.avg_response_time) || 0).filter(v => v > 0).sort((a,b) => a-b);
          const mid      = Math.floor(rts.length / 2);
          const medianRt = rts.length === 0 ? null : rts.length % 2 === 0 ? (rts[mid-1]+rts[mid])/2 : rts[mid];

          let prevScore = null;

          completed.forEach(s => {
            const score    = parseFloat(s.score)             || 0;
            const accuracy = parseFloat(s.accuracy)          || 0;
            const rt       = parseFloat(s.avg_response_time) || 0;
            const inactive = parseInt(s.inactivity_events)   || 0;
            const reasons  = [];
            let severity   = 'warning';

            // Signal 1: Z-score outlier (only reliable with >=5 sessions)
            if (completed.length >= 5 && std > 0) {
              const z = Math.abs(score - mean) / std;
              if (z > 2.0) {
                if (score < mean) {
                  reasons.push(`Score (${Math.round(score)}%) is much lower than this child's usual performance — their average across ${completed.length} sessions is ${Math.round(mean)}%. This session is an outlier for them specifically.`);
                } else {
                  reasons.push(`Score (${Math.round(score)}%) is unusually high compared to this child's usual performance (average: ${Math.round(mean)}% across ${completed.length} sessions). Worth checking if conditions were different.`);
                }
                if (z > 3.0) severity = 'critical';
              }
            }
            // Signal 2: Absolute low score
            if (score < 40) {
              reasons.push(`Score was ${Math.round(score)}%, meaning the child answered most questions incorrectly. This level of performance suggests the task may have been too difficult, or the child was not able to engage during this session.`);
              severity = 'critical';
            }
            // Signal 3: Accuracy–score mismatch (impulsivity / guessing)
            if (score > 70 && accuracy > 0 && accuracy < 45) {
              reasons.push(`The child scored ${Math.round(score)}% overall but only got ${Math.round(accuracy)}% of answers correct. This gap usually means the child was answering very quickly without reading carefully — a sign of impulsive or rushed behaviour worth discussing in a session.`);
            }
            // Signal 4: Response time spike (fatigue / confusion)
            if (medianRt && medianRt > 0 && rt > 0 && rt > medianRt * 2.0) {
              reasons.push(`The child took an average of ${(rt/1000).toFixed(1)} seconds per answer in this session, compared to their usual ${(medianRt/1000).toFixed(1)} seconds. Taking this much longer than normal to respond can be a sign of tiredness, confusion, or difficulty with the task.`);
            }
            // Signal 5: High inactivity (disengagement)
            if (inactive > 5) {
              reasons.push(`The child stopped interacting ${inactive} times during this session. Repeated pauses like this suggest difficulty maintaining focus or attention throughout the task. Consider whether session length, time of day, or task difficulty played a role.`);
              if (inactive > 10) severity = 'critical';
            }
            // Signal 6: Sudden drop from previous session
            if (prevScore !== null && (prevScore - score) > 30) {
              reasons.push(`Performance dropped from ${Math.round(prevScore)}% in the previous session to ${Math.round(score)}% in this one — a fall of ${Math.round(prevScore - score)} points. A sudden drop like this is worth investigating: it may reflect a difficult day, an emotional issue, fatigue, or a change in the child's environment.`);
            }

            if (reasons.length > 0) {
              detected.push({ session_id: s.id, played_at: s.played_at, score: s.score, accuracy: s.accuracy, avg_response_time: s.avg_response_time, inactivity_events: s.inactivity_events, reason: reasons.join(' · '), severity, signals_count: reasons.length });
            }
            prevScore = score;
          });

          detected.sort((a, b) => b.signals_count - a.signals_count);
        }
        setAnomalies(detected);
      }

      // Child info + recommendations from progress
      const prog = progRes?.data || progRes || {};
      const childFromSess = sessRes?.child || sessRes?.data?.child || null;
      setChild(prog.child || childFromSess || null);
      setRecommendations(prog.recommendations || []);

    } catch (err) {
      if (mounted.current) setError('Failed to load patient data. Please retry.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  // ── Save game session note ─────────────────────────────────────────────────
  const saveGameNote = async (sessionId, note) => {
    await api.post(`/guardian/game-sessions/${sessionId}/note`, { guardian_note: note });
    setGameNotes(prev => ({ ...prev, [sessionId]: note }));
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, guardian_note: note } : s));
  };

  // ── Save voice attempt note ────────────────────────────────────────────────
  const saveVoiceNote = async (attemptId, note) => {
    await guardianService.addVoiceNote(attemptId, note);
    setVoiceNotes(prev => ({ ...prev, [attemptId]: note }));
    setVoice(prev => prev.map(v => v.id === attemptId ? { ...v, guardian_note: note } : v));
  };

  // ── Behavioral charts data ─────────────────────────────────────────────────
  const buildPerformanceTrend = () => {
    const map = {};
    sessions.forEach(s => {
      try {
        const k = new Date(s.played_at).toISOString().split('T')[0];
        if (!map[k]) map[k] = { scores:[], accuracies:[] };
        if (s.score    != null) map[k].scores.push(parseFloat(s.score));
        if (s.accuracy != null) map[k].accuracies.push(parseFloat(s.accuracy));
      } catch {}
    });
    // Only return days that actually have data — no nulls, no dot artifacts
    return Object.entries(map)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([k, v]) => ({
        day:      new Date(k).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
        score:    v.scores.length    ? Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length)    : 0,
        accuracy: v.accuracies.length ? Math.round(v.accuracies.reduce((a,b)=>a+b,0)/v.accuracies.length) : 0,
      }));
  };

  const buildSessionsByHour = () => {
    const hours = Array.from({length:24},(_,i)=>({ hour:`${i}:00`, sessions:0, avgScore:0, scores:[] }));
    sessions.forEach(s => {
      try { const h = new Date(s.played_at).getHours(); hours[h].sessions++; if(s.score) hours[h].scores.push(parseFloat(s.score)); } catch {}
    });
    return hours.filter(h=>h.sessions>0).map(h=>({ ...h, avgScore: h.scores.length ? Math.round(h.scores.reduce((a,b)=>a+b,0)/h.scores.length) : 0 }));
  };

  const buildGameBreakdown = () => {
    const map = {};
    sessions.forEach(s => {
      const g = s.game?.name || s.game?.game_slug || 'Unknown';
      if (!map[g]) map[g] = { name:g, count:0, scores:[], accuracies:[] };
      map[g].count++;
      if (s.score    != null) map[g].scores.push(parseFloat(s.score));
      if (s.accuracy != null) map[g].accuracies.push(parseFloat(s.accuracy));
    });
    return Object.values(map).map(g=>({
      name: g.name.length > 14 ? g.name.slice(0,14)+'…' : g.name,
      sessions: g.count,
      avgScore:    g.scores.length    ? Math.round(g.scores.reduce((a,b)=>a+b,0)/g.scores.length)    : 0,
      avgAccuracy: g.accuracies.length ? Math.round(g.accuracies.reduce((a,b)=>a+b,0)/g.accuracies.length) : 0,
    })).sort((a,b)=>b.sessions-a.sessions).slice(0,8);
  };

  const buildVoiceAccuracyTrend = () => {
    const map = {};
    voice.forEach(v => {
      try {
        const k = new Date(v.created_at).toISOString().split('T')[0];
        if (!map[k]) map[k] = { scores:[] };
        if (v.accuracy_score != null) map[k].scores.push(parseFloat(v.accuracy_score));
      } catch {}
    });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-14).map(([k,v])=>({
      day: new Date(k).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
      accuracy: v.scores.length ? Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length) : 0,
    }));
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const generatePDF = () => {
    setGenPdf(true);
    const name      = childName;
    const today     = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    const initials  = name.split(' ').map(n=>n[0]).join('').slice(0,2);
    const totalSess  = completedSessions.length;
    const avgScore   = totalSess ? Math.round(completedSessions.reduce((s,x)=>s+(parseFloat(x.score)||0),0)/totalSess) : 0;
    const avgAcc     = totalSess ? Math.round(completedSessions.reduce((s,x)=>s+(parseFloat(x.accuracy)||0),0)/totalSess) : 0;
    const totalVoice = voice.length;
    const avgVoiceAcc = totalVoice ? Math.round(voice.reduce((s,v)=>s+(parseFloat(v.accuracy_score)||0),0)/totalVoice) : 0;

    // ── Game sessions rows
    const gameRows = sessions.map((s,i) => `
      <tr style="background:${i%2===0?'#fff':'#F9FAFB'}">
        <td>${fmtDate(s.played_at)}<br/><span style="font-size:10px;color:#9CA3AF">${fmtTime(s.played_at)}</span></td>
        <td>${s.game?.name||s.game?.game_slug||'—'}</td>
        <td><span class="pill ${s.score>=70?'green':s.score>=40?'amber':'red'}">${s.score!=null?Math.round(s.score)+'%':'—'}</span></td>
        <td><span class="pill ${s.accuracy>=70?'green':s.accuracy>=40?'amber':'red'}">${s.accuracy!=null?Math.round(s.accuracy)+'%':'—'}</span></td>
        <td>${s.duration!=null?(s.duration/60).toFixed(1)+' min':'—'}</td>
        <td>${s.incorrect_attempts??'—'} / ${s.total_attempts??'—'}</td>
        <td>${s.avg_response_time!=null?Math.round(s.avg_response_time)+' ms':'—'}</td>
        <td><span class="${s.session_status==='completed'?'badge-green':'badge-amber'}">${s.session_status||'—'}</span></td>
        <td style="font-size:11px;color:#374151;font-style:italic">${s.guardian_note||''}</td>
      </tr>`).join('');

    // ── Voice rows
    const voiceRows = voice.map((v,i) => `
      <tr style="background:${i%2===0?'#fff':'#F9FAFB'}">
        <td>${fmtDate(v.created_at)}<br/><span style="font-size:10px;color:#9CA3AF">${fmtTime(v.created_at)}</span></td>
        <td>${v.voice_instruction?.title||'—'}</td>
        <td><span class="pill ${v.accuracy_score>=70?'green':v.accuracy_score>=40?'amber':'red'}">${v.accuracy_score!=null?Math.round(v.accuracy_score)+'%':'—'}</span></td>
        <td>${v.pronunciation_score!=null&&v.pronunciation_score>0?Math.round(v.pronunciation_score)+'%':'—'}</td>
        <td>${v.total_words??'—'}</td>
        <td style="color:${(v.incorrect_words||0)>0?'#EF4444':'#22C55E'};font-weight:600">${v.incorrect_words??'—'}</td>
        <td>${v.duration!=null?(v.duration/60).toFixed(1)+' min':'—'}</td>
        <td style="font-size:11px;color:#374151;font-style:italic">${v.guardian_note||''}</td>
      </tr>`).join('');

    // ── Anomaly rows
    const anomalyRows = anomalies.map((a,i) => `
      <tr style="background:${i%2===0?'#fff':'#FFFBEB'}">
        <td>${fmtDate(a.played_at)}</td>
        <td><span class="pill ${a.score>=70?'green':a.score>=40?'amber':'red'}">${a.score!=null?Math.round(a.score)+'%':'—'}</span></td>
        <td style="color:#EF4444">${a.reason||'—'}</td>
        <td style="color:#9CA3AF;font-size:11px">#${a.session_id||'—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Clinical Report — ${name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;font-size:12px;}
.hdr{background:linear-gradient(135deg,#0F3D3A,#137a76);color:white;padding:28px 36px;display:flex;justify-content:space-between;align-items:flex-start;}
.hdr h1{font-size:22px;font-weight:800;margin-bottom:4px;}
.hdr p{font-size:12px;opacity:.8;}
.badge-conf{background:rgba(255,255,255,.15);border-radius:20px;padding:4px 12px;font-size:10px;margin-top:8px;display:inline-block;}
.body{padding:28px 36px;}
.profile{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:16px;}
.av{width:50px;height:50px;background:linear-gradient(135deg,#0F3D3A,#137a76);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:800;flex-shrink:0;}
.stt{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;}
.sb{background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center;}
.sb .v{font-size:20px;font-weight:800;color:#0F3D3A;}.sb .l{font-size:9px;color:#9CA3AF;margin-top:2px;text-transform:uppercase;letter-spacing:.5px;}
.sec-t{font-size:13px;font-weight:700;color:#0F3D3A;border-bottom:2px solid #BBF7D0;padding-bottom:6px;margin:20px 0 10px;page-break-after:avoid;}
.ig{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
.ib{background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:14px;text-align:center;}
.ib .s{font-size:24px;font-weight:800;}.ib .l{font-size:11px;color:#6B7280;margin-top:2px;}
.grn{color:#22C55E;}.amb{color:#F59E0B;}.tel{color:#14B8A6;}
.rec{padding:7px 11px;background:#F0FDF4;border-left:3px solid #22C55E;border-radius:0 6px 6px 0;margin-bottom:6px;font-size:12px;}
.notes{background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin:16px 0;}
.notes h3{font-size:12px;font-weight:700;color:#92400E;margin-bottom:8px;}
.notes p{line-height:1.8;white-space:pre-wrap;min-height:50px;color:#374151;}
.sig{border-top:1px solid #D1D5DB;width:160px;margin-top:28px;padding-top:6px;font-size:10px;color:#6B7280;}
.ftr{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:12px 36px;display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;}
th{padding:7px 9px;text-align:left;background:#F0FDF4;color:#374151;font-weight:600;border-bottom:2px solid #BBF7D0;}
td{padding:6px 9px;border-bottom:1px solid #F3F4F6;vertical-align:top;}
.pill{border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;}
.pill.green{background:#D1FAE5;color:#065F46;}
.pill.amber{background:#FEF3C7;color:#92400E;}
.pill.red{background:#FEE2E2;color:#991B1B;}
.badge-green{background:#D1FAE5;color:#065F46;border-radius:9999px;padding:1px 6px;font-size:10px;}
.badge-amber{background:#FEF3C7;color:#92400E;border-radius:9999px;padding:1px 6px;font-size:10px;}
.no-data{color:#9CA3AF;font-style:italic;padding:12px;text-align:center;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page-break{page-break-before:always;}}
</style></head><body>

<div class="hdr">
  <div><h1>NeuroSpark</h1><p>Clinical Progress Report</p><div class="badge-conf">CONFIDENTIAL — THERAPIST USE ONLY</div></div>
  <div style="text-align:right;font-size:11px;opacity:.85;"><div>${today}</div></div>
</div>

<div class="body">
  <!-- Profile -->
  <div class="profile">
    <div class="av">${initials}</div>
    <div>
      <div style="font-size:17px;font-weight:700;">${name}</div>
      <div style="color:#6B7280;margin-top:2px;font-size:12px;">Age ${childAge ?? 'N/A'}</div>
    </div>
  </div>

  <!-- Summary stats -->
  <div class="stt">
    <div class="sb"><div class="v">${totalSess}</div><div class="l">Game Sessions</div></div>
    <div class="sb"><div class="v">${avgScore}%</div><div class="l">Avg Score</div></div>
    <div class="sb"><div class="v">${totalVoice}</div><div class="l">Voice Attempts</div></div>
    <div class="sb"><div class="v">${avgVoiceAcc}%</div><div class="l">Voice Accuracy</div></div>
  </div>

  <!-- GAME SESSIONS -->
  <div class="sec-t">🎮 Game Sessions (${totalSess})</div>
  ${totalSess > 0 ? `
  <table>
    <thead><tr>
      <th>Date</th><th>Game</th><th>Score</th><th>Accuracy</th><th>Duration</th>
      <th>Incorrect/Total</th><th>Avg Response</th><th>Status</th><th>Therapist Note</th>
    </tr></thead>
    <tbody>${gameRows}</tbody>
  </table>` : '<div class="no-data">No game sessions recorded.</div>'}

  <!-- VOICE SESSIONS -->
  <div class="sec-t page-break">🎙️ Voice Sessions (${totalVoice})</div>
  ${totalVoice > 0 ? `
  <table>
    <thead><tr>
      <th>Date</th><th>Instruction</th><th>Accuracy</th><th>Pronunciation</th>
      <th>Total Words</th><th>Incorrect</th><th>Duration</th><th>Therapist Note</th>
    </tr></thead>
    <tbody>${voiceRows}</tbody>
  </table>` : '<div class="no-data">No voice sessions recorded.</div>'}

  <!-- BEHAVIORAL INSIGHTS -->
  <div class="sec-t">🧠 Behavioral Insights</div>
  ${insights ? `
  <div class="ig">
    <div class="ib"><div class="s grn">${insights.attention_score ?? 0}</div><div class="l">Attention Score</div></div>
    <div class="ib"><div class="s amb">${insights.impulsivity_score ?? 0}</div><div class="l">Impulsivity Score</div></div>
    <div class="ib"><div class="s tel">${insights.consistency_score ?? 0}</div><div class="l">Consistency Score</div></div>
  </div>
  ${insights.best_time_of_day ? `<p style="margin-top:8px;font-size:12px;color:#374151;">📅 Best performance time: <strong>${insights.best_time_of_day}</strong></p>` : ''}
  ` : '<div class="no-data">No behavioral insights yet. At least 5 completed sessions are needed.</div>'}

  <!-- ANOMALIES -->
  <div class="sec-t">⚠️ Flagged Sessions / Anomalies (${anomalies.length})</div>
  ${anomalies.length > 0 ? `
  <table>
    <thead><tr><th>Date</th><th>Score</th><th>Reason</th><th>Session ID</th></tr></thead>
    <tbody>${anomalyRows}</tbody>
  </table>` : '<div class="no-data" style="background:#F0FDF4;color:#065F46;border-radius:6px;padding:10px;">✅ No anomalies detected — performance within normal range.</div>'}

  <!-- AI RECOMMENDATIONS -->
  ${recommendations.length ? `
  <div class="sec-t">💡 AI Recommendations</div>
  ${recommendations.map(r=>`<div class="rec">${r}</div>`).join('')}
  ` : ''}

  <!-- THERAPIST NOTES -->
  <div class="notes">
    <h3>📝 Therapist Clinical Notes</h3>
    <p>${therapistNotes.trim() || '<span style="color:#9CA3AF;font-style:italic;">No notes added.</span>'}</p>
  </div>

  <div class="sig">Therapist Signature</div>
</div>

<div class="ftr">
  <div>NeuroSpark — Confidential</div><div>${today}</div><div>Patient: ${name}</div>
</div>
</body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
    setExportMsg("PDF opened — use browser's 'Save as PDF'");
    setTimeout(() => setExportMsg(''), 4000);
    setGenPdf(false);
  };

  // ── CSV ────────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    setGenCsv(true);
    let csv = '';
    csv += `NEUROSPARK CLINICAL REPORT\nPatient: ${childName}\nAge: ${childAge ?? 'N/A'}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    csv += 'GAME SESSIONS\nDate,Time,Game,Score,Accuracy,Duration(s),Incorrect,Total Attempts,Avg Response(ms),Response Variability(ms),Inactivity Events,Status,Therapist Note\n';
    sessions.forEach(s => {
      csv += `${fmtDate(s.played_at)},${fmtTime(s.played_at)},${s.game?.name||'Unknown'},${s.score??''},${s.accuracy??''},${s.duration??''},${s.incorrect_attempts??''},${s.total_attempts??''},${s.avg_response_time!=null?Math.round(s.avg_response_time):''},${s.response_time_variability!=null?Math.round(s.response_time_variability):''},${s.inactivity_events??''},${s.session_status||''},"${(s.guardian_note||'').replace(/"/g,'""')}"\n`;
    });
    csv += '\nVOICE ATTEMPTS\nDate,Time,Instruction,Accuracy Score,Pronunciation Score,Speech Rate(w/s),Total Words,Incorrect Words,Duration(s),Pause Duration(ms),Speaker Clicks,Word Clicks,Therapist Note\n';
    voice.forEach(v => {
      csv += `${fmtDate(v.created_at)},${fmtTime(v.created_at)},"${v.voice_instruction?.title||'Unknown'}",${v.accuracy_score??''},${v.pronunciation_score??''},${v.speech_rate!=null?parseFloat(v.speech_rate).toFixed(2):''},${v.total_words??''},${v.incorrect_words??''},${v.duration??''},${v.pause_duration!=null?Math.round(v.pause_duration):''},${v.speaker_clicks??''},${v.word_clicks??''},"${(v.guardian_note||'').replace(/"/g,'""')}"\n`;
    });
    if (insights) {
      csv += `\nBEHAVIORAL INSIGHTS\nAttention Score,${insights.attention_score??''}\nImpulsivity Score,${insights.impulsivity_score??''}\nConsistency Score,${insights.consistency_score??''}\nBest Time of Day,${insights.best_time_of_day||'N/A'}\n`;
    }
    csv += '\nANOMALIES\nDate,Reason\n';
    anomalies.forEach(a => { csv += `${fmtDate(a.played_at)},"${a.reason||''}"\n`; });
    if (therapistNotes.trim()) { csv += `\nTHERAPIST NOTES\n"${therapistNotes.replace(/"/g,'""')}"\n`; }

    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(childName||'patient').replace(/\s/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
    setExportMsg('CSV exported successfully!');
    setTimeout(() => setExportMsg(''), 3000);
    setGenCsv(false);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const childName = child?.user?.full_name || 'Patient';
  const childAge  = child?.date_of_birth ? new Date().getFullYear() - new Date(child.date_of_birth).getFullYear() : null;
  const initials  = childName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const completedSessions = sessions.filter(s => s.session_status === 'completed' && (s.total_attempts || 0) > 0);

  const TABS = [
    { key:'games',    label:'Game Sessions',      icon:<Gamepad2      size={15}/> },
    { key:'voice',    label:'Voice Sessions',      icon:<Mic           size={15}/> },
    { key:'insights', label:'Behavioral Insights', icon:<Brain         size={15}/> },
    // Anomalies tab: therapist only
    ...(isTherapist ? [{ key:'anomalies', label:'Anomalies', icon:<AlertTriangle size={15}/> }] : []),
    // Export tab: therapist only — parents just view, no export/notes
    ...(isTherapist ? [{ key:'export', label:'Export & Report', icon:<FileText size={15}/> }] : []),
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout>
      <button className="ptd-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/> Back</button>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:16 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid #E8EAF0', borderTopColor:'#137a76', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#8B8FA3', fontSize:14 }}>Loading patient data…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <button className="ptd-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/> Back</button>
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <p style={{ color:'#EF4444', marginBottom:16 }}>{error}</p>
        <button className="ptd-btn ptd-btn-primary" onClick={loadAll}>Retry</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* Back */}
      <button className="ptd-back-btn" onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
        <ArrowLeft size={16}/> Back to Patients
      </button>

      {/* Patient header */}
      <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:28, background:'white', borderRadius:16, padding:'20px 24px', border:'1px solid #E8EAF0', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#0F3D3A,#137a76)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:20, flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#0F3D3A' }}>{childName}</div>
          <div style={{ fontSize:13, color:'#8B8FA3', marginTop:3 }}>
            {childAge ? `Age ${childAge}` : ''}
            {child?.user?.username ? ` · @${child.user.username}` : ''}
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display:'flex', gap:24 }}>
          {[
            { label:'Sessions', val:completedSessions.length, color:'#22C55E' },
            { label:'Voice',    val:voice.length,    color:'#3B82F6' },
            // Anomalies count: therapist only
            ...(isTherapist ? [{ label:'Anomalies', val:anomalies.length, color:'#EF4444' }] : []),
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#8B8FA3' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24, borderBottom:'2px solid #E8EAF0', paddingBottom:0, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', background:'none', border:'none', borderBottom: activeTab===t.key ? '2px solid #137a76' : '2px solid transparent', marginBottom:-2, fontWeight: activeTab===t.key ? 700 : 500, fontSize:13, color: activeTab===t.key ? '#137a76' : '#6B7280', cursor:'pointer', whiteSpace:'nowrap', transition:'color 0.15s' }}>
            {t.icon} {t.label}
            {t.key === 'anomalies' && anomalies.length > 0 && (
              <span style={{ background:'#EF4444', color:'white', borderRadius:9999, fontSize:10, fontWeight:700, padding:'1px 7px', marginLeft:2 }}>{anomalies.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── GAME SESSIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'games' && (
        <div>
          {sessions.length === 0 ? <Empty icon="🎮" text="No game sessions recorded yet." /> : (
            <>
              {/* Summary row — completed sessions only */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                  { label:'Completed Sessions', val: completedSessions.length },
                  { label:'Avg Score',      val: completedSessions.length ? fmtPct(completedSessions.reduce((s,x)=>s+(parseFloat(x.score)||0),0)/completedSessions.length) : '—' },
                  { label:'Avg Accuracy',   val: completedSessions.length ? fmtPct(completedSessions.reduce((s,x)=>s+(parseFloat(x.accuracy)||0),0)/completedSessions.length) : '—' },
                  { label:'Avg Duration',   val: completedSessions.length ? `${(completedSessions.reduce((s,x)=>s+(parseFloat(x.duration)||0),0)/completedSessions.length/60).toFixed(1)} min` : '—' },
                ].map(s => (
                  <div key={s.label} style={{ background:'white', borderRadius:12, border:'1px solid #E8EAF0', padding:'14px 16px' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:'#0F3D3A' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'#8B8FA3', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="ptd-card" style={{ marginBottom:20 }}>
                <div className="ptd-card-header"><span className="ptd-card-title">All Game Sessions</span></div>
                <TableWrap>
                  <thead>
                    <tr>
                      <TH>#</TH>
                      <TH>Date & Time</TH>
                      <TH>Game</TH>
                      <TH>Score</TH>
                      <TH>Accuracy</TH>
                      <TH>Duration</TH>
                      <TH>Incorrect / Total</TH>
                      <TH>Avg Response (ms)</TH>
                      <TH>Response Variability</TH>
                      <TH>Inactivity Events</TH>
                      <TH>Status</TH>
                      <TH>{isTherapist ? 'Therapist Note' : 'Note'}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.id || i} style={{ background: i%2===0 ? 'white' : '#FAFAFA' }}>
                        <TD style={{ color:'#8B8FA3', fontSize:12 }}>{i+1}</TD>
                        <TD>
                          <div style={{ fontWeight:600, fontSize:12 }}>{fmtDate(s.played_at)}</div>
                          <div style={{ fontSize:11, color:'#8B8FA3' }}>{fmtTime(s.played_at)}</div>
                        </TD>
                        <TD style={{ fontWeight:600 }}>{s.game?.name || s.game?.game_slug || '—'}</TD>
                        <TD>
                          <span style={{ background:scoreBg(s.score), color:scoreColor(s.score), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                            {fmt(s.score)}%
                          </span>
                        </TD>
                        <TD>
                          <span style={{ background:scoreBg(s.accuracy), color:scoreColor(s.accuracy), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                            {fmt(s.accuracy)}%
                          </span>
                        </TD>
                        <TD>{s.duration != null ? `${(s.duration/60).toFixed(1)} min` : '—'}</TD>
                        <TD style={{ fontSize:12 }}>{s.incorrect_attempts ?? '—'} / {s.total_attempts ?? '—'}</TD>
                        <TD style={{ fontSize:12 }}>
                          {s.avg_response_time != null
                            ? <span style={{ color: s.avg_response_time > 3000 ? '#EF4444' : s.avg_response_time > 1500 ? '#F59E0B' : '#22C55E', fontWeight:600 }}>{Math.round(s.avg_response_time)} ms</span>
                            : '—'}
                        </TD>
                        <TD style={{ fontSize:12 }}>{s.response_time_variability != null ? `${Math.round(s.response_time_variability)} ms` : '—'}</TD>
                        <TD style={{ fontSize:12 }}>
                          {s.inactivity_events != null
                            ? <span style={{ color: s.inactivity_events > 5 ? '#EF4444' : s.inactivity_events > 2 ? '#F59E0B' : '#22C55E', fontWeight:600 }}>{s.inactivity_events}</span>
                            : '—'}
                        </TD>
                        <TD>
                          <span style={{ background: s.session_status==='completed'?'#D1FAE5':'#FEF3C7', color:s.session_status==='completed'?'#065F46':'#92400E', borderRadius:9999, padding:'2px 8px', fontSize:11, fontWeight:600 }}>
                            {s.session_status || '—'}
                          </span>
                        </TD>
                        <TD style={{ minWidth:180 }}>
                          <NoteCell sessionId={s.id} type="game" existingNote={s.guardian_note} onSave={saveGameNote} readOnly={isParent} />
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>

              {/* Recommendation card below table */}
              {recommendations.length > 0 && (
                <div className="ptd-card">
                  <div className="ptd-card-header"><span className="ptd-card-title">💡Recommendations</span></div>
                  {recommendations.map((r,i) => <RecCard key={i} text={r} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── VOICE SESSIONS TAB ───────────────────────────────────────────── */}
      {activeTab === 'voice' && (
        <div>
          {voice.length === 0 ? <Empty icon="🎙️" text="No voice attempts recorded yet." /> : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                  { label:'Total Attempts', val:voice.length },
                  { label:'Avg Accuracy',   val:fmtPct(voice.reduce((s,v)=>s+(parseFloat(v.accuracy_score)||0),0)/voice.length) },
                  { label:'Total Words',    val:voice.reduce((s,v)=>s+(v.total_words||0),0) },
                  { label:'Avg Duration',   val:`${(voice.reduce((s,v)=>s+(v.duration||0),0)/voice.length/60).toFixed(1)} min` },
                ].map(s => (
                  <div key={s.label} style={{ background:'white', borderRadius:12, border:'1px solid #E8EAF0', padding:'14px 16px' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:'#0F3D3A' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'#8B8FA3', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

                <div className="ptd-card" style={{ marginBottom:20 }}>
                <div className="ptd-card-header"><span className="ptd-card-title">All Voice Attempts</span></div>
                <TableWrap>
                  <thead>
                    <tr>
                      <TH>#</TH>
                      <TH>Date & Time</TH>
                      <TH>Instruction / Story</TH>
                      <TH>Accuracy</TH>
                      <TH>Pronunciation</TH>
                      <TH>Speech Rate (w/s)</TH>
                      <TH>Total Words</TH>
                      <TH>Incorrect</TH>
                      <TH>Duration (s)</TH>
                      <TH>Pause (ms)</TH>
                      <TH>Speaker Clicks</TH>
                      <TH>Word Clicks</TH>
                      <TH>{isTherapist ? 'Therapist Note' : 'Note'}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {voice.map((v, i) => (
                      <tr key={v.id || i} style={{ background: i%2===0 ? 'white' : '#FAFAFA' }}>
                        <TD style={{ color:'#8B8FA3', fontSize:12 }}>{i+1}</TD>
                        <TD>
                          <div style={{ fontWeight:600, fontSize:12 }}>{fmtDate(v.created_at)}</div>
                          <div style={{ fontSize:11, color:'#8B8FA3' }}>{fmtTime(v.created_at)}</div>
                        </TD>
                        <TD style={{ fontWeight:600, maxWidth:180 }}>
                          <div>{v.voice_instruction?.title || '—'}</div>
                          {v.voice_instruction?.description && (
                            <div style={{ fontSize:11, color:'#8B8FA3', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {v.voice_instruction.description}
                            </div>
                          )}
                        </TD>
                        <TD>
                          <span style={{ background:scoreBg(v.accuracy_score), color:scoreColor(v.accuracy_score), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                            {fmt(v.accuracy_score)}%
                          </span>
                        </TD>
                        <TD>
                          {v.pronunciation_score != null && v.pronunciation_score > 0
                            ? <span style={{ background:scoreBg(v.pronunciation_score), color:scoreColor(v.pronunciation_score), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>{fmt(v.pronunciation_score)}%</span>
                            : <span style={{ color:'#9CA3AF', fontSize:12 }}>—</span>}
                        </TD>
                        <TD style={{ fontSize:12 }}>
                          {v.speech_rate != null && v.speech_rate > 0
                            ? <span style={{ fontWeight:600, color:'#374151' }}>{parseFloat(v.speech_rate).toFixed(1)}</span>
                            : '—'}
                        </TD>
                        <TD style={{ fontSize:12, fontWeight:600 }}>{v.total_words ?? '—'}</TD>
                        <TD style={{ fontSize:12 }}>
                          <span style={{ color: (v.incorrect_words||0) > 0 ? '#EF4444' : '#22C55E', fontWeight:600 }}>
                            {v.incorrect_words ?? '—'}
                          </span>
                        </TD>
                        <TD style={{ fontSize:12 }}>{v.duration != null ? `${(v.duration/60).toFixed(1)} min` : '—'}</TD>
                        <TD style={{ fontSize:12 }}>
                          {v.pause_duration != null && v.pause_duration > 0
                            ? `${Math.round(v.pause_duration)} ms`
                            : '—'}
                        </TD>
                        <TD style={{ fontSize:12 }}>{v.speaker_clicks ?? '—'}</TD>
                        <TD style={{ fontSize:12 }}>{v.word_clicks ?? '—'}</TD>
                        <TD style={{ minWidth:180 }}>
                          <NoteCell sessionId={v.id} type="voice" existingNote={v.guardian_note} onSave={saveVoiceNote} readOnly={isParent} />
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </div>

              {recommendations.length > 0 && (
                <div className="ptd-card">
                  <div className="ptd-card-header"><span className="ptd-card-title">💡 AI Recommendations</span></div>
                  {recommendations.map((r,i) => <RecCard key={i} text={r} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── BEHAVIORAL INSIGHTS TAB ──────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <div>
          {/* Gauge row */}
          <div className="ptd-card" style={{ marginBottom:20 }}>
            <div className="ptd-card-header"><span className="ptd-card-title">🧠 Behavioral Profile</span></div>
            {insights ? (
              <>
                <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:12, padding:'8px 0' }}>
                  <Gauge value={insights.attention_score   ?? 0} label="Attention"   color="#22C55E" />
                  <Gauge value={insights.impulsivity_score ?? 0} label="Impulsivity" color="#F59E0B" />
                  <Gauge value={insights.consistency_score ?? 0} label="Consistency" color="#14B8A6" />
                  <Gauge value={Math.round(sessions.length ? sessions.reduce((s,x)=>s+(parseFloat(x.accuracy)||0),0)/sessions.length : 0)} label="Avg Accuracy" color="#6366F1" />
                </div>
                {insights.best_time_of_day && (
                  <div style={{ background:'#F0FDF4', borderRadius:10, padding:'14px 18px', marginTop:16, display:'flex', alignItems:'center', gap:10 }}>
                    <Clock size={18} style={{ color:'#22C55E', flexShrink:0 }} />
                    <span style={{ fontSize:14, color:'#374151' }}>
                      Best performance time: <strong style={{ color:'#0F3D3A' }}>{insights.best_time_of_day}</strong> — schedule sessions then for optimal focus.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <Empty icon="🧠" text="No behavioral insights yet. At least 5 completed sessions are needed." />
            )}
          </div>

          {/* Performance trend chart */}
          {sessions.length > 0 && (
            <div className="ptd-card" style={{ marginBottom:20 }}>
              <div className="ptd-card-header"><span className="ptd-card-title">📈 Score & Accuracy Trend (Last 30 Days)</span></div>
              <div style={{ width:'100%', height:220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={buildPerformanceTrend()} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <defs>
                      <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={.3}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/></linearGradient>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#137a76" stopOpacity={.3}/><stop offset="95%" stopColor="#137a76" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false}/>
                    <XAxis dataKey="day" tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false} domain={[0,100]}/>
                    <Tooltip contentStyle={{background:'#1B1D3E',border:'none',borderRadius:10,color:'#fff',fontSize:12}} formatter={v=>v!=null?`${v}%`:'—'}/>
                    <Area type="monotone" dataKey="score"    stroke="#7C3AED" strokeWidth={2.5} fill="url(#gs)" dot={false} connectNulls name="Score"/>
                    <Area type="monotone" dataKey="accuracy" stroke="#137a76" strokeWidth={2.5} fill="url(#ga)" dot={false} connectNulls name="Accuracy"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sessions by hour */}
          {buildSessionsByHour().length > 0 && (
            <div className="ptd-card" style={{ marginBottom:20 }}>
              <div className="ptd-card-header"><span className="ptd-card-title">⏰ Sessions by Time of Day</span></div>
              <div style={{ width:'100%', height:200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={buildSessionsByHour()} margin={{top:5,right:20,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false}/>
                    <XAxis dataKey="hour" tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'#1B1D3E',border:'none',borderRadius:10,color:'#fff',fontSize:12}}/>
                    <Bar dataKey="sessions" fill="#137a76" radius={[6,6,0,0]} barSize={28} name="Sessions"/>
                    <Bar dataKey="avgScore" fill="#7C3AED" radius={[6,6,0,0]} barSize={28} name="Avg Score"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Game breakdown */}
          {buildGameBreakdown().length > 0 && (
            <div className="ptd-card" style={{ marginBottom:20 }}>
              <div className="ptd-card-header"><span className="ptd-card-title">🎮 Performance by Game</span></div>
              <div style={{ width:'100%', height:220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={buildGameBreakdown()} margin={{top:5,right:20,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'#1B1D3E',border:'none',borderRadius:10,color:'#fff',fontSize:12}}/>
                    <Bar dataKey="avgScore"    fill="#22C55E" radius={[6,6,0,0]} barSize={18} name="Avg Score"/>
                    <Bar dataKey="avgAccuracy" fill="#3B82F6" radius={[6,6,0,0]} barSize={18} name="Avg Accuracy"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Voice accuracy trend */}
          {buildVoiceAccuracyTrend().length > 0 && (
            <div className="ptd-card" style={{ marginBottom:20 }}>
              <div className="ptd-card-header"><span className="ptd-card-title">🎙️ Voice Accuracy Trend</span></div>
              <div style={{ width:'100%', height:200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={buildVoiceAccuracyTrend()} margin={{top:5,right:20,left:0,bottom:5}}>
                    <defs>
                      <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false}/>
                    <XAxis dataKey="day" tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#8B8FA3',fontSize:11}} axisLine={false} tickLine={false} domain={[0,100]}/>
                    <Tooltip contentStyle={{background:'#1B1D3E',border:'none',borderRadius:10,color:'#fff',fontSize:12}} formatter={v=>`${v}%`}/>
                    <Area type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gv)" dot={false} name="Voice Accuracy"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="ptd-card">
              <div className="ptd-card-header"><span className="ptd-card-title">💡 AI Recommendations</span></div>
              {recommendations.map((r,i) => <RecCard key={i} text={r} />)}
            </div>
          )}
        </div>
      )}

      {/* ── ANOMALIES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'anomalies' && (
        <div>
          {anomalies.length === 0 ? (
            <div className="ptd-card">
              <Empty icon="✅" text="No anomalies detected for this patient. Performance is within normal range." />
            </div>
          ) : (
            <div className="ptd-card">
              <div className="ptd-card-header">
                <span className="ptd-card-title">⚠️ Flagged Sessions ({anomalies.length})</span>
              </div>
              <p style={{ fontSize:13, color:'#8B8FA3', padding:'0 0 16px' }}>
                Sessions flagged by one or more clinical signals: statistical outlier (Z-score &gt; 2σ from personal baseline), absolute low score (&lt;40%), accuracy–score mismatch, response time spike, high inactivity, or sudden drop from the previous session.
              </p>
              <TableWrap>
                <thead>
                  <tr>
                    <TH>Severity</TH>
                    <TH>Date</TH>
                    <TH>Score</TH>
                    <TH>Accuracy</TH>
                    <TH>Signals</TH>
                    <TH>Reason(s)</TH>
                    <TH>Session ID</TH>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a,i) => (
                    <tr key={a.session_id||i} style={{ background: i%2===0?'white':'#FAFAFA' }}>
                      <TD>
                        <span style={{
                          background: a.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                          color:      a.severity === 'critical' ? '#991B1B' : '#92400E',
                          borderRadius: 20, padding:'2px 10px', fontSize:11, fontWeight:700, whiteSpace:'nowrap'
                        }}>
                          {a.severity === 'critical' ? '🔴 Critical' : '🟡 Warning'}
                        </span>
                      </TD>
                      <TD style={{ fontWeight:600, whiteSpace:'nowrap' }}>{fmtDate(a.played_at)}</TD>
                      <TD>
                        <span style={{ background:scoreBg(a.score), color:scoreColor(a.score), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                          {fmt(a.score)}%
                        </span>
                      </TD>
                      <TD>
                        {a.accuracy != null
                          ? <span style={{ background:scoreBg(a.accuracy), color:scoreColor(a.accuracy), borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>{fmt(a.accuracy)}%</span>
                          : <span style={{ color:'#9CA3AF' }}>—</span>}
                      </TD>
                      <TD style={{ textAlign:'center' }}>
                        <span style={{ background:'#EEF2FF', color:'#4338CA', borderRadius:20, padding:'2px 9px', fontSize:12, fontWeight:700 }}>
                          {a.signals_count || 1}
                        </span>
                      </TD>
                      <TD style={{ fontSize:12, color:'#374151', maxWidth:420, lineHeight:1.6 }}>
                        {a.reason
                          ? a.reason.split(' · ').map((r, idx) => (
                              <div key={idx} style={{ marginBottom: idx < a.reason.split(' · ').length - 1 ? 8 : 0 }}>
                                <span style={{ color:'#EF4444', fontWeight:600, marginRight:4 }}>→</span>{r}
                              </div>
                            ))
                          : '—'}
                      </TD>
                      <TD style={{ fontSize:11, color:'#8B8FA3' }}>#{a.session_id || '—'}</TD>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          )}
        </div>
      )}

      {/* ── EXPORT & REPORT TAB ──────────────────────────────────────────── */}
      {activeTab === 'export' && (
        <div>
          {exportMsg && (
            <div style={{ background:'#D1FAE5', color:'#065F46', padding:'12px 16px', borderRadius:8, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={16}/> {exportMsg}
            </div>
          )}

          {/* Clinical notes */}
          <div className="ptd-card" style={{ marginBottom:20 }}>
            <div className="ptd-card-header"><span className="ptd-card-title">📝 Therapist Clinical Notes</span></div>
            <p style={{ fontSize:13, color:'#8B8FA3', marginBottom:12 }}>These notes will be included in both PDF and CSV exports.</p>
            <textarea value={therapistNotes} onChange={e => setTherapistNotes(e.target.value)}
              placeholder="Add your clinical observations, treatment notes, progress summary, and recommendations for this patient..."
              style={{ width:'100%', minHeight:140, padding:'12px 14px', borderRadius:10, border:'1px solid #d0d5dd', fontSize:13, resize:'vertical', fontFamily:'inherit', outline:'none', lineHeight:1.6, color:'#0F3D3A' }}/>
          </div>

          {/* PDF */}
          <div className="ptd-card" style={{ marginBottom:20 }}>
            <div className="ptd-card-header"><span className="ptd-card-title">📄 Clinical PDF Report</span></div>
            <p style={{ fontSize:13, color:'#8B8FA3', marginBottom:16 }}>
              Generates a comprehensive clinical report for <strong>{childName}</strong> including all game sessions, voice sessions, behavioral insights, anomalies, AI recommendations, and your clinical notes.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:18, padding:'14px', background:'#F8FAFC', borderRadius:10, border:'1px solid #E8EAF0' }}>
              <div><div style={{ fontSize:13, fontWeight:700, color:'#0F3D3A' }}>{sessions.length}</div><div style={{ fontSize:11, color:'#8B8FA3' }}>Game sessions</div></div>
              <div><div style={{ fontSize:13, fontWeight:700, color:'#0F3D3A' }}>{voice.length}</div><div style={{ fontSize:11, color:'#8B8FA3' }}>Voice attempts</div></div>
              <div><div style={{ fontSize:13, fontWeight:700, color:'#0F3D3A' }}>{anomalies.length}</div><div style={{ fontSize:11, color:'#8B8FA3' }}>Anomalies</div></div>
              <div><div style={{ fontSize:13, fontWeight:700, color:'#0F3D3A' }}>{recommendations.length}</div><div style={{ fontSize:11, color:'#8B8FA3' }}>Recommendations</div></div>
            </div>
            <button className="ptd-btn ptd-btn-primary" onClick={generatePDF} disabled={genPdf} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <FileText size={15}/> {genPdf ? 'Generating…' : 'Generate PDF Report'}
            </button>
          </div>

          {/* CSV */}
          <div className="ptd-card">
            <div className="ptd-card-header"><span className="ptd-card-title">📊 Export Raw Data (CSV)</span></div>
            <p style={{ fontSize:13, color:'#8B8FA3', marginBottom:16 }}>
              Exports all session data, voice attempts, behavioral insights, and anomalies for <strong>{childName}</strong> as a spreadsheet.
            </p>
            <button className="ptd-btn ptd-btn-outline" onClick={exportCSV} disabled={genCsv} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Download size={15}/> {genCsv ? 'Exporting…' : 'Export Raw Data (CSV)'}
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default ChildDetail;