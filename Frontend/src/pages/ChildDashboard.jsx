import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import CharacterSelectionModal from '../components/dashboard/CharacterSelectionModal';
import api from '../services/api';
import './ChildDashboard.css';

// Import characters
import char1 from '../assets/characterone.png';
import char2 from '../assets/charactertwo.png';
import char3 from '../assets/characterthree.png';
import GamesIcon from '../assets/Games.png';
import ReadingIcon from '../assets/Reading.png';
import StreakIcon from '../assets/Streak.png';
import char4 from '../assets/characterfour.png';
import char5 from '../assets/characterfive.png';
import char6 from '../assets/charactersix.png';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
} from 'recharts';

const characterMap = {
  '1': char1,
  '2': char2,
  '3': char3,
  '4': char4,
  '5': char5,
  '6': char6
};

// ─── Game icon mapping by slug/type ───
const gameIconMap = {
  'word-match': '🧩',
  'pronunciation': '🎤',
  'reading-speed': '⚡',
  'memory-cards': '🃏',
  'math-puzzle': '🔢',
  'shape-sorter': '🔺',
  'color-fill': '🎨',
  'animal-sounds': '🐶',
  'letter-trace': '✍️',
  'pattern-match': '🎯',
  'logic-blocks': '🧊',
  'story-builder': '📚',
  'padlocks': '🔐',
  'pair-of-cards': '🃏',
  'faces-and-names': '👤',
};

const gameColorMap = {
  'word-match': '#F59E0B',
  'pronunciation': '#3B82F6',
  'reading-speed': '#10B981',
  'memory-cards': '#8B5CF6',
  'math-puzzle': '#F97316',
  'shape-sorter': '#EC4899',
  'color-fill': '#F59E0B',
  'animal-sounds': '#3B82F6',
  'letter-trace': '#10B981',
  'pattern-match': '#8B5CF6',
  'logic-blocks': '#F97316',
  'story-builder': '#EC4899',
  'padlocks': '#6366F1',
  'pair-of-cards': '#8B5CF6',
  'faces-and-names': '#F59E0B',
};

const defaultColors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899'];

function getGameIcon(game) {
  return gameIconMap[game.game_slug] || gameIconMap[game.type] || '🎮';
}

function getGameColor(game, index) {
  return gameColorMap[game.game_slug] || gameColorMap[game.type] || defaultColors[index % defaultColors.length];
}

// ─── Custom Tooltip ───
const CustomTooltip = ({ active, payload, label, gamesData }) => {
  if (active && payload && payload.length) {
    const game = gamesData.find(g => g.name === label);
    if (!game) return null;

    const improvement = game.lastScore - game.previousScore;
    const isNewBest = game.lastScore >= game.bestScore && game.lastScore > 0;

    return (
      <div className="custom-chart-tooltip premium">
        <div className="tooltip-header">
          <span className="tooltip-icon">{game.icon}</span>
          <p className="tooltip-label">{label}</p>
        </div>
        <div className="tooltip-divider"></div>
        <div className="tooltip-items">
          <div className="tooltip-item">
            <div className="tooltip-item-left">
              <span className="dot best"></span>
              <span className="label">Best Score</span>
            </div>
            <span className="val">{game.bestScore}</span>
          </div>
          <div className="tooltip-item">
            <div className="tooltip-item-left">
              <span className="dot last"></span>
              <span className="label">Last Attempt</span>
            </div>
            <div className="val-group">
              <span className="val">{game.lastScore}</span>
              {improvement !== 0 && (
                <span className={`improvement-tag ${improvement > 0 ? 'up' : 'down'}`}>
                  {improvement > 0 ? '▲' : '▼'} {Math.abs(improvement)}
                </span>
              )}
            </div>
          </div>
        </div>
        {isNewBest && (
          <div className="tooltip-badge">
            ⭐ New High Score!
          </div>
        )}
      </div>
    );
  }
  return null;
};

