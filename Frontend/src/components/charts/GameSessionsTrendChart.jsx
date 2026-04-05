import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GameSessionsTrendChart = ({ data, title }) => {
  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">{title}</span>
        <button className="ptd-card-action">Last 7 days</button>
      </div>
      <div className="ptd-chart-container">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#8B8FA3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B8FA3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1B1D3E',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
                labelStyle={{ color: '#8B8FA3' }}
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toFixed(0);
                  }
                  return value;
                }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#7C3AED" strokeWidth={3} fill="url(#gradientSessions)" dot={false} activeDot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B8FA3', fontSize: '14px' }}>
            No session data available
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSessionsTrendChart;