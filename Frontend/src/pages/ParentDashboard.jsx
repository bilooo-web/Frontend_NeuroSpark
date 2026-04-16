import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import { useApp } from '../context/AppContext';
import { Users, Coins, Gamepad2, Mic, Star, UserPlus, TrendingUp, Award, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import guardianService from '../services/guardianService';

// ─── Motivational messages based on performance ──────────────────────────────
const getMotivation = (perf) => {
  if (perf >= 85) return { emoji: '🏆', msg: 'Outstanding! Keep up this amazing streak!', color: '#22c55e', bg: '#f0fdf4' };
  if (perf >= 70) return { emoji: '⭐', msg: "Great progress! You're doing wonderfully!", color: '#f59e0b', bg: '#fffbeb' };
  if (perf >= 50) return { emoji: '💪', msg: 'Good effort! Every session counts!', color: '#3b82f6', bg: '#eff6ff' };
  return { emoji: '🌱', msg: "Keep going! Growth takes time and patience.", color: '#8b5cf6', bg: '#f5f3ff' };
};

const getMilestone = (coins, games, voice) => {
  if (coins >= 500) return { label: '🥇 Gold Achiever', color: '#f59e0b' };
  if (coins >= 200) return { label: '🥈 Silver Star', color: '#6b7280' };
  if (games >= 20)  return { label: '🎮 Game Champion', color: '#3b82f6' };
  if (voice >= 10)  return { label: '🎤 Voice Hero', color: '#8b5cf6' };
  if (coins >= 50)  return { label: '🌟 Rising Star', color: '#ec4899' };
  return { label: '🚀 Just Started', color: '#22c55e' };
};

// ─── Child Progress Card ──────────────────────────────────────────────────────
const ChildProgressCard = ({ child, onViewDetail }) => {
  const perf = Math.round(child.recent_performance || 0);
  const mot = getMotivation(perf);
  const milestone = getMilestone(child.total_coins || 0, child.games_played || 0, child.voice_attempts || 0);
  const name = child.name || child.user?.full_name || 'Child';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const barColor = perf >= 75 ? '#22c55e' : perf >= 50 ? '#f59e0b' : '#3b82f6';

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: 24,
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
    >
      {/* Decorative top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, borderRadius: '20px 20px 0 0' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${barColor}22, ${barColor}44)`,
          border: `2px solid ${barColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, color: barColor,
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{name}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${milestone.color}18`, color: milestone.color,
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginTop: 2,
          }}>{milestone.label}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: barColor }}>{perf}%</div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Performance</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Overall Progress</span>
          <span style={{ fontSize: 11, color: barColor, fontWeight: 700 }}>{perf >= 70 ? '🔥 On Fire!' : perf >= 50 ? '📈 Growing' : '💡 Building'}</span>
        </div>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${perf}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            borderRadius: 99, transition: 'width 1s ease',
          }} />
        </div>
      </div>

      {/* Motivational message */}
      <div style={{
        background: mot.bg, borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <span style={{ fontSize: 20 }}>{mot.emoji}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: mot.color }}>{mot.msg}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '🎮', label: 'Games', val: child.games_played || 0 },
          { icon: '🎤', label: 'Voice', val: child.voice_attempts || 0 },
          { icon: '🪙', label: 'Coins', val: child.total_coins || 0 },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#f9fafb', borderRadius: 10, padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>{stat.val}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Last active */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {child.last_activity && child.last_activity !== 'No recent activity'
            ? `🕐 Active ${child.last_activity}`
            : '⏸ No recent activity'}
        </span>
        <button
          onClick={() => onViewDetail(child.id)}
          style={{
            background: '#f0fdf4', color: '#16a34a', border: 'none',
            borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

// ─── Celebration Banner ───────────────────────────────────────────────────────
const CelebrationBanner = ({ children }) => {
  const topKid = [...children].sort((a, b) => (b.recent_performance || 0) - (a.recent_performance || 0))[0];
  if (!topKid || !topKid.recent_performance) return null;
  const perf = Math.round(topKid.recent_performance);
  if (perf < 70) return null;
  const name = topKid.name || topKid.user?.full_name || 'Your child';
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef9c3, #fef3c7, #fde68a)',
      border: '1px solid #fbbf24',
      borderRadius: 16, padding: '16px 24px',
      display: 'flex', alignItems: 'center', gap: 14,
      marginBottom: 24, boxShadow: '0 2px 12px rgba(251,191,36,0.2)',
    }}>
      <span style={{ fontSize: 36 }}>🎉</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>
          {name} is crushing it this week!
        </div>
        <div style={{ fontSize: 13, color: '#b45309', marginTop: 2 }}>
          Reached <strong>{perf}% performance</strong> — keep cheering them on! 🙌
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ParentDashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    children: [],
    activities: [],
    stats: { totalChildren: 0, totalGamesPlayed: 0, totalVoiceAttempts: 0, totalCoins: 0 }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardRes = await guardianService.getDashboardOverview();
        const dashboardData = dashboardRes.data || {};
        const childrenData = dashboardData.children || [];
        const totalCoins = childrenData.reduce((sum, c) => sum + (c.total_coins || 0), 0);
        setData({
          children: childrenData,
          activities: dashboardData.recent_activities || [],
          stats: {
            totalChildren: dashboardData.total_children || 0,
            totalGamesPlayed: dashboardData.total_games_played || 0,
            totalVoiceAttempts: dashboardData.total_voice_attempts || 0,
            totalCoins,
          }
        });
      } catch (err) {
        console.error('Failed to load parent dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFeedbackSubmit = async () => {
    if (rating === 0) { setFeedbackError('Please select a rating'); return; }
    if (!feedback.trim()) { setFeedbackError('Please enter your feedback'); return; }
    setSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess(null);
    try {
      const response = await guardianService.submitFeedback({ text: feedback, rating });
      if (response.success) {
        setFeedbackSuccess(response.feedback.sentiment);
        setRating(0);
        setFeedback('');
        setTimeout(() => setFeedbackSuccess(null), 5000);
      }
    } catch (err) {
      setFeedbackError(err.data?.message || err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="ptd-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hasChildren = data.children.length > 0;
  const avgPerf = hasChildren
    ? Math.round(data.children.reduce((s, c) => s + (c.recent_performance || 0), 0) / data.children.length)
    : 0;

  return (
    <DashboardLayout>

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="ptd-doctor-welcome" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 52 }}>
          {avgPerf >= 75 ? '🥳' : avgPerf >= 50 ? '😊' : '👋'}
        </div>
        <div className="ptd-doctor-content">
          <div className="ptd-doctor-title">
            Welcome back, {firstName}!{avgPerf >= 75 ? ' Your kids are thriving 🎉' : ''}
          </div>
          <div className="ptd-doctor-text">
            {hasChildren
              ? `Tracking ${data.stats.totalChildren} ${data.stats.totalChildren === 1 ? 'child' : 'children'} · ${data.stats.totalGamesPlayed} games played · ${data.stats.totalVoiceAttempts} voice sessions`
              : "You haven't linked any children yet. Get started below!"}
          </div>
        </div>
        <button
          className="ptd-btn ptd-btn-primary"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          onClick={() => navigate('/guardian/therapists')}
        >
          <UserPlus size={16} /> Find a Therapist
        </button>
      </div>

      {/* ── Celebration ─────────────────────────────────────────────────────── */}
      {hasChildren && <CelebrationBanner children={data.children} />}

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      {hasChildren && (
        <div className="ptd-stats-grid" style={{ marginBottom: 24 }}>
          <StatsCard title="Children Linked"   value={data.stats.totalChildren}      icon={<Users />}    iconColor="green" />
          <StatsCard title="Games Played"       value={data.stats.totalGamesPlayed}   icon={<Gamepad2 />} iconColor="teal" />
          <StatsCard title="Voice Sessions"     value={data.stats.totalVoiceAttempts} icon={<Mic />}      iconColor="blue" />
          <StatsCard title="Total Coins Earned" value={data.stats.totalCoins}         icon={<Star />}     iconColor="yellow" />
        </div>
      )}

      {/* ── No-children CTA ─────────────────────────────────────────────────── */}
      {!hasChildren && (
        <div className="ptd-card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👶</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, color: 'var(--ptd-text-primary)' }}>
            Link your first child
          </div>
          <p style={{ color: 'var(--ptd-text-secondary)', maxWidth: 380, margin: '0 auto 24px' }}>
            Connect your child's account to start tracking their learning journey and celebrate every milestone together!
          </p>
          <button className="ptd-btn ptd-btn-primary" onClick={() => navigate('/guardian/children')}>
            + Link a Child
          </button>
        </div>
      )}

      {/* ── Children Progress Grid ───────────────────────────────────────────── */}
      {hasChildren && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--ptd-text-primary)', margin: 0 }}>
              🌟 Your Children's Progress
            </h2>
            <button
              className="ptd-card-action"
              onClick={() => navigate('/guardian/children')}
            >
              View All Children →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
            marginBottom: 28,
          }}>
            {data.children.map(child => (
              <ChildProgressCard
                key={child.id}
                child={child}
                onViewDetail={id => navigate(`/guardian/children/${id}`)}
              />
            ))}
          </div>

          {/* ── Find a Therapist CTA Card ──────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f3d3a, #1a5c57)',
            borderRadius: 20, padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 24,
            marginBottom: 28, color: 'white',
            boxShadow: '0 4px 20px rgba(15,61,58,0.25)',
          }}>
            <div style={{ fontSize: 52, flexShrink: 0 }}>🩺</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
                Connect with a Therapist
              </div>
              <div style={{ opacity: 0.8, fontSize: 14, lineHeight: 1.5 }}>
                Browse our verified speech therapists and send an invite directly. Once they accept, they'll monitor your child's progress and provide expert guidance.
              </div>
            </div>
            <button
              onClick={() => navigate('/guardian/therapists')}
              style={{
                background: 'white', color: '#0f3d3a', border: 'none',
                borderRadius: 12, padding: '14px 24px', fontWeight: 800,
                fontSize: 14, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <UserPlus size={16} /> Browse Therapists
            </button>
          </div>

          {/* ── Recent Activity ────────────────────────────────────────────────── */}
          {data.activities.length > 0 && (
            <div className="ptd-card" style={{ marginBottom: 24 }}>
              <div className="ptd-card-header">
                <span className="ptd-card-title">📋 Recent Activity</span>
              </div>
              {data.activities.slice(0, 6).map((activity, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0',
                  borderBottom: idx < Math.min(data.activities.length, 6) - 1
                    ? '1px solid var(--ptd-border)' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: activity.type === 'game' ? '#e8f5e9' : '#e3f2fd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>
                    {activity.type === 'game' ? '🎮' : '🎤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ptd-text-primary)' }}>
                      {activity.child_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ptd-text-secondary)', marginTop: 1 }}>
                      {activity.type === 'game'
                        ? `Played ${activity.game_name} · Score ${activity.score ?? '—'}`
                        : `Voice exercise · ${activity.accuracy ?? '—'}% accuracy`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ptd-text-secondary)', whiteSpace: 'nowrap' }}>
                    {activity.time
                      ? new Date(activity.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Feedback Section ────────────────────────────────────────────────── */}
      {feedbackSuccess && (
        <div style={{
          backgroundColor: '#4caf50', color: 'white',
          padding: '12px 20px', borderRadius: 8, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>😊</span>
          <div><strong>Thank you for your feedback!</strong></div>
        </div>
      )}
      {feedbackError && (
        <div style={{
          backgroundColor: '#ffebee', color: '#c62828',
          padding: '12px 20px', borderRadius: 8, marginBottom: 16,
          borderLeft: '4px solid #c62828',
        }}>❌ {feedbackError}</div>
      )}

      <div className="ptd-feedback-card">
        <div className="ptd-feedback-header">📝 Share Your Feedback</div>
        <div className="ptd-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`ptd-star ${star <= rating ? 'filled' : 'empty'}`}
              onClick={() => setRating(star)}
              disabled={submitting}
            >
              <Star />
            </button>
          ))}
          {rating > 0 && (
            <span style={{ fontSize: 13, color: 'var(--ptd-text-secondary)', marginLeft: 8, alignSelf: 'center' }}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </span>
          )}
        </div>
        <div className="ptd-feedback-row">
          <textarea
            className="ptd-textarea"
            placeholder="How has your child been doing? Share your thoughts..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            style={{ minHeight: 60 }}
            disabled={submitting}
          />
          <button
            className="ptd-feedback-submit"
            onClick={handleFeedbackSubmit}
            disabled={submitting}
          >
            {submitting ? 'Analyzing...' : 'Submit'}
          </button>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default ParentDashboard;