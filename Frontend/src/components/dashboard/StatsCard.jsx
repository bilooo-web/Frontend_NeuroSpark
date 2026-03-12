import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon, iconColor = 'purple', trend }) => {
  return (
    <div className="nt-stat-card">
      <div className={`nt-stat-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="nt-stat-content">
        <div className="nt-stat-label">{title}</div>
        <div className="nt-stat-value">{value}</div>
        {trend && (
          <div className={`nt-stat-trend ${trend.value > 0 ? 'up' : 'down'}`}>
            {trend.value > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;