import React from 'react';

const AnomalyList = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="ptd-card">
        <div className="ptd-card-header">
          <span className="ptd-card-title">Anomalies</span>
          <button className="ptd-card-action">View all</button>
        </div>
        <div className="ptd-empty-state">No anomalies detected</div>
      </div>
    );
  }

  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">Anomalies</span>
        <button className="ptd-card-action">View all</button>
      </div>
      {anomalies.map((anomaly) => (
        <div key={anomaly.id} className="ptd-anomaly-item">
          <span className={`ptd-anomaly-severity ${anomaly.severity}`} />
          <div className="ptd-anomaly-content">
            <div className="ptd-anomaly-reason">{anomaly.reason}</div>
            <div className="ptd-anomaly-meta">{anomaly.child_name} · {anomaly.date}</div>
          </div>
          <button className="ptd-anomaly-action">Review</button>
        </div>
      ))}
    </div>
  );
};

export default AnomalyList;