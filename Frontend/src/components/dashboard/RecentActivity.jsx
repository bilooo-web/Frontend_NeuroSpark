import React from 'react';
import { Gamepad2, Mic } from 'lucide-react';

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="nt-card">
        <div className="nt-card-header">
          <span className="nt-card-title">Recent Activity</span>
          <button className="nt-card-action">See all</button>
        </div>
        <div className="nt-empty-state">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="nt-card">
      <div className="nt-card-header">
        <span className="nt-card-title">Recent Activity</span>
        <button className="nt-card-action">See all</button>
      </div>
      {activities.map((activity) => (
        <div key={activity.id} className="nt-activity-item">
          <div className={`nt-activity-icon ${activity.type === 'game' ? 'game' : 'voice'}`}>
            {activity.type === 'game' ? <Gamepad2 size={18} /> : <Mic size={18} />}
          </div>
          <div className="nt-activity-content">
            <div className="nt-activity-desc">{activity.description}</div>
            <div className="nt-activity-meta">{activity.child_name} · {activity.timestamp}</div>
          </div>
          <span className="nt-activity-score">{activity.score}%</span>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;