import React from 'react';

const GaugeChart = ({ value, label, color = '#7C3AED', size = 120, interpretation }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="ptd-gauge-wrap">
      <div className="ptd-gauge-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8EAF0" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="ptd-gauge-center">
          <span className="ptd-gauge-value" style={{ fontSize: size * 0.22, color }}>{clampedValue}</span>
        </div>
      </div>
      <span className="ptd-gauge-label">{label}</span>
      {interpretation && <span className="ptd-gauge-interpretation">{interpretation}</span>}
    </div>
  );
};

export default GaugeChart;