import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import {
  Users, Gamepad2, Mic, Star, UserPlus, TrendingUp,
  TrendingDown, Minus, ChevronRight, Award, Clock,
  Target, Activity, AlertCircle, CheckCircle, Zap,
  Heart, Brain, Eye, Sparkles, ArrowRight, Calendar,
  BarChart3, Bell, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import guardianService from '../services/guardianService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt    = v  => v != null ? Math.round(parseFloat(v)) : 0;
const fmtPct = v  => `${fmt(v)}%`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return '—'; } };
const fmtTime = d => { try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

const scoreColor  = v => v >= 70 ? '#059669' : v >= 45 ? '#d97706' : '#dc2626';
const scoreBg     = v => v >= 70 ? '#ecfdf5' : v >= 45 ? '#fffbeb' : '#fef2f2';
const scoreBorder = v => v >= 70 ? '#a7f3d0' : v >= 45 ? '#fde68a' : '#fecaca';

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
const Sparkline = ({ scores = [], color = '#059669', height = 32, width = 100 }) => {
  if (scores.length < 2) return <div style={{ width, height }} />;
  const pts   = scores.slice(-10).reverse();
  const max   = Math.max(...pts, 1);
  const min   = Math.min(...pts, 0);
  const range = max - min || 1;
  const points = pts.map((v, i) => [
    (i / (pts.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2,
  ]);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fillD = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3.5" fill={color} />
    </svg>
  );
};

// ─── Ring progress ────────────────────────────────────────────────────────────
const RingProgress = ({ value = 0, size = 72, stroke = 7, color = '#059669', label }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 800, color, lineHeight: 1 }}>{pct}</span>
        {label && <span style={{ fontSize: size * 0.13, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>{label}</span>}
      </div>
    </div>
  );
};

// ─── Child card ───────────────────────────────────────────────────────────────
const ChildCard = ({ child, onViewDetail, index = 0 }) => {
  const name      = child.name || child.user?.full_name || 'Child';
  const initials  = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const perf      = fmt(child.recent_performance || 0);
  const games     = child.games_played || child.game_sessions_count || 0;
  const voice     = child.voice_attempts || child.voice_attempts_count || 0;
  const coins     = child.total_coins || 0;
  const attention = fmt(child.attention_score || 0);
  const lastActive = child.last_activity || child.last_active || null;
  const isActive  = lastActive && lastActive !== 'No recent activity';
  const sessions  = child.sessions || [];
  const trend     = getTrend(sessions);
  const scores    = sessions.map(s => parseFloat(s.score) || 0);
  const color     = scoreColor(perf);
  const bg        = scoreBg(perf);
  const border    = scoreBorder(perf);

  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#94a3b8';
  const trendLabel = trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable';

  const statusLabel = perf >= 70 ? 'On Track' : perf >= 45 ? 'Progressing' : 'Needs Support';

  // Subtle avatar palette
  const avatarPalettes = [
    { bg: '#e0f2fe', border: '#0ea5e9', text: '#0369a1' },
    { bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
    { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  ];
  const palette = avatarPalettes[index % avatarPalettes.length];

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      border: `1px solid ${border}`,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
      }}
    >
      {/* Top accent */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />

      <div style={{ padding: '20px 22px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
            background: palette.bg, border: `2px solid ${palette.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 700, fontSize: 17, color: palette.text,
            letterSpacing: '0.02em',
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 700, fontSize: 15, color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{name}</div>
            <div style={{ fontSize: 11.5, color: isActive ? '#059669' : '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#059669' : '#cbd5e1', flexShrink: 0 }} />
              {isActive ? `Active ${lastActive}` : 'No recent activity'}
            </div>
          </div>

          <RingProgress value={perf} size={60} stroke={6} color={color} label="%" />
        </div>

        {/* Status pill + trend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{
            background: bg, color, border: `1px solid ${border}`,
            borderRadius: 99, padding: '4px 12px', fontSize: 11.5, fontWeight: 700,
            letterSpacing: '0.02em',
          }}>{statusLabel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: trendColor, fontWeight: 600 }}>
            <TrendIcon size={13} />
            {trendLabel}
          </div>
        </div>

        {/* Sparkline area */}
        {scores.length >= 2 ? (
          <div style={{
            background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Score Trend
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color }}>{fmtPct(scores[0])}</span>
            </div>
            <Sparkline scores={scores} color={color} height={28} width={200} />
          </div>
        ) : (
          <div style={{
            background: '#f8fafc', borderRadius: 12, padding: '14px', marginBottom: 18,
            textAlign: 'center', color: '#94a3b8', fontSize: 12,
          }}>
            No sessions yet — waiting for first play
          </div>
        )}

        {/* Stat chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
          {[
            { emoji: '🎮', label: 'Games', val: games },
            { emoji: '🎤', label: 'Voice', val: voice },
            { emoji: '🧠', label: 'Focus', val: `${attention}%` },
            { emoji: '🪙', label: 'Coins', val: coins },
          ].map(s => (
            <div key={s.label} style={{
              background: '#f8fafc', borderRadius: 10, padding: '9px 4px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, marginBottom: 3 }}>{s.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{s.val}</div>
              <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Last session */}
        {sessions[0] && (
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Gamepad2 size={13} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>
                  {sessions[0].game?.name || 'Last Session'}
                </div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>
                  {fmtDate(sessions[0].played_at)} · {fmtTime(sessions[0].played_at)}
                </div>
              </div>
            </div>
            <span style={{
              background: scoreBg(sessions[0].score), color: scoreColor(sessions[0].score),
              borderRadius: 99, padding: '3px 9px', fontSize: 11.5, fontWeight: 700,
            }}>{fmtPct(sessions[0].score)}</span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <button
        onClick={() => onViewDetail(child.id)}
        style={{
          width: '100%', padding: '13px 20px',
          background: bg, border: 'none', borderTop: `1px solid ${border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, fontSize: 12.5, fontWeight: 700,
          color, transition: 'background 0.15s', letterSpacing: '0.02em',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
        onMouseLeave={e => e.currentTarget.style.background = bg}
      >
        View Full Progress <ChevronRight size={14} />
      </button>
    </div>
  );
};

// ─── Summary stat card ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg, note }) => (
  <div style={{
    background: 'white', borderRadius: 16, padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, fontFamily: "'DM Serif Display', Georgia, serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4 }}>
        {label}
      </div>
      {note && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 500 }}>{note}</div>}
    </div>
  </div>
);

// ─── Activity feed ────────────────────────────────────────────────────────────
const ActivityFeed = ({ activities }) => {
  if (!activities.length) return null;
  return (
    <div style={{
      background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 16, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#94a3b8" /> Recent Activity
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, background: '#f8fafc', borderRadius: 99, padding: '3px 10px' }}>Last 3 days</span>
      </div>

      <div style={{ padding: '8px 0' }}>
        {activities.slice(0, 8).map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 22px',
            borderBottom: i < Math.min(activities.length, 8) - 1 ? '1px solid #f8fafc' : 'none',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: a.type === 'game' ? '#eff6ff' : '#fdf4ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {a.type === 'game' ? '🎮' : '🎤'}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{a.child_name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {a.type === 'game'
                  ? `Played ${a.game_name || 'a game'}`
                  : 'Completed a voice exercise'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
              {(a.score != null || a.accuracy != null) && (
                <span style={{
                  background: scoreBg(a.score ?? a.accuracy),
                  color: scoreColor(a.score ?? a.accuracy),
                  borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontWeight: 700,
                }}>{fmtPct(a.score ?? a.accuracy)}</span>
              )}
              <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{a.time ? fmtDate(a.time) : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Moments to Watch (reframed anomalies) ────────────────────────────────────
const MomentsToWatch = ({ children, onFindTherapist }) => {
  const flagged = children.filter(c => (c.recent_performance || 0) < 45 || !c.games_played);
  if (!flagged.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff7ed, #fef2f2)',
      border: '1px solid #fed7aa',
      borderLeft: '4px solid #f97316',
      borderRadius: 16,
      padding: '18px 22px',
      marginBottom: 28,
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: '#fed7aa',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Eye size={18} color="#ea580c" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 15, color: '#9a3412', marginBottom: 6 }}>
          Moments to Watch
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {flagged.map(c => (
            <div key={c.id} style={{ fontSize: 13, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
              <strong>{c.name || c.user?.full_name}</strong>
              {!c.games_played
                ? ' — no sessions recorded yet, consider getting them started'
                : ` — performance is lower than usual (${fmt(c.recent_performance)}%)`}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#ea580c', marginTop: 10 }}>
          A specialist can provide personalized guidance. You can invite one from the therapist directory.
        </div>
      </div>
      <button
        onClick={onFindTherapist}
        style={{
          background: '#f97316', color: 'white', border: 'none',
          borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          transition: 'background 0.15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#ea580c'}
        onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
      >
        Find Therapist
      </button>
    </div>
  );
};

// ─── Weekly digest card ───────────────────────────────────────────────────────
const WeeklyDigest = ({ children }) => {
  if (!children.length) return null;

  const totalSessions = children.reduce((s, c) => s + (c.games_played || 0), 0);
  const totalVoice    = children.reduce((s, c) => s + (c.voice_attempts || 0), 0);
  const totalCoins    = children.reduce((s, c) => s + (c.total_coins || 0), 0);
  const avgPerf       = children.length
    ? Math.round(children.reduce((s, c) => s + (c.recent_performance || 0), 0) / children.length)
    : 0;

  // Find best performer
  const best = [...children].sort((a, b) => (b.recent_performance || 0) - (a.recent_performance || 0))[0];
  const bestName = best?.name || best?.user?.full_name;

  return (
    <div style={{
      background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
      padding: '22px 24px', marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 17, color: '#0f172a' }}>
            Progress Snapshot
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>All children · all time</div>
        </div>
        <div style={{
          background: avgPerf >= 70 ? '#ecfdf5' : avgPerf >= 45 ? '#fffbeb' : '#fef2f2',
          color: scoreColor(avgPerf), borderRadius: 99, padding: '5px 14px',
          fontSize: 13, fontWeight: 800,
        }}>
          {fmtPct(avgPerf)} avg
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { label: 'Game Sessions', value: totalSessions, icon: <Gamepad2 size={16} />, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Voice Sessions', value: totalVoice, icon: <Mic size={16} />, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Coins Earned', value: totalCoins, icon: <Award size={16} />, color: '#d97706', bg: '#fffbeb' },
          { label: 'Children', value: children.length, icon: <Users size={16} />, color: '#059669', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#f8fafc', borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {bestName && children.length > 1 && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid #a7f3d0',
        }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <div style={{ fontSize: 13, color: '#065f46' }}>
            <strong>{bestName}</strong> is leading with {fmtPct(best?.recent_performance || 0)} performance this period
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Therapist connection widget ──────────────────────────────────────────────
const TherapistCTA = ({ onNavigate }) => (
  <div style={{
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
    borderRadius: 20, padding: '24px 28px', marginBottom: 28,
    display: 'flex', alignItems: 'center', gap: 20, color: 'white',
    boxShadow: '0 8px 32px rgba(15,23,42,0.18)', flexWrap: 'wrap',
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
      background: 'rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28,
    }}>🩺</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
        Connect with a Specialist
      </div>
      <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.6 }}>
        Browse verified speech therapists. Once they accept your invite, they'll monitor your child's progress and provide expert guidance tailored to their needs.
      </div>
    </div>
    <button
      onClick={onNavigate}
      style={{
        background: 'white', color: '#0f172a', border: 'none',
        borderRadius: 12, padding: '12px 22px', fontWeight: 800,
        fontSize: 13, cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <UserPlus size={14} /> Browse Therapists
    </button>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

// ─── Progress Charts ──────────────────────────────────────────────────────────
const ProgressCharts = ({ children }) => {
  const [selected, setSelected] = useState(children[0]?.id || null);

  const child = children.find(c => c.id === selected) || children[0];
  if (!child) return null;

  const sessions = child.sessions || [];
  const voice    = child.voice_attempts_detail || [];

  // Build daily score trend
  const scoreMap = {};
  sessions.forEach(s => {
    try {
      const k = new Date(s.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!scoreMap[k]) scoreMap[k] = { scores: [], accuracies: [] };
      if (s.score    != null) scoreMap[k].scores.push(parseFloat(s.score));
      if (s.accuracy != null) scoreMap[k].accuracies.push(parseFloat(s.accuracy));
    } catch {}
  });
  const scoreTrend = Object.entries(scoreMap).slice(-14).map(([day, v]) => ({
    day,
    Score:    v.scores.length    ? Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length)    : null,
    Accuracy: v.accuracies.length ? Math.round(v.accuracies.reduce((a,b)=>a+b,0)/v.accuracies.length) : null,
  }));

  // Build voice accuracy trend
  const voiceMap = {};
  voice.forEach(v => {
    try {
      const k = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!voiceMap[k]) voiceMap[k] = [];
      if (v.accuracy_score != null) voiceMap[k].push(parseFloat(v.accuracy_score));
    } catch {}
  });
  const voiceTrend = Object.entries(voiceMap).slice(-14).map(([day, arr]) => ({
    day,
    'Voice Accuracy': arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null,
  }));

  const perf     = fmt(child.recent_performance || 0);
  const color    = scoreColor(perf);
  const hasScore = scoreTrend.length >= 2;
  const hasVoice = voiceTrend.length >= 1;

  const tooltipStyle = {
    background: '#0f172a', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 12, padding: '8px 12px',
  };

  return (
    <div style={{
      background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
      padding: '24px', marginBottom: 28,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header + child selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 17, color: '#0f172a' }}>
            Progress & Performance
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Last 14 days of activity</div>
        </div>
        {children.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {children.map(c => {
              const n = c.name || c.user?.full_name || 'Child';
              const active = c.id === selected;
              const cp = fmt(c.recent_performance || 0);
              return (
                <button key={c.id} onClick={() => setSelected(c.id)} style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${active ? scoreColor(cp) : '#e2e8f0'}`,
                  background: active ? scoreBg(cp) : 'white',
                  color: active ? scoreColor(cp) : '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}>{n.split(' ')[0]}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Performance', val: `${perf}%`, color },
          { label: 'Game Sessions', val: child.games_played || 0, color: '#3b82f6' },
          { label: 'Voice Sessions', val: child.voice_attempts || 0, color: '#8b5cf6' },
          { label: 'Focus Score', val: `${fmt(child.attention_score || 0)}%`, color: '#f59e0b' },
          { label: 'Coins', val: child.total_coins || 0, color: '#d97706' },
        ].map(k => (
          <div key={k.label} style={{
            background: '#f8fafc', borderRadius: 12, padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Score + Accuracy trend */}
      {hasScore ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
            Score & Accuracy Trend
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={scoreTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pdScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="pdAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle} formatter={v => v != null ? `${v}%` : '—'}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>
              <Area type="monotone" dataKey="Score"    stroke="#059669" strokeWidth={2.5} fill="url(#pdScore)" dot={false} connectNulls/>
              <Area type="monotone" dataKey="Accuracy" stroke="#3b82f6" strokeWidth={2.5} fill="url(#pdAcc)"   dot={false} connectNulls/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
          📊 Not enough game sessions yet to show a trend — check back after a few more plays!
        </div>
      )}

      {/* Voice accuracy trend */}
      {hasVoice && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
            Voice Accuracy Trend
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={voiceTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tooltipStyle} formatter={v => v != null ? `${v}%` : '—'}/>
              <Bar dataKey="Voice Accuracy" fill="#8b5cf6" radius={[6,6,0,0]} barSize={22}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const ParentDashboard = () => {
  const { user } = useApp();
  const navigate  = useNavigate();

  const [rating,          setRating]          = useState(0);
  const [feedback,        setFeedback]        = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError,   setFeedbackError]   = useState('');
  const [isLoading,       setIsLoading]       = useState(true);

  const [data, setData] = useState({
    children: [], activities: [],
    stats: { totalChildren: 0, totalGamesPlayed: 0, totalVoiceAttempts: 0, totalCoins: 0 }
  });

  useEffect(() => {
    const load = async () => {
      try {
        try {
          const res = await api.get('/guardian/dashboard/full');
          const children = res.children || res.data?.children || [];
          setData({
            children,
            activities: res.recent_activities || res.data?.recent_activities || [],
            stats: {
              totalChildren:      res.total_children   || children.length,
              totalGamesPlayed:   children.reduce((s, c) => s + (c.games_played || 0), 0),
              totalVoiceAttempts: children.reduce((s, c) => s + (c.voice_attempts || 0), 0),
              totalCoins:         children.reduce((s, c) => s + (c.total_coins || 0), 0),
            }
          });
          return;
        } catch { /* fallback */ }

        const dashRes  = await guardianService.getDashboardOverview();
        const dashData = dashRes.data || {};
        const kids     = dashData.children || [];
        setData({
          children:   kids,
          activities: dashData.recent_activities || [],
          stats: {
            totalChildren:      dashData.total_children || 0,
            totalGamesPlayed:   dashData.total_games_played || 0,
            totalVoiceAttempts: dashData.total_voice_attempts || 0,
            totalCoins:         kids.reduce((s, c) => s + (c.total_coins || 0), 0),
          }
        });
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!rating)          { setFeedbackError('Please select a rating'); return; }
    if (!feedback.trim()) { setFeedbackError('Please write your feedback'); return; }
    setFeedbackError(''); setFeedbackSuccess(null);
    const savedText = feedback; const savedRating = rating;
    setFeedback(''); setRating(0); setFeedbackSuccess('sending');
    try {
      const r = await guardianService.submitFeedback({ text: savedText, rating: savedRating });
      if (r.success) {
        const s = r.feedback?.sentiment;
        setFeedbackSuccess(typeof s === 'object' ? s?.result : s);
        setTimeout(() => setFeedbackSuccess(null), 4000);
      } else {
        setFeedbackError('Submission failed.');
        setFeedbackSuccess(null);
        setFeedback(savedText);
        setRating(savedRating);
      }
    } catch (err) {
      setFeedbackError(err.data?.message || 'Failed to submit');
      setFeedbackSuccess(null);
      setFeedback(savedText);
      setRating(savedRating);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) return (
    <DashboardLayout>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '100px 20px', gap: 18,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #f1f5f9', borderTopColor: '#059669',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading your dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardLayout>
  );

  const firstName   = user?.full_name?.split(' ')[0] || 'there';
  const hasChildren = data.children.length > 0;
  const avgPerf     = hasChildren
    ? Math.round(data.children.reduce((s, c) => s + (c.recent_performance || 0), 0) / data.children.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const sentimentEmoji  = s => s === 'positive' ? '😊' : s === 'negative' ? '😞' : s === 'neutral' ? '😐' : '';
  const sentimentColor  = s => s === 'positive' ? '#059669' : s === 'negative' ? '#dc2626' : s === 'neutral' ? '#d97706' : '#6b7280';

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pd-page { padding: 28px 28px 48px; max-width: 1280px; font-family: 'DM Sans', system-ui, sans-serif; }
        @media (max-width: 768px) { .pd-page { padding: 18px; } }
      `}</style>

      <div className="pd-page">

        {/* ── Hero welcome header ───────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #065f46 100%)',
          borderRadius: 22, padding: '30px 36px',
          marginBottom: 28, color: 'white',
          boxShadow: '0 8px 32px rgba(6,95,70,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
          animation: 'fadeSlideUp 0.5s ease both',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative orb */}
          <div style={{
            position: 'absolute', right: -40, top: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: 80, bottom: -60,
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none',
          }} />

          <div>
            <div style={{ fontSize: 12.5, opacity: 0.6, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {greeting}
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.2,
            }}>
              {hasChildren && avgPerf >= 70
                ? `${firstName}, your children are thriving! 🎉`
                : `Welcome back, ${firstName}`}
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.7, lineHeight: 1.6 }}>
              {hasChildren
                ? `${data.children.length} ${data.children.length === 1 ? 'child' : 'children'} linked · ${data.stats.totalGamesPlayed} games played · ${data.stats.totalVoiceAttempts} voice sessions`
                : 'Link your first child to start tracking their learning journey.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/guardian/children')}
              style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, padding: '10px 18px', fontWeight: 600,
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              <Users size={14} /> My Children
            </button>
            <button
              onClick={() => navigate('/guardian/therapists')}
              style={{
                background: 'rgba(255,255,255,0.9)', color: '#0f172a',
                border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'white'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            >
              <UserPlus size={14} /> Find a Therapist
            </button>
          </div>
        </div>

        {/* ── No children empty state ───────────────────────────────────── */}
        {!hasChildren && (
          <div style={{
            background: 'white', borderRadius: 20, border: '2px dashed #d1fae5',
            padding: '64px 24px', textAlign: 'center', marginBottom: 28,
            animation: 'fadeSlideUp 0.5s ease 0.1s both',
          }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>👶</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 22, color: '#0f172a', marginBottom: 10 }}>
              Link your first child
            </div>
            <p style={{ color: '#64748b', maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.7, fontSize: 14 }}>
              Connect your child's account to start tracking their learning journey, celebrate milestones, and monitor their progress in real time.
            </p>
            <button
              onClick={() => navigate('/guardian/children')}
              style={{
                background: '#059669', color: 'white', border: 'none', borderRadius: 12,
                padding: '13px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#047857'}
              onMouseLeave={e => e.currentTarget.style.background = '#059669'}
            >
              <UserPlus size={15} /> Link a Child
            </button>
          </div>
        )}

        {hasChildren && (
          <>
            {/* ── Moments to Watch ─────────────────────────────────────── */}
            <div style={{ animation: 'fadeSlideUp 0.5s ease 0.1s both' }}>
              <MomentsToWatch
                children={data.children}
                onFindTherapist={() => navigate('/guardian/therapists')}
              />
            </div>

            {/* ── Weekly digest / snapshot ─────────────────────────────── */}
            <div style={{ animation: 'fadeSlideUp 0.5s ease 0.15s both' }}>
              <WeeklyDigest children={data.children} />

              {/* ── Progress Charts ──────────────────────────────────── */}
              {data.children.some(c => (c.sessions || []).length >= 2 || (c.voice_attempts_detail || []).length >= 1) && (
                <div style={{ animation: 'fadeSlideUp 0.5s ease 0.2s both' }}>
                  <ProgressCharts children={data.children} />
                </div>
              )}

            </div>

            {/* ── Children's Progress ──────────────────────────────────── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 18, animation: 'fadeSlideUp 0.5s ease 0.2s both',
            }}>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 20, color: '#0f172a' }}>
                  Children's Progress
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  {data.children.length} {data.children.length === 1 ? 'child' : 'children'} linked to your account
                </div>
              </div>
              <button
                onClick={() => navigate('/guardian/children')}
                style={{
                  background: 'none', border: 'none', color: '#059669',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 20, marginBottom: 32,
              animation: 'fadeSlideUp 0.5s ease 0.25s both',
            }}>
              {data.children.map((child, i) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  index={i}
                  onViewDetail={id => navigate(`/guardian/children/${id}`)}
                />
              ))}
            </div>

            {/* ── Activity feed ────────────────────────────────────────── */}
            {data.activities.length > 0 && (
              <div style={{ marginBottom: 28, animation: 'fadeSlideUp 0.5s ease 0.3s both' }}>
                <ActivityFeed activities={data.activities} />
              </div>
            )}

            {/* ── Therapist CTA ────────────────────────────────────────── */}
            <div style={{ animation: 'fadeSlideUp 0.5s ease 0.35s both' }}>
              <TherapistCTA onNavigate={() => navigate('/guardian/therapists')} />
            </div>
          </>
        )}

        {/* ── Feedback ─────────────────────────────────────────────────── */}
        {feedbackSuccess && feedbackSuccess !== 'sending' && (
          <div style={{
            backgroundColor: sentimentColor(feedbackSuccess), color: 'white',
            padding: '12px 20px', borderRadius: 12, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>{sentimentEmoji(feedbackSuccess)}</span>
            <strong>Thank you for your feedback!</strong>
          </div>
        )}
        {feedbackSuccess === 'sending' && (
          <div style={{ background: '#f0fdf4', color: '#065f46', padding: '12px 20px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #a7f3d0', borderTopColor: '#059669', animation: 'spin 0.7s linear infinite' }} />
            Feedback submitted — analysing sentiment…
          </div>
        )}
        {feedbackError && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 20px', borderRadius: 12, marginBottom: 16, borderLeft: '4px solid #fca5a5' }}>
            ❌ {feedbackError}
          </div>
        )}

        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
          padding: '24px 26px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          animation: 'fadeSlideUp 0.5s ease 0.4s both',
        }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 16 }}>
            📝 Share Your Feedback
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button"
                onClick={() => setRating(star)}
                disabled={submitting}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  fontSize: 24, lineHeight: 1, transition: 'transform 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ filter: star <= rating ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
              </button>
            ))}
            {rating > 0 && (
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <textarea
              placeholder="How has your child been doing? Share your thoughts..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={submitting}
              style={{
                flex: 1, minWidth: 200, minHeight: 72, padding: '12px 16px',
                borderRadius: 12, border: '1px solid #e2e8f0', resize: 'vertical',
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
                background: '#f8fafc', color: '#0f172a',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#059669'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting}
              style={{
                alignSelf: 'flex-end', background: '#059669', color: 'white',
                border: 'none', borderRadius: 12, padding: '12px 24px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = '#047857')}
              onMouseLeave={e => e.currentTarget.style.background = '#059669'}
            >
              {feedbackSuccess === 'sending' ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;