import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const VoiceInstructionBreakdownChart = ({ data, title }) => {
  return (
    <div className="ptd-card">
      <div className="ptd-card-header">
        <span className="ptd-card-title">{title}</span>
      </div>
      <div className="ptd-chart-container">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#137a76" />
                  <stop offset="100%" stopColor="#26c6da" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#8B8FA3', fontSize: 11 }} axisLine={false} tickLine={false} />
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
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toFixed(1);
                  }
                  return value;
                }}
              />
              <Bar dataKey="attemptCount" fill="url(#voiceGradient)" radius={[8, 8, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B8FA3', fontSize: '14px' }}>
            No voice data available
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInstructionBreakdownChart;