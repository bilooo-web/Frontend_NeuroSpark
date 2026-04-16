import React from 'react';
import { Gamepad2, Mic } from 'lucide-react';

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">Recent Activity</span>
        </div>
        <div className="ptd-empty-state">No recent activity</div>
      </div>
    );
  }

  // Format the activity description — always show child name prominently
  const formatDesc = (activity) => {
    if (activity.type === 'game') {
      return activity.game_name
        ? `Played "${activity.game_name}"`
        : (activity.description || 'Played a game');
    }
    return activity.exercise
      ? `Read "${activity.exercise}"`
      : (activity.description || 'Voice attempt');
  };

  const formatScore = (activity) => {
    const s = activity.score ?? activity.accuracy ?? null;
    if (s == null) return null;
    return `${Math.round(parseFloat(s))}%`;
  };

  const formatTime = (activity) => {
    const t = activity.timestamp || activity.time;
    if (!t) return '';
    try {
      const d = new Date(t);
      if (isNaN(d)) return t; // already formatted string
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1)   return 'Just now';
      if (diffMins < 60)  return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24)   return `${diffHrs}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return t; }
  };

  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">Recent Activity</span>
      </div>
      {activities.map((activity, i) => {
        const score = formatScore(activity);
        const name  = activity.child_name || activity.child?.name || '';
        return (
          <div key={activity.id || i} className="ptd-activity-item">
            <div className={`ptd-activity-icon ${activity.type === 'game' ? 'game' : 'voice'}`}>
              {activity.type === 'game' ? <Gamepad2 size={18} /> : <Mic size={18} />}
            </div>
            <div className="ptd-activity-content">
              <div className="ptd-activity-desc" style={{ fontWeight: 600 }}>
                {name && <span style={{ color: '#0F3D3A' }}>{name}</span>}
                {name && ' — '}
                {formatDesc(activity)}
              </div>
              <div className="ptd-activity-meta">{formatTime(activity)}</div>
            </div>
            {score && (
              <span className="ptd-activity-score" style={{
                background: parseFloat(score) >= 70 ? '#D1FAE5' : parseFloat(score) >= 40 ? '#FEF3C7' : '#FEE2E2',
                color:      parseFloat(score) >= 70 ? '#065F46' : parseFloat(score) >= 40 ? '#92400E' : '#991B1B',
                borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700
              }}>
                {score}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivity;