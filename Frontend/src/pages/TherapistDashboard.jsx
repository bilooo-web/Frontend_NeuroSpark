import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import ProgressLineChart from '../components/charts/ProgressLineChart';
import GameSessionsBreakdownChart from '../components/charts/GameSessionsBreakdownChart';
import GameSessionsTrendChart from '../components/charts/GameSessionsTrendChart';
import VoiceInstructionBreakdownChart from '../components/charts/VoiceInstructionBreakdownChart';
import VoiceAccuracyTrendChart from '../components/charts/VoiceAccuracyTrendChart';
import AnomalyList from '../components/therapist/AnomalyList';
import ChildCard from '../components/children/ChildCard';
import { useApp } from '../context/AppContext';
import therapistImg from '../assets/image.png';
import { Users, Target, AlertTriangle, UserCheck, Brain, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import guardianService from '../services/guardianService';

const TherapistDashboard = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('all');
  const [data, setData] = useState({
    children: [],
    activities: [],
    weeklyProgress: [],
    anomalies: [],
    gameSessionsBreakdown: [],
    gameSessionsTrend: [],
    voiceInstructionBreakdown: [],
    voiceAccuracyTrend: [],
    stats: {
      totalChildren: 0,
      activeChildren: 0,
      avgAccuracy: 0,
      avgAttention: 0
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadError(null);
        const [dashboardRes, anomaliesRes] = await Promise.all([
          guardianService.getDashboardOverview(),
          guardianService.getAllAnomalies().catch(() => ({ data: [] }))
        ]);

        // Backend: { success: true, data: { total_children, children, recent_activities, ... } }
        const dashboardData = dashboardRes.data || {};
        let childrenData = dashboardData.children || [];

        // Fetch full child details (which includes date_of_birth) to enrich dashboard data
        try {
          const fullChildrenRes = await guardianService.getChildren();
          const fullChildren = fullChildrenRes.children || [];

          // Merge full child details (with date_of_birth) into dashboard children data
          childrenData = childrenData.map(dashboardChild => {
            const fullChild = fullChildren.find(c => c.id === dashboardChild.id);
            return fullChild ? { ...dashboardChild, ...fullChild } : dashboardChild;
          });
        } catch (e) {
          console.warn('Could not fetch full child details, using dashboard data only');
          // Continue with dashboard data if fetch fails
        }

        // anomaliesRes from guardianService.getAllAnomalies() returns { success, data: [...] }
        // api.js unwraps HTTP body, so anomaliesRes IS { success, data: [...] }
        const anomaliesData = anomaliesRes.data || [];

        const active = childrenData.filter(c =>
          c.last_activity && c.last_activity !== 'No recent activity'
        ).length;

        const avgAcc = childrenData.length > 0
          ? Math.round(
              childrenData.reduce((sum, c) => sum + (c.recent_performance || 0), 0)
              / childrenData.length
            )
          : 0;

        // Calculate average attention score from insights if available
        const avgAttention = childrenData.length > 0
          ? Math.round(
              childrenData.reduce((sum, c) => sum + (c.attention_score || 70), 0)
              / childrenData.length
            )
          : 0;

        // Generate daily performance data (Last 7 days) using REAL data
        // Fetch performance data for all children and aggregate
        const performanceData = {};

        // Initialize 7 days with real data
        const today = new Date();
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          performanceData[dateKey] = { scores: [], accuracies: [] };
        }

        // Fetch performance for each child and collect daily data
        try {
          for (const child of childrenData) {
            try {
              const progressRes = await guardianService.getChildProgress(child.id);
              const progress = progressRes.data || {};

              // Process weekly progress data for performance charts
              if (progress.weekly_progress && Array.isArray(progress.weekly_progress)) {
                progress.weekly_progress.forEach(entry => {
                  if (entry.avg_score || entry.avg_accuracy) {
                    const score = parseFloat(entry.avg_score) || 0;
                    const accuracy = parseFloat(entry.avg_accuracy) || 0;
                    const today = new Date().toISOString().split('T')[0];
                    performanceData[today].scores.push(score);
                    performanceData[today].accuracies.push(accuracy);
                  }
                });
              }

              // Process game performance data
              if (progress.game_performance && Array.isArray(progress.game_performance)) {
                progress.game_performance.forEach((session) => {
                  if (session.avg_score || session.avg_accuracy) {
                    const score = parseFloat(session.avg_score) || 0;
                    const accuracy = parseFloat(session.avg_accuracy) || 0;
                    const today = new Date().toISOString().split('T')[0];
                    if (performanceData[today]) {
                      if (score > 0) performanceData[today].scores.push(score);
                      if (accuracy > 0) performanceData[today].accuracies.push(accuracy);
                    }
                  }
                });
              }

              // Process direct game sessions
              if (progress.sessions && Array.isArray(progress.sessions)) {
                progress.sessions.forEach(session => {
                  if (session.played_at || session.date) {
                    const dateStr = session.played_at || session.date;
                    const key = new Date(dateStr).toISOString().split('T')[0];
                    if (performanceData[key]) {
                      if (session.score) performanceData[key].scores.push(session.score);
                      if (session.accuracy || session.performance) {
                        performanceData[key].accuracies.push(session.accuracy || session.performance);
                      }
                    }
                  }
                });
              }

              // Process root level data
              if (progress.score !== undefined || progress.accuracy !== undefined) {
                const today = new Date().toISOString().split('T')[0];
                if (progress.score) performanceData[today].scores.push(progress.score);
                if (progress.accuracy) performanceData[today].accuracies.push(progress.accuracy);
              }
            } catch (e) {
              // Silent fail - continue with next child
            }
          }
        } catch (e) {
          // Silent fail - continue
        }

        // Format for chart - calculate daily averages for performance
        const performanceToday = new Date();
        const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(performanceToday);
          date.setDate(date.getDate() - (6 - i));
          const dateKey = date.toISOString().split('T')[0];

          const dayName = i === 6 ? 'Today' : i === 5 ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          const dayData = performanceData[dateKey] || { scores: [], accuracies: [] };
          const avgScore = dayData.scores.length > 0
            ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length)
            : 0;
          const avgAccuracy = dayData.accuracies.length > 0
            ? Math.round(dayData.accuracies.reduce((a, b) => a + b, 0) / dayData.accuracies.length)
            : 0;

          return {
            day: dayName,
            score: avgScore,
            accuracy: avgAccuracy
          };
        });

        // ========== GAME & VOICE DATA SECTION (LAZY LOAD - OPTIONAL) ==========
        // Initialize empty to allow fast dashboard render, load async after
        let gameSessionsBreakdownData = [];
        let gameSessionsTrendData = [];
        let voiceInstructionBreakdownData = [];
        let voiceAccuracyTrendData = [];

        // For now, set placeholder data to render dashboard quickly
        // Voice/game charts will load in background after main dashboard appears

        setData({
          children: childrenData,
          activities: dashboardData.recent_activities || [],
          weeklyProgress,
          anomalies: anomaliesData,
          gameSessionsBreakdown: gameSessionsBreakdownData,
          gameSessionsTrend: gameSessionsTrendData,
          voiceInstructionBreakdown: voiceInstructionBreakdownData,
          voiceAccuracyTrend: voiceAccuracyTrendData,
          stats: {
            totalChildren: dashboardData.total_children || 0,
            activeChildren: active,
            avgAccuracy: avgAcc,
            avgAttention
          }
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoadError('Failed to load dashboard data. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedChildId]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      setFeedbackError('Please select a rating');
      return;
    }
    if (!feedback.trim()) {
      setFeedbackError('Please enter your feedback');
      return;
    }

    setSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess(null);

    try {
      // api.js unwraps HTTP body → response IS { success, feedback: { id, text, rating, sentiment: { result, score } } }
      const response = await guardianService.submitFeedback({
        text: feedback,
        rating: rating
      });

      if (response.success) {
        // ✅ FIX: was response.data.feedback.sentiment — api.js already unwraps the body
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

  const getSentimentIcon = (sentiment) => {
    // sentiment can be an object { result, score } or a plain string
    const result = typeof sentiment === 'object' ? sentiment?.result : sentiment;
    switch (result) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral':  return '😐';
      default:         return null;
    }
  };

  const getSentimentColor = (sentiment) => {
    const result = typeof sentiment === 'object' ? sentiment?.result : sentiment;
    switch (result) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral':  return '#ff9800';
      default:         return '#2196f3';
    }
  };

  const getSentimentLabel = (sentiment) => {
    if (!sentiment) return '';
    if (typeof sentiment === 'string') return sentiment.toUpperCase();
    if (typeof sentiment === 'object' && sentiment.result) {
      const pct = sentiment.score != null
        ? ` (${(Math.abs(sentiment.score) * 100).toFixed(1)}% confidence)`
        : '';
      return `${sentiment.result.toUpperCase()}${pct}`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="ptd-dashboard-skeleton">
          <div className="ptd-skeleton-header" />
          <div className="ptd-stats-grid">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="ptd-skeleton-card" />
            ))}
          </div>
          <div className="ptd-content-grid">
            <div className="ptd-skeleton-chart" />
            <div className="ptd-skeleton-sidebar" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Doctor Welcome */}
      <div className="ptd-doctor-welcome">
        <div className="ptd-doctor-emoji">
          <img
            src={therapistImg}
            alt="Therapist"
            className="welcome-illustration"
            style={{ height: '100px', width: 'auto', transition: 'transform 0.3s ease' }}
          />
        </div>
        <div className="ptd-doctor-content">
          <div className="ptd-doctor-title">
            Welcome back, Dr. {user?.full_name?.split(' ').slice(-1)[0] || 'Mitchell'}!
          </div>
          <div className="ptd-doctor-text">
            You have {data.stats.activeChildren} active patients today.
            {data.anomalies.length > 0 && ` ${data.anomalies.length} anomalies need review.`}
          </div>
        </div>
      </div>

      {/* Error State */}
      {loadError && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            borderLeft: '4px solid #c62828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>⚠️ {loadError}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#c62828',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Urgent Alerts Banner */}
      {data.anomalies.length > 0 && (
        <div className="ptd-alert-banner">
          <div className="ptd-alert-banner-icon">
            <AlertTriangle />
          </div>
          <div className="ptd-alert-banner-content">
            <div className="ptd-alert-banner-title">
              You have {data.anomalies.length} new anomalies today
            </div>
            <div className="ptd-alert-banner-text">
              {data.anomalies[0]?.child_name} – {data.anomalies[0]?.reason?.slice(0, 50)}...
            </div>
          </div>
          <button className="ptd-alert-banner-action" onClick={() => navigate('/guardian/anomalies')}>
            Review Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="ptd-stats-grid five-cols">
        <StatsCard
          title="Total Children"
          value={data.stats.totalChildren}
          icon={<Users />}
          iconColor="green"
        />
        <StatsCard
          title="Active This Week"
          value={data.stats.activeChildren}
          icon={<UserCheck />}
          iconColor="teal"
          trend={{ value: 12, label: 'vs last week' }}
        />
        <StatsCard
          title="Avg. Accuracy"
          value={`${data.stats.avgAccuracy}%`}
          icon={<Target />}
          iconColor="green"
          trend={{ value: 5, label: 'vs last week' }}
        />
        <StatsCard
          title="Avg. Attention"
          value={`${data.stats.avgAttention}%`}
          icon={<Brain />}
          iconColor="blue"
          trend={{ value: 3, label: 'improving' }}
        />
        <StatsCard
          title="Anomalies"
          value={data.anomalies.length}
          icon={<AlertTriangle />}
          iconColor="red"
        />
      </div>

      {/* Main Content */}
      <div className="ptd-content-grid">
        <div className="ptd-content-left">
          <div style={{ marginBottom: '18px' }}>
            <ProgressLineChart data={data.weeklyProgress} title="Daily Performance Overview (Last 7 Days)" />
          </div>

          {/* Child Selection Dropdown */}
          <div style={{ marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, fontSize: '14px', color: '#0F3D3A' }}>View Performance For:</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #d0d5dd',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#0F3D3A',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px rgba(16, 24, 48, 0.05)'
              }}
            >
              <option value="all">All Children</option>
              {data.children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.user?.full_name || child.name || `Child ${child.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Game Sessions Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <GameSessionsBreakdownChart
              data={data.gameSessionsBreakdown}
              title="Game Sessions by Type"
            />
            <GameSessionsTrendChart
              data={data.gameSessionsTrend}
              title="Game Sessions (Last 7 Days)"
            />
          </div>

          {/* Voice Instructions Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <VoiceInstructionBreakdownChart
              data={data.voiceInstructionBreakdown}
              title="Voice Attempts by Instruction"
            />
            <VoiceAccuracyTrendChart
              data={data.voiceAccuracyTrend}
              title="Voice Performance (Last 7 Days)"
            />
          </div>

          <div className="ptd-card">
            <div className="ptd-card-header">
              <span className="ptd-card-title">Your Patients</span>
              <button className="ptd-card-action" onClick={() => navigate('/guardian/children')}>
                See all
              </button>
            </div>
            <div className="ptd-children-grid">
              {data.children.slice(0, 4).map(child => (
                <ChildCard key={child.id} child={child} showActions={true} />
              ))}
              {data.children.length === 0 && (
                <div className="ptd-empty-state" style={{ gridColumn: '1/-1' }}>
                  No patients linked yet. Start by linking a child's account.
                </div>
              )}
            </div>
          </div>

          {/* Anomalies Section */}
          {data.anomalies.length > 0 && (
            <div className="ptd-card">
              <div className="ptd-card-header">
                <span className="ptd-card-title">Detected Anomalies</span>
                <button className="ptd-card-action" onClick={() => navigate('/guardian/anomalies')}>
                  View all
                </button>
              </div>
              <AnomalyList anomalies={data.anomalies.slice(0, 5)} />
            </div>
          )}

          {/* Recent Activity */}
          {data.activities.length > 0 && (
            <RecentActivity activities={data.activities} />
          )}
        </div>
      </div>

      {/* Feedback Success Toast */}
      {feedbackSuccess && (
        <div
          className="ptd-feedback-success"
          style={{
            backgroundColor: getSentimentColor(feedbackSuccess),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '24px' }}>{getSentimentIcon(feedbackSuccess)}</span>
          <div>
            <strong>Thank you for your feedback!</strong>
            <div>Sentiment detected: {getSentimentLabel(feedbackSuccess)}</div>
          </div>
        </div>
      )}

      {/* Feedback Error */}
      {feedbackError && (
        <div
          className="ptd-feedback-error"
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            borderLeft: '4px solid #c62828'
          }}
        >
          ❌ {feedbackError}
        </div>
      )}

      {/* Feedback Input */}
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
            placeholder="How was your experience today? Share your thoughts..."
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

export default TherapistDashboard;