import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import ProgressLineChart from '../components/charts/ProgressLineChart';
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
  const [data, setData] = useState({
    children: [],
    activities: [],
    weeklyProgress: [],
    anomalies: [],
    stats: {
      totalChildren: 0,
      activeChildren: 0,
      avgAccuracy: 0,
      avgAttention: 72
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardRes, anomaliesRes] = await Promise.all([
          guardianService.getDashboardOverview(),
          guardianService.getAllAnomalies().catch(() => ({ data: { data: [] } }))
        ]);

        // Backend: { success: true, data: { total_children, children, recent_activities, ... } }
        const dashboardData = dashboardRes.data?.data || {};
        const childrenData = dashboardData.children || [];
        const anomaliesData = anomaliesRes.data?.data || [];

        // Active = children whose last_activity is not "No recent activity"
        const active = childrenData.filter(c =>
          c.last_activity && c.last_activity !== 'No recent activity'
        ).length;

        // Avg accuracy from recent_performance field per child
        const avgAcc = childrenData.length > 0
          ? Math.round(
              childrenData.reduce((sum, c) => sum + (c.recent_performance || 0), 0)
              / childrenData.length
            )
          : 0;

        setData({
          children: childrenData,
          activities: dashboardData.recent_activities || [],
          weeklyProgress: [],
          anomalies: anomaliesData,
          stats: {
            totalChildren: dashboardData.total_children || 0,
            activeChildren: active,
            avgAccuracy: avgAcc,
            avgAttention: 72
          }
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
      const response = await guardianService.submitFeedback({
        text: feedback,
        rating: rating
      });

      if (response.data.success) {
        setFeedbackSuccess(response.data.feedback.sentiment);
        setRating(0);
        setFeedback('');
        setTimeout(() => setFeedbackSuccess(null), 5000);
      }
    } catch (err) {
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.result) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return null;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.result) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': return '#ff9800';
      default: return '#2196f3';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="nt-dashboard-skeleton">
          <div className="nt-skeleton-header" />
          <div className="nt-stats-grid">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="nt-skeleton-card" />
            ))}
          </div>
          <div className="nt-content-grid">
            <div className="nt-skeleton-chart" />
            <div className="nt-skeleton-sidebar" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Doctor Welcome */}
      <div className="nt-doctor-welcome">
        <div className="nt-doctor-emoji">
          <img src={therapistImg} alt="Therapist" className="welcome-illustration" style={{
            height: '100px',
            width: 'auto',
            transition: 'transform 0.3s ease'
          }} />
        </div>
        <div className="nt-doctor-content">
          <div className="nt-doctor-title">
            Welcome back, Dr. {user?.name?.split(' ').slice(-1)[0] || 'Mitchell'}!
          </div>
          <div className="nt-doctor-text">
            You have {data.stats.activeChildren} active patients today.
            {data.anomalies.length > 0 && ` ${data.anomalies.length} anomalies need review.`}
          </div>
        </div>
      </div>

      {/* Success Message with Sentiment */}
      {feedbackSuccess && (
        <div
          className="nt-feedback-success"
          style={{
            backgroundColor: getSentimentColor(feedbackSuccess),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '24px' }}>{getSentimentIcon(feedbackSuccess)}</span>
          <div>
            <strong>Thank you for your feedback!</strong>
            <div>Sentiment detected: {feedbackSuccess.result.toUpperCase()} ({(feedbackSuccess.score * 100).toFixed(1)}% confidence)</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {feedbackError && (
        <div
          className="nt-feedback-error"
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #c62828'
          }}
        >
          ❌ {feedbackError}
        </div>
      )}

      {/* Feedback Input with Stars */}
      <div className="nt-feedback-card">
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
            placeholder="How was your experience today? Share your thoughts..."
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

      {/* Urgent Alerts Banner */}
      {data.anomalies.length > 0 && (
        <div className="nt-alert-banner">
          <div className="nt-alert-banner-icon">
            <AlertTriangle />
          </div>
          <div className="nt-alert-banner-content">
            <div className="nt-alert-banner-title">
              You have {data.anomalies.length} new anomalies today
            </div>
            <div className="nt-alert-banner-text">
              {data.anomalies[0]?.child_name} – {data.anomalies[0]?.reason?.slice(0, 50)}...
            </div>
          </div>
          <button className="nt-alert-banner-action" onClick={() => navigate('/guardian/anomalies')}>
            Review Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="nt-stats-grid five-cols">
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
      <div className="nt-content-grid">
        <div className="nt-content-left">
          <ProgressLineChart data={data.weeklyProgress} title="Weekly Performance Overview" />
          <div className="nt-card">
            <div className="nt-card-header">
              <span className="nt-card-title">Your Patients</span>
              <button className="nt-card-action" onClick={() => navigate('/guardian/children')}>See all</button>
            </div>
            <div className="nt-children-grid">
              {data.children.slice(0, 4).map(child => (
                <ChildCard key={child.id} child={child} showActions={true} />
              ))}
            </div>
          </div>
        </div>

        <div className="nt-content-right">
          <RecentActivity activities={data.activities} />
          <AnomalyList anomalies={data.anomalies} />
          <div className="nt-card">
            <div className="nt-card-header">
              <span className="nt-card-title">Quick Actions</span>
            </div>
            <div className="nt-quick-actions">
              <button className="nt-quick-action-btn" onClick={() => navigate('/guardian/children')}>
                <Users /> View Children
              </button>
              <button className="nt-quick-action-btn" onClick={() => navigate('/guardian/insights')}>
                <Brain /> Clinical Insights
              </button>
              <button className="nt-quick-action-btn" onClick={() => navigate('/guardian/feedback')}>
                <Star /> Feedback History
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TherapistDashboard;