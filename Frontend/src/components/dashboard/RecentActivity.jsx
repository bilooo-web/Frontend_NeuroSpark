import React from 'react';
import { Gamepad2, Mic } from 'lucide-react';

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">Recent Activity</span>
          <button className="ptd-card-action">See all</button>
        </div>
        <div className="ptd-empty-state">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">Recent Activity</span>
        <button className="ptd-card-action">See all</button>
      </div>
      {activities.map((activity) => (
        <div key={activity.id} className="ptd-activity-item">
          <div className={`ptd-activity-icon ${activity.type === 'game' ? 'game' : 'voice'}`}>
            {activity.type === 'game' ? <Gamepad2 size={18} /> : <Mic size={18} />}
          </div>
          <div className="ptd-activity-content">
            <div className="ptd-activity-desc">{activity.description}</div>
            <div className="ptd-activity-meta">{activity.child_name} · {activity.timestamp}</div>
          </div>
          <span className="ptd-activity-score">{activity.score}%</span>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;