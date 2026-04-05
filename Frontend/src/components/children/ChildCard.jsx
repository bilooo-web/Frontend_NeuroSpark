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
  // Child name can come from either:
  // 1. Nested structure: child.user?.full_name (from /guardian/children endpoint)
  // 2. Flattened structure: child.name (from /guardian/dashboard endpoint)
  const name = child.user?.full_name || child.name || 'Unknown';

  // Calculate accurate age (checking if birthday has passed this year)
  // The age field can come from multiple sources:
  // 1. age (direct from /guardian/dashboard endpoint)
  // 2. date_of_birth (from /guardian/children endpoint)
  // 3. born_at (alternative date field)
  // 4. birth_date (alternative date field)
  // 5. age_group or age_range (fallback text)
  const age = (() => {
    // If age is directly provided as a number, use it
    if (child.age && typeof child.age === 'number') {
      return Math.max(0, child.age);
    }

    // If age is provided as a string (e.g., "8-10"), return it as-is
    if (child.age && typeof child.age === 'string') {
      return child.age;
    }

    // If age_group is provided
    if (child.age_group) {
      return child.age_group;
    }

    // Try to calculate from date fields
    const dateField = child.date_of_birth || child.born_at || child.birth_date;
    if (!dateField) return 'N/A'; // Changed from '?' to 'N/A'

    try {
      const birthDate = new Date(dateField);
      if (isNaN(birthDate.getTime())) return 'N/A'; // Invalid date

      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // If birthday hasn't occurred yet this year, subtract 1
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      return Math.max(0, calculatedAge); // Never negative
    } catch (e) {
      return 'N/A';
    }
  })();
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