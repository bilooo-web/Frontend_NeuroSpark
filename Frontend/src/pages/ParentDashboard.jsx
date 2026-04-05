import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import ChildCard from '../components/children/ChildCard';
import { useApp } from '../context/AppContext';
import { Users, Coins, Gamepad2, Mic, Star, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import guardianService from '../services/guardianService';

const ParentDashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  // Feedback state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  // Dashboard data state
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    children: [],
    activities: [],
    stats: {
      totalChildren: 0,
      totalGamesPlayed: 0,
      totalVoiceAttempts: 0,
      totalCoins: 0,
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Backend: GET /guardian/dashboard
        // Returns: { success, data: { total_children, total_games_played, total_voice_attempts,
        //            guardian_type, children: [...], recent_activities: [...] } }
        const dashboardRes = await guardianService.getDashboardOverview();
        const dashboardData = dashboardRes.data || {};
        const childrenData = dashboardData.children || [];

        // Sum up coins across all children
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
      } catch (error) {
        console.error('Failed to load parent dashboard:', error);
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
      // api.js unwraps HTTP body → response IS { success, feedback: { id, text, rating, sentiment: { result, score } } }
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

  const getSentimentMeta = (sentiment) => {
    // sentiment from backend is { result: 'positive'|'neutral'|'negative', score, details }
    // but handle plain string too for safety
    const result = typeof sentiment === 'object' ? sentiment?.result : sentiment;
    const score  = typeof sentiment === 'object' ? sentiment?.score  : null;
    const colors = { positive: '#4caf50', negative: '#f44336', neutral: '#ff9800' };
    const icons  = { positive: '😊', negative: '😞', neutral: '😐' };
    const pct    = score != null ? ` (${(Math.abs(score) * 100).toFixed(1)}% confidence)` : '';
    return {
      color: colors[result] || '#2196f3',
      icon:  icons[result]  || '💬',
      label: result ? `${result.toUpperCase()}${pct}` : '',
    };
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="nt-dashboard-skeleton">
          <div className="nt-skeleton-header" />
          <div className="nt-stats-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="nt-skeleton-card" />)}
          </div>
          <div className="nt-content-grid">
            <div className="nt-skeleton-chart" />
            <div className="nt-skeleton-sidebar" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hasChildren = data.children.length > 0;

  return (
    <DashboardLayout>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="nt-doctor-welcome">
        <div className="nt-doctor-emoji" style={{ fontSize: 48 }}>👋</div>
        <div className="nt-doctor-content">
          <div className="nt-doctor-title">Welcome back, {firstName}!</div>
          <div className="nt-doctor-text">
            {hasChildren
              ? `You have ${data.stats.totalChildren} ${data.stats.totalChildren === 1 ? 'child' : 'children'} linked. Keep track of their progress below.`
              : "You haven't linked any children yet. Get started by linking your first child!"}
          </div>
        </div>
      </div>

      {/* ── Feedback Success Toast ──────────────────────────────────────────── */}
      {feedbackSuccess && (() => {
        const meta = getSentimentMeta(feedbackSuccess);
        return (
          <div style={{
            backgroundColor: meta.color, color: 'white',
            padding: '12px 20px', borderRadius: '8px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>{meta.icon}</span>
            <div>
              <strong>Thank you for your feedback!</strong>
              {meta.label && <div>Sentiment detected: {meta.label}</div>}
            </div>
          </div>
        );
      })()}

      {/* ── Feedback Error ─────────────────────────────────────────────────── */}
      {feedbackError && (
        <div style={{
          backgroundColor: '#ffebee', color: '#c62828',
          padding: '12px 20px', borderRadius: '8px', marginBottom: '20px',
          borderLeft: '4px solid #c62828'
        }}>
          ❌ {feedbackError}
        </div>
      )}

      {/* ── No-children CTA ────────────────────────────────────────────────── */}
      {!hasChildren && (
        <div className="nt-card" style={{
          textAlign: 'center', padding: '40px 20px', marginBottom: '24px'
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>👶</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--nt-text-primary)' }}>
            Link your first child
          </div>
          <p style={{ color: 'var(--nt-text-secondary)', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Connect your child's account to start tracking their learning progress, game performance, and more.
          </p>
          <button
            className="nt-btn nt-btn-primary"
            onClick={() => navigate('/guardian/children')}
          >
            <UserPlus size={16} /> Link a Child
          </button>
        </div>
      )}

      {/* ── Stats Grid (only when children exist) ──────────────────────────── */}
      {hasChildren && (
        <div className="nt-stats-grid">
          <StatsCard
            title="Children"
            value={data.stats.totalChildren}
            icon={<Users />}
            iconColor="green"
          />
          <StatsCard
            title="Games Played"
            value={data.stats.totalGamesPlayed}
            icon={<Gamepad2 />}
            iconColor="blue"
          />
          <StatsCard
            title="Voice Sessions"
            value={data.stats.totalVoiceAttempts}
            icon={<Mic />}
            iconColor="teal"
          />
          <StatsCard
            title="Total Coins Earned"
            value={data.stats.totalCoins}
            icon={<Coins />}
            iconColor="amber"
          />
        </div>
      )}

      {/* ── Main content grid ──────────────────────────────────────────────── */}
      {hasChildren && (
        <div className="nt-content-grid">
          <div className="nt-content-left">
            <div className="nt-card">
              <div className="nt-card-header">
                <span className="nt-card-title">Connect with a Therapist</span>
                <button className="nt-card-action" onClick={() => navigate('/guardian/therapists')}>
                  Find Therapists
                </button>
              </div>
              <div className="nt-empty-state" style={{ textAlign: 'center', padding: '20px' }}>
                <p>Invite a therapist to monitor your child's progress.</p>
              </div>
            </div>

            {/* Children cards */}
            <div className="nt-card">
              <div className="nt-card-header">
                <span className="nt-card-title">Your Children</span>
                <button
                  className="nt-card-action"
                  onClick={() => navigate('/guardian/children')}
                >
                  Manage all
                </button>
              </div>
              <div className="nt-children-grid">
                {data.children.slice(0, 4).map(child => (
                  <ChildCard key={child.id} child={child} showActions={true} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {data.activities.length > 0 && (
              <div className="nt-card">
                <div className="nt-card-header">
                  <span className="nt-card-title">Recent Activity</span>
                </div>
                <div>
                  {data.activities.slice(0, 6).map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 0',
                        borderBottom: idx < Math.min(data.activities.length, 6) - 1
                          ? '1px solid var(--nt-border)' : 'none'
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: activity.type === 'game' ? '#e8f5e9' : '#e3f2fd',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16
                      }}>
                        {activity.type === 'game' ? '🎮' : '🎤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--nt-text-primary)' }}>
                          {activity.child_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--nt-text-secondary)', marginTop: 1 }}>
                          {activity.type === 'game'
                            ? `Played ${activity.game_name} · Score ${activity.score ?? '—'}`
                            : `Voice exercise · ${activity.accuracy ?? '—'}% accuracy`}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--nt-text-secondary)', whiteSpace: 'nowrap' }}>
                        {activity.time
                          ? new Date(activity.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-child performance summary */}
            <div className="nt-card">
              <div className="nt-card-header">
                <span className="nt-card-title">Performance Overview</span>
              </div>
              {data.children.map((child, idx) => {
                const perf = Math.round(child.recent_performance || 0);
                const barColor = perf >= 75 ? '#22c55e' : perf >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={child.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: idx < data.children.length - 1 ? '1px solid var(--nt-border)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        {/* backend sends child.name = child.user.full_name from getDashboardOverview */}
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--nt-text-primary)' }}>
                          {child.name || child.user?.full_name || 'Unknown'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--nt-text-secondary)', marginLeft: 8 }}>
                          {child.last_activity && child.last_activity !== 'No recent activity'
                            ? `Active ${child.last_activity}`
                            : 'No recent activity'}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: barColor }}>
                        {perf}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      height: 6, background: 'var(--nt-border)',
                      borderRadius: 3, overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%', width: `${perf}%`,
                        background: barColor, borderRadius: 3,
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--nt-text-secondary)' }}>
                        🎮 {child.games_played || 0} games
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--nt-text-secondary)' }}>
                        🎤 {child.voice_attempts || 0} voice sessions
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--nt-text-secondary)' }}>
                        🪙 {child.total_coins || 0} coins
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ── Feedback Section (always visible) ─────────────────────────────── */}
      <div className="nt-feedback-card" style={{ marginTop: hasChildren ? 0 : 8 }}>
        <div className="nt-feedback-header">📝 Share Your Feedback</div>
        <div className="nt-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`nt-star ${star <= rating ? 'filled' : 'empty'}`}
              onClick={() => setRating(star)}
              disabled={submitting}
            >
              <Star />
            </button>
          ))}
          {rating > 0 && (
            <span style={{ fontSize: 13, color: 'var(--nt-text-secondary)', marginLeft: 8, alignSelf: 'center' }}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </span>
          )}
        </div>
        <div className="nt-feedback-row">
          <textarea
            className="nt-textarea"
            placeholder="How has your child been doing? Share your thoughts about the platform..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            style={{ minHeight: 60 }}
            disabled={submitting}
          />
          <button
            className="nt-feedback-submit"
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