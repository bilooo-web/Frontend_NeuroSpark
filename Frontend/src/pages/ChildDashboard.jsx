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

const characterMap = {
  '1': char1,
  '2': char2,
  '3': char3,
  '4': char4,
  '5': char5,
  '6': char6
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

          {/* Learning Progress */}
          <div className="cd-card">
            <div className="cd-title">Overall Learning Progress</div>
            <div className="cd-progress-area">
              <div className="cd-donuts">
                <div className="cd-donut-container">
                  <div className="cd-donut-bg"></div>
                  <div className="cd-donut-fill" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 0 72%)' }}></div>
                  <div className="cd-donut-text">
                    <h3>72%</h3>
                    <p>Reading</p>
                  </div>
                </div>
                <div className="cd-donut-container">
                  <div className="cd-donut-bg"></div>
                  <div className="cd-donut-fill speaking" style={{ transform: 'rotate(-45deg)', clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 40%)' }}></div>
                  <div className="cd-donut-text">
                    <h3>+10%</h3>
                    <p>Speaking</p>
                  </div>
                </div>
              </div>
              
              <div className="cd-bar-chart">
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '20px'}}></div><span className="cd-bar-label">M</span></div>
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '35px'}}></div><span className="cd-bar-label">T</span></div>
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '25px'}}></div><span className="cd-bar-label">W</span></div>
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '45px'}}></div><span className="cd-bar-label">T</span></div>
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '50px'}}></div><span className="cd-bar-label">F</span></div>
                <div className="cd-bar-col"><div className="cd-bar inactive" style={{height: '10px'}}></div><span className="cd-bar-label">S</span></div>
                <div className="cd-bar-col"><div className="cd-bar" style={{height: '30px'}}></div><span className="cd-bar-label">S</span></div>
              </div>
            </div>
          </div>

          {/* Continue Learning */}
          <div className="cd-continue-row">
            <div className="cd-continue-item" onClick={() => navigate('/story/3')}>
              <div className="cd-continue-icon yellow" style={{fontSize:'24px'}}>🦒</div>
              <div className="cd-continue-item-info">
                <h4>Continue "The Friendly Giraffe"</h4>
                <p>Chapter 3 • 4 min left</p>
              </div>
            </div>
            <div className="cd-continue-item">
              <div className="cd-continue-icon blue" style={{fontSize:'24px'}}>🎤</div>
              <div className="cd-continue-item-info">
                <h4>Pronunciation Practice</h4>
                <p>5 words to review</p>
              </div>
            </div>
            <div className="cd-continue-item" onClick={() => navigate('/challenges')}>
              <div className="cd-continue-icon green" style={{fontSize:'24px'}}>🎮</div>
              <div className="cd-continue-item-info">
                <h4>Word Match Game</h4>
                <p>Level 4 - Beat your score!</p>
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

          {/* Learning Games */}
          <div className="cd-card">
            <div className="cd-title-flex">
              <h3>Learning Games</h3>
              <span className="cd-last-score">⭐ 3 games available</span>
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
              <div className="cd-game-card green" onClick={() => navigate('/challenges')}>
                <div className="cd-game-icon">⚡</div>
                <h4>Reading Speed</h4>
                <p>Hard</p>
                <button className="cd-game-btn">⚡ Play</button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="cd-grid-2">
            {/* Recent Activity */}
            <div className="cd-card">
              <div className="cd-title">Recent Activity</div>
              <div className="cd-activity-list">
                <div className="cd-activity-item">
                  <div className="cd-rec-icon blue" style={{width:'40px', height:'40px', fontSize:'16px'}}>🎤</div>
                  <div className="cd-activity-info">
                    <h4>Practiced pronunciation</h4>
                    <p>Today</p>
                  </div>
                </div>
                <div className="cd-activity-item">
                  <div className="cd-rec-icon yellow" style={{width:'40px', height:'40px', fontSize:'16px'}}>📖</div>
                  <div className="cd-activity-info">
                    <h4>Finished Story 3</h4>
                    <p>Yesterday</p>
                  </div>
                </div>
                <div className="cd-activity-item">
                  <div className="cd-rec-icon green" style={{width:'40px', height:'40px', fontSize:'16px'}}>🎮</div>
                  <div className="cd-activity-info">
                    <h4>Played vocabulary game</h4>
                    <p>3 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Coach */}
            <div className="cd-card">
              <div className="cd-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <span style={{color:'#5DB06D'}}>💬</span> AI Coach
              </div>
              <div className="cd-coach-list">
                <div className="cd-coach-msg">
                  Your pronunciation improved by 8% this week! 🎉
                </div>
                <div className="cd-coach-msg">
                  Try practicing longer sentences next.
                </div>
                <div className="cd-coach-msg">
                  You read 3 stories this week — great job!
                </div>
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
