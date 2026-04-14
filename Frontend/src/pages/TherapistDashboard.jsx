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
  const [loadError, setLoadError] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('all');
  const mounted = useRef(true);

  // NO isLoading gate — render immediately with defaults
  const [data, setData] = useState({
    children: [],
    activities: [],
    weeklyProgress: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { day: i === 6 ? 'Today' : i === 5 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), score: 0, accuracy: 0 };
    }),
    anomalies: [],
    gameSessionsBreakdown: [],
    gameSessionsTrend: [],
    voiceInstructionBreakdown: [],
    voiceAccuracyTrend: [],
    stats: { totalChildren: 0, activeChildren: 0, avgAccuracy: 0, avgAttention: 0 }
  });

  useEffect(() => {
    mounted.current = true;
    loadDashboard();
    return () => { mounted.current = false; };
  }, []);

  const loadDashboard = async () => {
    try {
      setLoadError(null);

      // Fire ALL requests in parallel — no waiting
      const [dashboardRes, anomaliesRes, fullChildrenRes] = await Promise.all([
        guardianService.getDashboardOverview(),
        guardianService.getAllAnomalies().catch(() => ({ data: [] })),
        guardianService.getChildren().catch(() => ({ children: [] }))
      ]);

      if (!mounted.current) return;

      const dashboardData = dashboardRes.data || {};
      const fullChildren = fullChildrenRes.children || [];
      const anomaliesData = anomaliesRes.data || [];

      // Merge dashboard children with full children data (for date_of_birth etc)
      let childrenData = (dashboardData.children || []).map(dc => {
        const full = fullChildren.find(c => c.id === dc.id);
        return full ? { ...dc, ...full } : dc;
      });

      const active = childrenData.filter(c => c.last_activity && c.last_activity !== 'No recent activity').length;
      const avgAcc = childrenData.length > 0
        ? Math.round(childrenData.reduce((s, c) => s + (c.recent_performance || 0), 0) / childrenData.length)
        : 0;
      const avgAttention = childrenData.length > 0
        ? Math.round(childrenData.reduce((s, c) => s + (c.attention_score || 70), 0) / childrenData.length)
        : 0;

      // INSTANT render with core data — no child progress fetching blocking this
      setData(prev => ({
        ...prev,
        children: childrenData,
        activities: dashboardData.recent_activities || [],
        anomalies: anomaliesData,
        stats: {
          totalChildren: dashboardData.total_children || 0,
          activeChildren: active,
          avgAccuracy: avgAcc,
          avgAttention
        }
      }));

      // THEN fetch child progress in parallel (background, non-blocking)
      loadChildProgress(childrenData);

    } catch (error) {
      console.error('Dashboard load failed:', error);
      if (mounted.current) setLoadError('Failed to load dashboard data.');
    }
  };

  // Background: fetch all child progress in PARALLEL (not sequential)
  const loadChildProgress = async (childrenData) => {
    if (!childrenData.length) return;

    try {
      const progressResults = await Promise.all(
        childrenData.map(child =>
          guardianService.getChildProgress(child.id).catch(() => ({ data: {} }))
        )
      );

      if (!mounted.current) return;

      const performanceData = {};
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today); d.setDate(d.getDate() - (6 - i));
        performanceData[d.toISOString().split('T')[0]] = { scores: [], accuracies: [] };
      }

      progressResults.forEach(res => {
        const progress = res.data || {};

        if (progress.weekly_progress && Array.isArray(progress.weekly_progress)) {
          progress.weekly_progress.forEach(entry => {
            const todayKey = new Date().toISOString().split('T')[0];
            if (performanceData[todayKey]) {
              if (entry.avg_score) performanceData[todayKey].scores.push(parseFloat(entry.avg_score));
              if (entry.avg_accuracy) performanceData[todayKey].accuracies.push(parseFloat(entry.avg_accuracy));
            }
          });
        }

        if (progress.game_performance && Array.isArray(progress.game_performance)) {
          progress.game_performance.forEach(session => {
            const todayKey = new Date().toISOString().split('T')[0];
            if (performanceData[todayKey]) {
              if (session.avg_score) performanceData[todayKey].scores.push(parseFloat(session.avg_score));
              if (session.avg_accuracy) performanceData[todayKey].accuracies.push(parseFloat(session.avg_accuracy));
            }
          });
        }

        if (progress.sessions && Array.isArray(progress.sessions)) {
          progress.sessions.forEach(session => {
            const dateStr = session.played_at || session.date;
            if (dateStr) {
              const key = new Date(dateStr).toISOString().split('T')[0];
              if (performanceData[key]) {
                if (session.score) performanceData[key].scores.push(session.score);
                if (session.accuracy) performanceData[key].accuracies.push(session.accuracy);
              }
            }
          });
        }
      });

      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().split('T')[0];
        const dayName = i === 6 ? 'Today' : i === 5 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayData = performanceData[key] || { scores: [], accuracies: [] };
        return {
          day: dayName,
          score: dayData.scores.length > 0 ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length) : 0,
          accuracy: dayData.accuracies.length > 0 ? Math.round(dayData.accuracies.reduce((a, b) => a + b, 0) / dayData.accuracies.length) : 0
        };
      });

      if (mounted.current) {
        setData(prev => ({ ...prev, weeklyProgress }));
      }
    } catch (e) {
      // Silent — charts stay at 0
    }
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) { setFeedbackError('Please select a rating'); return; }
    if (!feedback.trim()) { setFeedbackError('Please enter your feedback'); return; }

    setSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess(null);

    try {
      const response = await guardianService.submitFeedback({ text: feedback, rating });
      if (response.success) {
        const sentiment = response.feedback?.sentiment;
        const label = typeof sentiment === 'object' ? sentiment?.result : sentiment;
        setFeedbackSuccess(label);
        setRating(0);
        setFeedback('');
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    } catch (err) {
      setFeedbackError(err.data?.message || err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentIcon = (s) => {
    const r = typeof s === 'object' ? s?.result : s;
    return r === 'positive' ? '😊' : r === 'negative' ? '😞' : r === 'neutral' ? '😐' : '';
  };

  const getSentimentColor = (s) => {
    const r = typeof s === 'object' ? s?.result : s;
    return r === 'positive' ? '#4caf50' : r === 'negative' ? '#f44336' : r === 'neutral' ? '#ff9800' : '#2196f3';
  };

  const getSentimentLabel = (s) => {
    if (!s) return '';
    const r = typeof s === 'object' ? s?.result : s;
    return r ? r.charAt(0).toUpperCase() + r.slice(1) : '';
  };

  // NO loading gate — render immediately
  return (
    <DashboardLayout>
      {/* Doctor Welcome */}
      <div className="ptd-doctor-welcome">
        <div className="ptd-doctor-emoji">
          <img src={therapistImg} alt="Therapist" className="welcome-illustration"
            style={{ height: '100px', width: 'auto', transition: 'transform 0.3s ease' }} />
        </div>
        <div className="ptd-doctor-content">
          <div className="ptd-doctor-title">
            Welcome back, Dr. {user?.full_name?.split(' ').slice(-1)[0] || 'User'}!
          </div>
          <div className="ptd-doctor-text">
            You have {data.stats.activeChildren} active patients today.
            {data.anomalies.length > 0 && ` ${data.anomalies.length} anomalies need review.`}
          </div>
        </div>
      </div>

      {/* Error State */}
      {loadError && (
        <div style={{
          backgroundColor: '#ffebee', color: '#c62828', padding: '16px 20px',
          borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #c62828',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>⚠️ {loadError}</span>
          <button onClick={() => { setLoadError(null); loadDashboard(); }}
            style={{ background: '#c62828', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Urgent Alerts Banner */}
      {data.anomalies.length > 0 && (
        <div className="ptd-alert-banner">
          <div className="ptd-alert-banner-icon"><AlertTriangle /></div>
          <div className="ptd-alert-banner-content">
            <div className="ptd-alert-banner-title">You have {data.anomalies.length} new anomalies today</div>
            <div className="ptd-alert-banner-text">
              {data.anomalies[0]?.child_name} – {data.anomalies[0]?.reason?.slice(0, 50)}...
            </div>
          </div>
          <button className="ptd-alert-banner-action" onClick={() => navigate('/guardian/anomalies')}>Review Now</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="ptd-stats-grid five-cols">
        <StatsCard title="Total Children" value={data.stats.totalChildren} icon={<Users />} iconColor="green" />
        <StatsCard title="Active This Week" value={data.stats.activeChildren} icon={<UserCheck />} iconColor="teal" trend={{ value: 12, label: 'vs last week' }} />
        <StatsCard title="Avg. Accuracy" value={`${data.stats.avgAccuracy}%`} icon={<Target />} iconColor="green" trend={{ value: 5, label: 'vs last week' }} />
        <StatsCard title="Avg. Attention" value={`${data.stats.avgAttention}%`} icon={<Brain />} iconColor="blue" trend={{ value: 3, label: 'improving' }} />
        <StatsCard title="Anomalies" value={data.anomalies.length} icon={<AlertTriangle />} iconColor="red" />
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
            <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', color: '#0F3D3A', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(16, 24, 48, 0.05)' }}>
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
            <GameSessionsBreakdownChart data={data.gameSessionsBreakdown} title="Game Sessions by Type" />
            <GameSessionsTrendChart data={data.gameSessionsTrend} title="Game Sessions (Last 7 Days)" />
          </div>

          {/* Voice Instructions Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <VoiceInstructionBreakdownChart data={data.voiceInstructionBreakdown} title="Voice Attempts by Instruction" />
            <VoiceAccuracyTrendChart data={data.voiceAccuracyTrend} title="Voice Performance (Last 7 Days)" />
          </div>

          <div className="ptd-card">
            <div className="ptd-card-header">
              <span className="ptd-card-title">Your Patients</span>
              <button className="ptd-card-action" onClick={() => navigate('/guardian/children')}>See all</button>
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
                <button className="ptd-card-action" onClick={() => navigate('/guardian/anomalies')}>View all</button>
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
        <div style={{
          backgroundColor: getSentimentColor(feedbackSuccess), color: 'white',
          padding: '12px 20px', borderRadius: '8px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>{getSentimentIcon(feedbackSuccess)}</span>
          <div>
            <strong>Thank you for your feedback!</strong>
            <div>Sentiment: {getSentimentLabel(feedbackSuccess)}</div>
          </div>
        </div>
      )}

      {/* Feedback Error */}
      {feedbackError && (
        <div style={{
          backgroundColor: '#ffebee', color: '#c62828', padding: '12px 20px',
          borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #c62828'
        }}>
          ❌ {feedbackError}
        </div>
      )}

      {/* Feedback Input */}
      <div className="ptd-feedback-card">
        <div className="ptd-feedback-header">📝 Share Your Feedback</div>
        <div className="ptd-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} type="button"
              className={`ptd-star ${star <= rating ? 'filled' : 'empty'}`}
              onClick={() => setRating(star)} disabled={submitting}>
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
          <textarea className="ptd-textarea"
            placeholder="How was your experience today? Share your thoughts..."
            value={feedback} onChange={e => setFeedback(e.target.value)}
            style={{ minHeight: 60 }} disabled={submitting} />
          <button className="ptd-feedback-submit" onClick={handleFeedbackSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TherapistDashboard;