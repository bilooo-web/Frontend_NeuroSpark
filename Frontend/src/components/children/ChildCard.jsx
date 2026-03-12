import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Gamepad2, Mic, MessageCircle } from 'lucide-react';

const MiniGauge = ({ value, label, color }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="nt-mini-gauge">
      <div className="nt-mini-gauge-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={radius} fill="none" stroke="#D4E8DC" strokeWidth="4" />
          <circle
            cx="26" cy="26" r={radius}
            fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span className="nt-mini-gauge-value">{value}</span>
      </div>
      <span className="nt-mini-gauge-label">{label}</span>
    </div>
  );
};

const ChildCard = ({ child, showActions = true }) => {
  const navigate = useNavigate();
  
  // Safely get values with defaults
  const name = child.user?.full_name || 'Unknown';
  const age = child.date_of_birth 
    ? new Date().getFullYear() - new Date(child.date_of_birth).getFullYear() 
    : '?';
  const lastActive = child.last_active || child.last_activity || 'Recently';
  const coins = child.total_coins || child.coins || 0;
  const gamesPlayed = child.games_played || child.game_sessions_count || 0;
  const voiceAttempts = child.voice_attempts || child.voice_attempts_count || 0;
  const avgScore = child.average_score || child.recent_performance || 0;
  const avgAccuracy = child.average_accuracy || 0;
  
  // Calculate scores for gauges (using available data)
  const attentionScore = child.attention_score || 0;
  const impulsivityScore = child.impulsivity_score || 0;
  const consistencyScore = child.consistency_score || 0;

  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const getGaugeColor = (val) =>
    val >= 75 ? '#22C55E' : val >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="nt-child-card" onClick={() => navigate(`/guardian/children/${child.id}`)}>
      <div className="nt-child-card-header">
        <div className="nt-child-avatar">{initials}</div>
        <div>
          <div className="nt-child-name">{name}</div>
          <div className="nt-child-meta">Age {age} · Active {lastActive}</div>
        </div>
      </div>

      <div className="nt-child-scores">
        <MiniGauge value={attentionScore} label="Attention" color={getGaugeColor(attentionScore)} />
        <MiniGauge value={impulsivityScore} label="Impulse" color={getGaugeColor(100 - impulsivityScore)} />
        <MiniGauge value={consistencyScore} label="Consist." color={getGaugeColor(consistencyScore)} />
      </div>

      <div className="nt-child-stats">
        <div className="nt-child-stat">
          <Coins style={{ color: '#F59E0B' }} /> {coins}
        </div>
        <div className="nt-child-stat">
          <Gamepad2 style={{ color: '#22C55E' }} /> {gamesPlayed}
        </div>
        <div className="nt-child-stat">
          <Mic style={{ color: '#3B82F6' }} /> {voiceAttempts}
        </div>
      </div>

      {showActions && (
        <div className="nt-child-actions">
          <button 
            className="nt-child-action-btn primary" 
            onClick={e => { 
              e.stopPropagation(); 
              navigate(`/guardian/children/${child.id}`); 
            }}
          >
            View Insights
          </button>
          <button 
            className="nt-child-action-btn secondary" 
            onClick={e => { 
              e.stopPropagation(); 
              navigate(`/guardian/children/${child.id}?tab=anomalies`); 
            }}
          >
            <MessageCircle size={14} /> Anomalies
          </button>
        </div>
      )}
    </div>
  );
};

export default ChildCard;