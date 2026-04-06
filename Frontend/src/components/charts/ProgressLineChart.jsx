import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ProgressLineChart = ({ data, title }) => {
  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">{title}</span>
        <button className="ptd-card-action">Last 7 days</button>
      </div>
      <div className="nt-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#8B8FA3', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B8FA3', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
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
            />
            <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} fill="url(#gradientScore)" dot={false} activeDot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} fill="url(#gradientAccuracy)" dot={false} activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressLineChart;