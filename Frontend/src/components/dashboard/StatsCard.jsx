import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon, iconColor = 'purple', trend }) => {
  return (
    <div className="ptd-stat-card">
      <div className={`ptd-stat-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="ptd-stat-content">
        <div className="ptd-stat-label">{title}</div>
        <div className="ptd-stat-value">{value}</div>
        {trend && (
          <div className={`ptd-stat-trend ${trend.value > 0 ? 'up' : 'down'}`}>
            {trend.value > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;