// ─── Calculate streak from game sessions ───
function calculateStreak(gameSessions, voiceAttempts) {
  // Combine all activity dates
  const activityDates = new Set();

  gameSessions.forEach(s => {
    if (s.played_at) {
      const date = new Date(s.played_at).toISOString().split('T')[0];
      activityDates.add(date);
    }
  });

  voiceAttempts.forEach(a => {
    if (a.created_at) {
      const date = new Date(a.created_at).toISOString().split('T')[0];
      activityDates.add(date);
    }
  });

  if (activityDates.size === 0) return 0;

  // Sort dates descending
  const sorted = Array.from(activityDates).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diffDays = (current - prev) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Calculate weekly day activity ───
function getWeekActivity(gameSessions, voiceAttempts) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const activityDates = new Set();
  gameSessions.forEach(s => {
    if (s.played_at) activityDates.add(new Date(s.played_at).toISOString().split('T')[0]);
  });
  voiceAttempts.forEach(a => {
    if (a.created_at) activityDates.add(new Date(a.created_at).toISOString().split('T')[0]);
  });

  const todayStr = today.toISOString().split('T')[0];

  return days.map((label, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isActive = activityDates.has(dateStr);
    const isPast = date < today && !isToday;

    return {
      label,
      isToday,
      checked: isActive && (isPast || isToday),
      active: isToday,
    };
  });
}


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function ChildDashboard() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
      } catch { /* ignore network errors on logout */ }
    }

    // Clear all auth + cached gameplay state (mirrors Header logout)
    const gameSlugs = ['path-change','padlocks','faces-and-names','pair-of-cards','painting','colored-words',
                       'word-search','cars-on-the-road','handwriting-enhancement','one-line','find-the-ball',
                       'rearranging-blocks','puzzles'];
    ['token','user','totalCoins','selectedCharacterId',
     ...gameSlugs.flatMap(s => [`${s}-last`, `${s}-best`])
    ].forEach(k => localStorage.removeItem(k));

    window.dispatchEvent(new CustomEvent('logout'));
    navigate('/');
  };

  const [userName, setUserName] = useState('Explorer');
  const [selectedCharId, setSelectedCharId] = useState(() => {
    return localStorage.getItem('selectedCharacterId') || '6';
  });
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);

  // ─── API State ───
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [voiceAttempts, setVoiceAttempts] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [stories, setStories] = useState([]);

  // ─── Fetch all dashboard data ───
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.full_name) {
      setUserName(user.full_name.split(' ')[0]);
    }

    async function fetchDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const [profileRes, gameHistoryRes, voiceHistoryRes, gamesRes, storiesRes] = await Promise.allSettled([
          api.get('/child/profile'),
          api.get('/child/history/games'),
          api.get('/child/history/voice'),
          api.get('/child/games'),
          api.get('/child/stories'),
        ]);

        // Profile & stats
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.profile);
          setStats(profileRes.value.stats);
          if (profileRes.value.profile?.user?.full_name) {
            setUserName(profileRes.value.profile.user.full_name.split(' ')[0]);
          }
        }

        // Game history (paginated response)
        if (gameHistoryRes.status === 'fulfilled') {
          const sessions = gameHistoryRes.value.data || gameHistoryRes.value || [];
          setGameSessions(Array.isArray(sessions) ? sessions : []);
        }

        // Voice history (paginated response)
        if (voiceHistoryRes.status === 'fulfilled') {
          const attempts = voiceHistoryRes.value.data || voiceHistoryRes.value || [];
          setVoiceAttempts(Array.isArray(attempts) ? attempts : []);
        }

        // Available games
        if (gamesRes.status === 'fulfilled') {
          const games = Array.isArray(gamesRes.value) ? gamesRes.value : (gamesRes.value.games || []);
          setAvailableGames(games);
        }

        // Stories
        if (storiesRes.status === 'fulfilled') {
          const s = storiesRes.value.stories || storiesRes.value || [];
          setStories(Array.isArray(s) ? s : []);
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // ─── Derived data ───

  // Games performance chart data: build from game sessions grouped by game
  const gamesChartData = useMemo(() => {
    if (!gameSessions.length) return [];

    // Group sessions by game
    const byGame = {};
    gameSessions.forEach(session => {
      const game = session.game;
      if (!game) return;
      const key = game.id;
      if (!byGame[key]) {
        byGame[key] = {
          game,
          sessions: [],
        };
      }
      byGame[key].sessions.push(session);
    });

    return Object.values(byGame).map((entry, index) => {
      const { game, sessions } = entry;
      // Sessions are ordered desc by played_at from the API
      const sorted = [...sessions].sort((a, b) => new Date(b.played_at) - new Date(a.played_at));
      const lastScore = sorted[0]?.score ?? 0;
      const previousScore = sorted[1]?.score ?? 0;
      const bestScore = Math.max(...sorted.map(s => s.score ?? 0));

      return {
        id: game.id,
        name: game.name,
        game_slug: game.game_slug,
        type: game.type,
        icon: getGameIcon(game),
        color: getGameColor(game, index),
        bestScore,
        lastScore,
        previousScore,
        played: true,
      };
    });
  }, [gameSessions]);

  // All games (played + unplayed) for the progress bar
  const allGamesData = useMemo(() => {
    const playedSlugs = new Set(gamesChartData.map(g => g.game_slug));
    const unplayed = availableGames
      .filter(g => !playedSlugs.has(g.game_slug))
      .map((g, i) => ({
        id: g.id,
        name: g.name,
        game_slug: g.game_slug,
        type: g.type,
        icon: getGameIcon(g),
        color: getGameColor(g, gamesChartData.length + i),
        bestScore: 0,
        lastScore: 0,
        previousScore: 0,
        played: false,
      }));
    return [...gamesChartData, ...unplayed];
  }, [gamesChartData, availableGames]);

  // Reading stats from stories + voice attempts
  const readingStats = useMemo(() => {
    const total = stories.length || 0;
    // Stories the child has attempted
    const attemptedStoryIds = new Set(voiceAttempts.map(a => a.voice_instruction_id));
    const completed = attemptedStoryIds.size;
    const inProgress = 0; // Could be refined if you track partial reads
    const unread = Math.max(0, total - completed);

    return { total, completed, inProgress, unread };
  }, [stories, voiceAttempts]);

  // Total hours played (from game durations in seconds)
  const totalHoursPlayed = useMemo(() => {
    const totalSeconds = gameSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return Math.round(totalSeconds / 3600) || 0;
  }, [gameSessions]);

  // Streak
  const streak = useMemo(() => calculateStreak(gameSessions, voiceAttempts), [gameSessions, voiceAttempts]);

  // Week activity
  const weekDays = useMemo(() => getWeekActivity(gameSessions, voiceAttempts), [gameSessions, voiceAttempts]);

  // Speech practice stats from voice attempts
  const speechStats = useMemo(() => {
    if (!voiceAttempts.length) return { lastScore: 0, phonemes: [] };
    const sorted = [...voiceAttempts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastScore = sorted[0]?.accuracy_score ?? 0;

    // Aggregate incorrect words across attempts to find weak phonemes
    // This is a simplified version; real phoneme analysis would come from the backend
    return { lastScore: Math.round(lastScore), phonemes: [] };
  }, [voiceAttempts]);

  // Recommended stories (unread ones)
  const recommendedStories = useMemo(() => {
    const attemptedIds = new Set(voiceAttempts.map(a => a.voice_instruction_id));
    return stories
      .filter(s => !attemptedIds.has(s.id))
      .slice(0, 3);
  }, [stories, voiceAttempts]);

  const handleSelectCharacter = (id) => {
    setSelectedCharId(id);
    localStorage.setItem('selectedCharacterId', id);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="child-dashboard-container">
          <div className="stars-bg" />
          <div className="child-dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              <p style={{color: 'black'}}>Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="child-dashboard-container">
          <div className="stars-bg" />
          <div className="child-dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#E53E3E' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>😕</div>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#6D8DBF', color: '#fff', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const totalCoins = stats?.total_coins ?? profile?.total_coins ?? 0;
  const totalGamesPlayed = stats?.total_games_played ?? gameSessions.length;
  const totalStoriesDone = stats?.total_voice_attempts ?? voiceAttempts.length;

  return (
    <>
      <Header />
      <div className="child-dashboard-container">
        <div className="stars-bg" />
        <div className="child-dashboard-content">

          {/* Floating Logout Button */}
          <button
            type="button"
            className="cd-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Log out"
            aria-label="Log out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>

          {/* Welcome Section */}
          <div className="cd-card cd-welcome">
            <div className="cd-welcome-left">
              <div 
                className="cd-welcome-char-wrapper"
                onClick={() => setIsCharModalOpen(true)}
                title="Change Character"
              >
                <img 
                  src={characterMap[selectedCharId]} 
                  alt="Character" 
                  className="cd-welcome-char-img"
                />
              </div>
              <div className="cd-welcome-text">
                <h2>Welcome back, {userName}!</h2>
                <p>Ready to learn something new today?</p>
              </div>
            </div>
            <div className="cd-welcome-days">
              {weekDays.map((day, i) => (
                <div key={i} className={`cd-day${day.checked ? ' checked' : ''}${day.active ? ' active' : ''}`}>
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="cd-stats-row">
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={GamesIcon} alt="Games" style={{ width: '95%', height: '95%' }} />
              </div>
              <div className="cd-stat-info">
                <h3>{totalHoursPlayed}</h3>
                <p>hours played</p>
              </div>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={ReadingIcon} alt="Reading" />
              </div>
              <div className="cd-stat-info">
                <h3>{totalStoriesDone}</h3>
                <p>Stories Done</p>
              </div>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={StreakIcon} alt="Streak" />
              </div>
              <div className="cd-stat-info">
                <h3>{streak}</h3>
                <p>days streak</p>
              </div>
            </div>
          </div>

          {/* Reading Progress Section */}
          <div className="cd-card cd-premium-card">
            <div className="cd-premium-header">
              <h3>Reading Progress</h3>
              <span className="cd-premium-badge">This Week</span>
            </div>
            
            <div className="cd-reading-premium-container">
              {/* Circular Progress */}
              <div className="cd-reading-circle-wrap">
                <svg className="cd-reading-circle" viewBox="0 0 120 120">
                  <circle className="cd-circle-bg" cx="60" cy="60" r="50" />
                  <circle className="cd-circle-progress completed" cx="60" cy="60" r="50" 
                          strokeDasharray={`${readingStats.total > 0 ? (readingStats.completed / readingStats.total) * 314 : 0} 314`} 
                          strokeDashoffset="0" />
                  <circle className="cd-circle-progress in-progress" cx="60" cy="60" r="50" 
                          strokeDasharray={`${readingStats.total > 0 ? (readingStats.inProgress / readingStats.total) * 314 : 0} 314`} 
                          strokeDashoffset={`-${readingStats.total > 0 ? (readingStats.completed / readingStats.total) * 314 : 0}`} />
                </svg>
                <div className="cd-circle-inner-text">
                  <span className="cd-circle-number">
                    {readingStats.total > 0 ? Math.round((readingStats.completed / readingStats.total) * 100) : 0}%
                  </span>
                  <span className="cd-circle-label">Done</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="cd-reading-stats-grid">
                <div className="cd-premium-stat-box">
                  <div className="cd-stat-icon-small bg-blue-light">📚</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val">{readingStats.total}</span>
                    <span className="cd-stat-name">Total Books</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-green">
                  <div className="cd-stat-icon-small bg-green-light">✅</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-green">{readingStats.completed}</span>
                    <span className="cd-stat-name">Completed</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-orange">
                  <div className="cd-stat-icon-small bg-orange-light">⏳</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-orange">{readingStats.inProgress}</span>
                    <span className="cd-stat-name">In Progress</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-gray">
                  <div className="cd-stat-icon-small bg-gray-light">📖</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-gray">{readingStats.unread}</span>
                    <span className="cd-stat-name">Unread</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Games Performance Section */}
          <div className="cd-card cd-premium-card">
            <div className="cd-premium-header mb-20">
              <div className="cd-header-text">
                <div className="cd-title-with-badge">
                  <h3>Games Performance</h3>
                  {(gamesChartData.length >= 5) && (
                    <span className="cd-achievement-badge">🏆 Rising Star</span>
                  )}
                </div>
                <p className="cd-header-subtitle">Your progress across all played games</p>
              </div>
            </div>
            
            {gamesChartData.length > 0 ? (
              <div className="cd-chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={gamesChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    barGap={8}
                  >
                    <defs>
                      <linearGradient id="bestScoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6D8DBF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6D8DBF" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="lastScoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9AD0EE" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#9AD0EE" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      content={<CustomTooltip gamesData={gamesChartData} />} 
                      cursor={{ fill: 'rgba(229, 231, 235, 0.4)' }} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '20px' }}
                    />
                    <Bar 
                      dataKey="bestScore" 
                      name="Best Score" 
                      fill="url(#bestScoreGradient)" 
                      radius={[6, 6, 0, 0]} 
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="lastScore" 
                      name="Last Score" 
                      fill="url(#lastScoreGradient)" 
                      radius={[6, 6, 0, 0]} 
                      animationDuration={2000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎮</div>
                <p>No games played yet. Start playing to see your scores here!</p>
              </div>
            )}

            {/* Games Mastered Progress Bar */}
            <div className="cd-locked-games-section gamified">
              <div className="cd-locked-header">
                <div className="cd-locked-info">
                  <span className="cd-locked-title">Games Mastered</span>
                  <span className="cd-locked-count">
                    {gamesChartData.length} / {allGamesData.length || availableGames.length || gamesChartData.length}
                  </span>
                </div>
                <div className="cd-locked-progress-bar">
                  <div 
                    className="cd-locked-progress-fill" 
                    style={{ 
                      width: `${allGamesData.length > 0 
                        ? (gamesChartData.length / allGamesData.length) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Column Grids */}
          <div className="cd-grid-2">
            {/* Recommended Stories */}
            <div className="cd-card">
              <div className="cd-title-flex">
                <h3>Recommended Stories</h3>
                <a href="#" className="cd-link" onClick={(e) => { e.preventDefault(); navigate('/challenges'); }}>View all ➔</a>
              </div>
              <div className="cd-rec-list">
                {recommendedStories.length > 0 ? (
                  recommendedStories.map((story, i) => {
                    const colors = ['yellow', 'blue', 'green'];
                    return (
                      <div className="cd-rec-item" key={story.id}>
                        <div className={`cd-rec-icon ${colors[i % colors.length]}`}>📖</div>
                        <div className="cd-rec-info">
                          <h4>{story.title}</h4>
                          <p>{story.page_count ? `${story.page_count} pages` : ''}{story.avg_duration ? ` • ${story.avg_duration} min` : ''}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    <p>You've read all available stories! 🎉</p>
                  </div>
                )}
              </div>
            </div>

            {/* Speech Practice */}
            <div className="cd-card">
              <div className="cd-title-flex">
                <h3>Speech Practice</h3>
                <span className="cd-last-score">
                  🎙️ Last score: {speechStats.lastScore > 0 ? `${speechStats.lastScore}%` : 'N/A'}
                </span>
              </div>
              <p style={{fontSize: '13px', color: '#888', margin: '0 0 16px 0'}}>
                {voiceAttempts.length > 0 
                  ? `You've completed ${voiceAttempts.length} reading sessions. Keep practicing!` 
                  : 'Start reading stories to track your speech progress!'}
              </p>
              {voiceAttempts.length > 0 && (
                <div className="cd-speech-bars">
                  <div className="cd-speech-row">
                    <div className="cd-speech-phoneme">📊</div>
                    <div className="cd-speech-progress-container">
                      <div className="cd-speech-labels">
                        <span>Avg accuracy: {stats?.average_voice_accuracy ?? 0}%</span>
                        <span>{voiceAttempts.length} sessions</span>
                      </div>
                      <div className="cd-speech-bar-bg">
                        <div className="cd-speech-bar-fill" style={{width: `${stats?.average_voice_accuracy ?? 0}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button className="cd-btn-orange" onClick={() => navigate('/challenges')}>
                🎙️ Start Practice
              </button>
            </div>
          </div>

          {/* Activity Hub */}
          <div className="cd-card">
            <div className="cd-title-flex">
              <h3>Activity Hub</h3>
              <span className="cd-last-score">⭐ {availableGames.length || 3} activities available</span>
            </div>
            <div className="cd-games-row">
              <div className="cd-game-card yellow" onClick={() => navigate('/challenges')}>
                <div className="cd-game-icon">🧩</div>
                <h4>Word Matching</h4>
                <p>Easy</p>
                <button className="cd-game-btn">⚡ Play</button>
              </div>
              <div className="cd-game-card blue" onClick={() => navigate('/challenges')}>
                <div className="cd-game-icon">🎤</div>
                <h4>Pronunciation Challenge</h4>
                <p>Medium</p>
                <button className="cd-game-btn">⚡ Play</button>
              </div>
              <div className="cd-game-card green" onClick={() => navigate('/customization')}>
                <div className="cd-game-icon">🎨</div>
                <h4>Customization</h4>
                <p>Personalize</p>
                <button className="cd-game-btn">✨ Open</button>
              </div>
            </div>
          </div>

        </div>
      </div>
      <CharacterSelectionModal 
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        onSelect={handleSelectCharacter}
        selectedId={selectedCharId}
      />

      {showLogoutConfirm && (
        <div className="cd-logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="cd-logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-logout-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3>Log out?</h3>
            <p>You'll need to sign in again to keep playing.</p>
            <div className="cd-logout-actions">
              <button className="cd-logout-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Stay
              </button>
              <button className="cd-logout-confirm" onClick={handleLogout}>
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChildDashboard;