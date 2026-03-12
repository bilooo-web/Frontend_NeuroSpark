import React from 'react';

const AnomalyList = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="nt-card">
        <div className="nt-card-header">
          <span className="nt-card-title">Anomalies</span>
          <button className="nt-card-action">View all</button>
        </div>
        <div className="nt-empty-state">No anomalies detected</div>
      </div>
    );
  }

  return (
    <div className="nt-card">
      <div className="nt-card-header">
        <span className="nt-card-title">Anomalies</span>
        <button className="nt-card-action">View all</button>
      </div>
      {anomalies.map((anomaly) => (
        <div key={anomaly.id} className="nt-anomaly-item">
          <span className={`nt-anomaly-severity ${anomaly.severity}`} />
          <div className="nt-anomaly-content">
            <div className="nt-anomaly-reason">{anomaly.reason}</div>
            <div className="nt-anomaly-meta">{anomaly.child_name} · {anomaly.date}</div>
          </div>
          <button className="nt-anomaly-action">Review</button>
        </div>
      ))}
    </div>
  );
};

export default AnomalyList;