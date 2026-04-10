import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header/Header';
import CharacterSelectionModal from '../components/dashboard/CharacterSelectionModal';
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
  Cell
} from 'recharts';

const characterMap = {
  '1': char1,
  '2': char2,
  '3': char3,
  '4': char4,
  '5': char5,
  '6': char6
};

const mockGames = [
  { id: 1, name: 'Word Match', icon: '🧩', bestScore: 95, lastScore: 82, previousScore: 75, color: '#F59E0B', played: true },
  { id: 2, name: 'Pronunciation', icon: '🎤', bestScore: 88, lastScore: 85, previousScore: 88, color: '#3B82F6', played: true },
  { id: 3, name: 'Reading Speed', icon: '⚡', bestScore: 120, lastScore: 110, previousScore: 115, color: '#10B981', played: true },
  { id: 4, name: 'Memory Cards', icon: '🃏', bestScore: 100, lastScore: 90, previousScore: 85, color: '#8B5CF6', played: true },
  { id: 5, name: 'Math Puzzle', icon: '🔢', bestScore: 150, lastScore: 145, previousScore: 140, color: '#F97316', played: true },
  { id: 6, name: 'Shape Sorter', icon: '🔺', bestScore: 0, lastScore: 0, previousScore: 0, color: '#EC4899', played: false },
  { id: 7, name: 'Color Fill', icon: '🎨', bestScore: 0, lastScore: 0, previousScore: 0, color: '#F59E0B', played: false },
  { id: 8, name: 'Animal Sounds', icon: '🐶', bestScore: 0, lastScore: 0, previousScore: 0, color: '#3B82F6', played: false },
  { id: 9, name: 'Letter Trace', icon: '✍️', bestScore: 0, lastScore: 0, previousScore: 0, color: '#10B981', played: false },
  { id: 10, name: 'Pattern Match', icon: '🎯', bestScore: 0, lastScore: 0, previousScore: 0, color: '#8B5CF6', played: false },
  { id: 11, name: 'Logic Blocks', icon: '🧊', bestScore: 0, lastScore: 0, previousScore: 0, color: '#F97316', played: false },
  { id: 12, name: 'Story Builder', icon: '📚', bestScore: 0, lastScore: 0, previousScore: 0, color: '#EC4899', played: false },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const game = mockGames.find(g => g.name === label);
    const improvement = game.lastScore - game.previousScore;
    const isNewBest = game.lastScore >= game.bestScore;

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

const mockReadingStats = {
  total: 50,
  completed: 12,
  inProgress: 5,
  unread: 33
};

function ChildDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Explorer');
  const [selectedCharId, setSelectedCharId] = useState(() => {
    return localStorage.getItem('selectedCharacterId') || '6';
  });
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.full_name) {
      setUserName(user.full_name.split(' ')[0]);
    }
  }, []);

  const handleSelectCharacter = (id) => {
    setSelectedCharId(id);
    localStorage.setItem('selectedCharacterId', id);
  };

  return (
    <>
      <Header />
      <div className="child-dashboard-container">
        <div className="stars-bg" />
        <div className="child-dashboard-content">

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
              <div className="cd-day checked">M</div>
              <div className="cd-day checked">T</div>
              <div className="cd-day active">W</div>
              <div className="cd-day">T</div>
              <div className="cd-day">F</div>
              <div className="cd-day">S</div>
              <div className="cd-day">S</div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="cd-stats-row">
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={GamesIcon} alt="Games" style={{ width: '95%', height: '95%' }} />
              </div>
              <div className="cd-stat-info">
                <h3>8</h3>
                <p>hours played</p>
              </div>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={ReadingIcon} alt="Reading" />
              </div>
              <div className="cd-stat-info">
                <h3>18</h3>
                <p>Stories Done</p>
              </div>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <img src={StreakIcon} alt="Streak" />
              </div>
              <div className="cd-stat-info">
                <h3>5</h3>
                <p>days streak</p>
              </div>
            </div>
          </div>

          {/* Premium Overall Learning Section */}
          
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
                          strokeDasharray={`${(mockReadingStats.completed / mockReadingStats.total) * 314} 314`} 
                          strokeDashoffset="0" />
                  <circle className="cd-circle-progress in-progress" cx="60" cy="60" r="50" 
                          strokeDasharray={`${(mockReadingStats.inProgress / mockReadingStats.total) * 314} 314`} 
                          strokeDashoffset={`-${(mockReadingStats.completed / mockReadingStats.total) * 314}`} />
                </svg>
                <div className="cd-circle-inner-text">
                  <span className="cd-circle-number">{Math.round((mockReadingStats.completed / mockReadingStats.total) * 100)}%</span>
                  <span className="cd-circle-label">Done</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="cd-reading-stats-grid">
                <div className="cd-premium-stat-box">
                  <div className="cd-stat-icon-small bg-blue-light">📚</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val">{mockReadingStats.total}</span>
                    <span className="cd-stat-name">Total Books</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-green">
                  <div className="cd-stat-icon-small bg-green-light">✅</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-green">{mockReadingStats.completed}</span>
                    <span className="cd-stat-name">Completed</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-orange">
                  <div className="cd-stat-icon-small bg-orange-light">⏳</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-orange">{mockReadingStats.inProgress}</span>
                    <span className="cd-stat-name">In Progress</span>
                  </div>
                </div>
                <div className="cd-premium-stat-box border-gray">
                  <div className="cd-stat-icon-small bg-gray-light">📖</div>
                  <div className="cd-stat-data">
                    <span className="cd-stat-val text-gray">{mockReadingStats.unread}</span>
                    <span className="cd-stat-name">Unread</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Games Performance Section (Redesigned) */}
          <div className="cd-card cd-premium-card">
            <div className="cd-premium-header mb-20">
              <div className="cd-header-text">
                <div className="cd-title-with-badge">
                  <h3>Games Performance</h3>
                  {(mockGames.filter(g => g.played).length >= 5) && (
                    <span className="cd-achievement-badge">🏆 Rising Star</span>
                  )}
                </div>
                <p className="cd-header-subtitle">Your progress across all played games</p>
              </div>
              <button className="cd-premium-view-all">View Full Stats ➔</button>
            </div>
            
            <div className="cd-chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={mockGames.filter(g => g.played)}
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(229, 231, 235, 0.4)' }} />
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

            {/* Gamified Locked Games Section */}
            <div className="cd-locked-games-section gamified">
              <div className="cd-locked-header">
                <div className="cd-locked-info">
                  <span className="cd-locked-title">Games Mastered</span>
                  <span className="cd-locked-count">
                    {mockGames.filter(g => g.played).length} / {mockGames.length}
                  </span>
                </div>
                <div className="cd-locked-progress-bar">
                  <div 
                    className="cd-locked-progress-fill" 
                    style={{ width: `${(mockGames.filter(g => g.played).length / mockGames.length) * 100}%` }}
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
                <div className="cd-rec-item">
                  <div className="cd-rec-icon yellow">📖</div>
                  <div className="cd-rec-info">
                    <h4>The Brave Little Fox</h4>
                    <p>Easy • 5 min</p>
                  </div>
                </div>
                <div className="cd-rec-item">
                  <div className="cd-rec-icon blue">📖</div>
                  <div className="cd-rec-info">
                    <h4>Ocean Adventures</h4>
                    <p>Medium • 8 min</p>
                  </div>
                </div>
                <div className="cd-rec-item">
                  <div className="cd-rec-icon green">📖</div>
                  <div className="cd-rec-info">
                    <h4>Magic Garden</h4>
                    <p>Easy • 4 min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Speech Practice */}
            <div className="cd-card">
              <div className="cd-title-flex">
                <h3>Speech Practice</h3>
                <span className="cd-last-score">🎙️ Last score: 84%</span>
              </div>
              <p style={{fontSize: '13px', color: '#888', margin: '0 0 16px 0'}}>Sounds that need practice:</p>
              <div className="cd-speech-bars">
                <div className="cd-speech-row">
                  <div className="cd-speech-phoneme">th</div>
                  <div className="cd-speech-progress-container">
                    <div className="cd-speech-labels">
                      <span>63% accuracy</span>
                      <span>5 words</span>
                    </div>
                    <div className="cd-speech-bar-bg">
                      <div className="cd-speech-bar-fill" style={{width: '63%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="cd-speech-row">
                  <div className="cd-speech-phoneme" style={{background: '#E6F4EA', color: '#5DB06D'}}>r</div>
                  <div className="cd-speech-progress-container">
                    <div className="cd-speech-labels">
                      <span>78% accuracy</span>
                      <span>3 words</span>
                    </div>
                    <div className="cd-speech-bar-bg">
                      <div className="cd-speech-bar-fill" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="cd-speech-row">
                  <div className="cd-speech-phoneme" style={{background: '#FEF3D0', color: '#D4A32B'}}>sh</div>
                  <div className="cd-speech-progress-container">
                    <div className="cd-speech-labels">
                      <span>85% accuracy</span>
                      <span>2 words</span>
                    </div>
                    <div className="cd-speech-bar-bg">
                      <div className="cd-speech-bar-fill" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="cd-btn-orange">🎙️ Start Practice</button>
            </div>
          </div>

          {/* Activity Hub */}
          <div className="cd-card">
            <div className="cd-title-flex">
              <h3>Activity Hub</h3>
              <span className="cd-last-score">⭐ 3 sections available</span>
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
    </>
  );
}

export default ChildDashboard;
