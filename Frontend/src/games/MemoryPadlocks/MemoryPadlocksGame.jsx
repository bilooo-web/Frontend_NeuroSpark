import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../../components/common/Header/Header";
import './MemoryPadlocksGame.css';
import successSnd from '../../assets/Success.mp3';
import errorSnd from '../../assets/SoftFailSound.mp3';
import relaxGiraffe from "../../assets/relax-giraffe.png";


const GAME_STATES = { MEMORIZE: 'MEMORIZE', MATCH: 'MATCH' };
const INITIAL_LEVEL = 1;

/* ADHD-friendly celebration & motivation toasts */
const CELEBRATION_MSGS = [
  { emoji: '🌟', text: 'Amazing!', sub: 'Your brain is so powerful!' },
  { emoji: '🎉', text: 'You did it!', sub: 'That was incredible!' },
  { emoji: '🚀', text: 'Superstar!', sub: 'You are unstoppable!' },
  { emoji: '💪', text: 'So strong!', sub: 'Look at that big brain!' },
  { emoji: '🏆', text: 'Champion!', sub: 'You nailed it!' },
  { emoji: '✨', text: 'Brilliant!', sub: 'You are getting better every time!' },
];
const MOTIVATION_MSGS = [
  { emoji: '💪', text: 'Almost!', sub: 'You are so close — try again!' },
  { emoji: '🌈', text: 'Keep going!', sub: 'Mistakes help your brain grow!' },
  { emoji: '⭐', text: 'Nice try!', sub: 'Every attempt makes you smarter!' },
  { emoji: '🔥', text: "Don't give up!", sub: 'You have got this!' },
  { emoji: '🧠', text: 'Brain growing!', sub: 'Errors are part of learning!' },
];

const MemoryPadlocksGame = ({ 
  onGameComplete, 
  startNewSession, 
  abandonSession, 
  navigateBack, 
  gameInfo,
  totalCoins: initialTotalCoins = 0 
}) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(GAME_STATES.MEMORIZE);
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [squares, setSquares] = useState([]);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [userInputs, setUserInputs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(6);
  const [matchTimeLeft, setMatchTimeLeft] = useState(20);
  const [isCorrect, setIsCorrect] = useState(null);
  const [shake, setShake] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState(false);
  const [screen, setScreen] = useState("game"); // "game", "gameover"
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [paused, setPaused] = useState(false);
  const [levelCoins, setLevelCoins] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [headerTotalCoins, setHeaderTotalCoins] = useState(initialTotalCoins);

  // Analytics refs
  const gameStartTime = useRef(Date.now());
  const totalPausedTime = useRef(0);
  const pauseStartTime = useRef(null);
  const totalChecks = useRef(0);
  const incorrectChecks = useRef(0);
  const correctLevels = useRef(0);
  const responseTimes = useRef([]);
  const matchPhaseStart = useRef(null);
  const lastActivityTime = useRef(Date.now());
  const inactivityCount = useRef(0);
  const inactivityInterval = useRef(null);
  const totalCoinsEarned = useRef(0);
  const lastInputTime = useRef(Date.now());

  // Computed values
  const isGameOver = screen === "gameover";
  const roundIndex = level - 1;
  const totalCorrect = correctLevels.current;
  const accuracy = totalChecks.current > 0 ? Math.round((correctLevels.current / totalChecks.current) * 100) : 0;

  // Listen for coin updates from parent
  useEffect(() => {
    const handleCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) {
        setHeaderTotalCoins(e.detail.totalCoins);
      }
    };
    
    window.addEventListener('coins-updated', handleCoinsUpdated);
    return () => window.removeEventListener('coins-updated', handleCoinsUpdated);
  }, []);

  const showCelebration = () => {
    const msg = CELEBRATION_MSGS[Math.floor(Math.random() * CELEBRATION_MSGS.length)];
    setCelebration(msg); setTimeout(() => setCelebration(null), 2200);
  };
  
  const showMotivation = () => {
    const msg = MOTIVATION_MSGS[Math.floor(Math.random() * MOTIVATION_MSGS.length)];
    setMotivation(msg); setTimeout(() => setMotivation(null), 2200);
  };

  // Timer config: more generous, scales with level
  const getMemorizeTime = (lvl) => Math.max(6 - Math.floor((lvl - 1) / 2), 3);
  const getMatchTime = (lvl) => Math.max(20 + lvl * 3, 20);

  useEffect(() => {
    inactivityInterval.current = setInterval(() => {
      if (paused || isGameOver) return;
      if (gameState === GAME_STATES.MATCH && isCorrect !== true) {
        if (Date.now() - lastActivityTime.current > 10000) {
          inactivityCount.current += 1;
          lastActivityTime.current = Date.now();
        }
      }
    }, 5000);
    return () => clearInterval(inactivityInterval.current);
  }, [gameState, isGameOver, isCorrect, paused]);

  const togglePause = () => {
    if (isGameOver) return;
    if (paused) {
      if (pauseStartTime.current) {
        const pausedDuration = Date.now() - pauseStartTime.current;
        totalPausedTime.current += pausedDuration;
        // Shift lastInputTime forward so next RT isn't inflated by pause duration
        lastInputTime.current += pausedDuration;
        pauseStartTime.current = null;
      }
      lastActivityTime.current = Date.now();
      setPaused(false);
    } else {
      pauseStartTime.current = Date.now();
      setPaused(true);
    }
  };


  const generateLevelData = useCallback((lvl) => {
    const numItems = Math.min(lvl + 1, 6);
    const colors = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'];
    const newSquares = [];
    for (let i = 0; i < numItems; i++) {
      newSquares.push({ id: i, number: Math.floor(Math.random() * 9) + 1, color: colors[i % colors.length] });
    }
    setSquares(newSquares);
    setShuffledIndices(Array.from({ length: numItems }, (_, i) => i));
    setUserInputs(new Array(numItems).fill(0));
    setGameState(GAME_STATES.MEMORIZE);
    setPhaseTransition(false);
    setScreen("game");
    setLevelCoins(0);
    setTimeLeft(getMemorizeTime(lvl));
    setMatchTimeLeft(getMatchTime(lvl));
    setIsCorrect(null);
  }, []);

  useEffect(() => { generateLevelData(level); }, [level, generateLevelData]);

  // Memorize countdown
  useEffect(() => {
    if (paused || isGameOver) return;
    if (gameState === GAME_STATES.MEMORIZE && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (gameState === GAME_STATES.MEMORIZE && timeLeft === 0) {
      setPhaseTransition(true);
      const indices = Array.from({ length: squares.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      setTimeout(() => {
        setGameState(GAME_STATES.MATCH);
        setPhaseTransition(false);
        matchPhaseStart.current = Date.now();
        lastActivityTime.current = Date.now();
        lastInputTime.current = Date.now();
      }, 500);
    }
  }, [gameState, timeLeft, paused, isGameOver, squares.length]);

  // Match countdown
  useEffect(() => {
    if (paused || isGameOver) return;
    if (gameState === GAME_STATES.MATCH && matchTimeLeft > 0 && isCorrect !== true) {
      const t = setTimeout(() => setMatchTimeLeft(matchTimeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (gameState === GAME_STATES.MATCH && matchTimeLeft === 0 && isCorrect !== true) {
      finishGame();
    }
  }, [gameState, matchTimeLeft, isCorrect, paused, isGameOver]);

  /**
   * Calculate coins earned per level.
   * Based on game's reward_coins and performance
   */
  const getCoinsPerLevel = (levelNum, isPerfect = false) => {
    const maxCoins = gameInfo?.reward_coins || 10;
    const basePerLevel = Math.round(maxCoins / 5); // 5 levels max
    return isPerfect ? Math.round(basePerLevel * 1.5) : basePerLevel;
  };

  const finishGame = async () => {
    setScreen("gameover");
    clearInterval(inactivityInterval.current);

    const activeDuration = Math.round((Date.now() - gameStartTime.current - totalPausedTime.current) / 1000);
    const totalAtt = totalChecks.current;
    const correctCount = correctLevels.current;
    
    // accuracy = (correct check clicks / total check clicks) × 100
    const accuracyCalc = totalAtt > 0 ? Math.round((correctCount / totalAtt) * 100) : 0;
    
    // score = min(levelsCompleted × 20, 100)
    const scoreCalc = Math.min(correctCount * 20, 100);
    
    // Calculate average response time (between check clicks)
    const rts = responseTimes.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    
    // Calculate response time variability (standard deviation)
    let rtVar = 0;
    if (rts.length > 1) {
      const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
      const sqDiffs = rts.map(v => Math.pow(v - mean, 2));
      rtVar = Math.round(Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (rts.length - 1)));
    }

    // incorrect_attempts = total checks - correct levels
    const incorrectAttempts = Math.max(totalAtt - correctCount, 0);

    if (onGameComplete) {
      const result = await onGameComplete({
        score: scoreCalc,
        duration: Math.max(activeDuration, 1),
        accuracy: accuracyCalc,
        incorrectAttempts: incorrectAttempts,
        totalAttempts: Math.max(totalAtt, 1),
        avgResponseTime: avgRT,
        responseTimeVariability: rtVar,
        inactivityEvents: inactivityCount.current,
      });
      
      if (result?.coinsEarned) {
        setEarnedCoins(result.coinsEarned);
        
        // Update header coins
        if (result.totalCoins) {
          setHeaderTotalCoins(result.totalCoins);
        }
      }
    }
  };

  const cycleValue = (origIdx, delta) => {
    if (isCorrect === true || isGameOver || paused) return;
    
    // Only track activity time for inactivity detection (NOT response times)
    lastActivityTime.current = Date.now();
    // NOTE: Do NOT update lastInputTime here — dial changes are mechanical actions,
    // not decisions. RT should measure time between Check presses (decision points).
    
    const newInputs = [...userInputs];
    newInputs[origIdx] = (newInputs[origIdx] + delta + 10) % 10;
    setUserInputs(newInputs);
  };

  const playSound = (url) => { new Audio(url).play().catch(() => {}); };

  const handleCheck = () => {
    if (isGameOver || paused) return;
    
    lastActivityTime.current = Date.now();
    totalChecks.current += 1;
    
    // Record response time: time between decision points (Check presses)
    // First check of a level: time from match phase start to first Check
    // Subsequent checks: time from previous Check to this Check
    const now = Date.now();
    if (matchPhaseStart.current) {
      const anchor = responseTimes.current.length === 0 ? matchPhaseStart.current : lastInputTime.current;
      const rt = now - anchor;
      // Only record meaningful response times (500ms - 60s)
      // 500ms minimum filters out accidental double-taps
      if (rt >= 500 && rt <= 60000) {
        responseTimes.current.push(rt);
      }
    }
    lastInputTime.current = now;

    if (userInputs.every((v, i) => v === squares[i].number)) {
      setIsCorrect(true);
      correctLevels.current += 1;
      
     
      const lvlCoins = getCoinsPerLevel(level);
      
      totalCoinsEarned.current += lvlCoins;
      setLevelCoins(lvlCoins);
      playSound(successSnd);
      showCelebration();
      
      setTimeout(() => {
        setPhaseTransition(true);
        setTimeout(() => setLevel(p => p + 1), 500);
      }, 2000);
    } else {
      setShake(true); 
      setIsCorrect(false);
      incorrectChecks.current += 1;
      playSound(errorSnd);
      showMotivation();
      setTimeout(() => { setShake(false); setIsCorrect(null); }, 600);
    }
  };

  const resetGame = async () => {
    if (startNewSession) await startNewSession();
    gameStartTime.current = Date.now();
    totalPausedTime.current = 0; 
    pauseStartTime.current = null;
    totalChecks.current = 0; 
    incorrectChecks.current = 0; 
    correctLevels.current = 0;
    responseTimes.current = []; 
    inactivityCount.current = 0; 
    totalCoinsEarned.current = 0;
    lastActivityTime.current = Date.now();
    lastInputTime.current = Date.now();
    setEarnedCoins(0); 
    setPaused(false); 
    setCelebration(null); 
    setMotivation(null);
    setLevel(INITIAL_LEVEL); 
    setScreen("game");
    generateLevelData(INITIAL_LEVEL);
  };

  const goBack = () => {
    const finalScore = Math.min(correctLevels.current * 20, 100);
    if (navigateBack) navigateBack({ score: finalScore }, earnedCoins);
  };

  const maxMatchTime = getMatchTime(level);
  const pctMatch = () => (matchTimeLeft / maxMatchTime) * 100;
  const pctMemo = () => (timeLeft / getMemorizeTime(level)) * 100;

  /* ── Toast (celebration / motivation) ── */
  const renderToast = (msg, type) => (
    <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', zIndex:10000, pointerEvents:'none' }}>
      <style>{`@keyframes mp-toastAnim { 0%{opacity:0;transform:translateX(-50%) scale(0.5)} 15%{opacity:1;transform:translateX(-50%) scale(1.1)} 25%{transform:translateX(-50%) scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-30px)} }`}</style>
      <div style={{ animation:'mp-toastAnim 2.2s ease forwards', background: type === 'celebrate' ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'linear-gradient(135deg,#667eea,#764ba2)', padding:'18px 36px', borderRadius:24, display:'flex', alignItems:'center', gap:14, boxShadow: type === 'celebrate' ? '0 8px 30px rgba(255,215,0,0.5)' : '0 8px 30px rgba(118,75,162,0.5)', border:'2px solid rgba(255,255,255,0.5)' }}>
        <span style={{ fontSize:40 }}>{msg.emoji}</span>
        <div><div style={{ fontFamily:"'Fredoka One', cursive", fontSize:22, color:'#fff' }}>{msg.text}</div><div style={{ fontSize:13, color:'rgba(255,255,255,0.9)', fontWeight:600, marginTop:2 }}>{msg.sub}</div></div>
      </div>
    </div>
  );

  /* ── Pause Overlay ── */
  const renderPause = () => (
    <div className="fn-pause-overlay">
      <div className="fn-pause-card">
        <div className="fn-pause-icon">
          <img 
            src={relaxGiraffe} 
            alt="Relaxing giraffe" 
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
        </div>
        <h2>Game Paused</h2>
        <p>Take a deep breath. You're doing great!</p>
        
        <div className="fn-pause-stats">
          <div className="fn-pause-stat">
            <span className="fn-pause-stat-value">{level}</span>
            <span className="fn-pause-stat-label">Level</span>
          </div>
          <div className="fn-pause-stat">
            <span className="fn-pause-stat-value">{correctLevels.current}</span>
            <span className="fn-pause-stat-label">Cleared</span>
          </div>
        </div>
        
        <button className="fn-pause-resume-btn" onClick={togglePause}>
          ▶ Resume Game
        </button>
        
        <button className="fn-pause-quit-btn" onClick={async () => { 
          if (abandonSession) await abandonSession(); 
          navigate('/challenges'); 
        }}>
          Quit to Challenges
        </button>
      </div>
    </div>
  );

  return (
    <div className="memory-padlocks-game full-screen">
      <div className="mp-background-stars" />
      <Header totalCoins={headerTotalCoins} />

      {paused && renderPause()}
      {celebration && renderToast(celebration, 'celebrate')}
      {motivation && renderToast(motivation, 'motivate')}

      {/* New Game Over Screen */}
      {screen === "gameover" && (() => {
        const rounds = roundIndex + 1;
        const goEm = accuracy>=80?"🧠":accuracy>=60?"🏆":accuracy>=40?"⭐":"💪";
        const goTi = accuracy>=80?"Brilliant Memory!":accuracy>=60?"Great Job!":accuracy>=40?"Good Try!":"Great Effort!";
        const goSu = accuracy>=80?"You are a memory superstar!":accuracy>=60?"Your brain is getting stronger!":accuracy>=40?"Every round makes you better!":"You showed up and tried — that's what matters!";
        const bgGrad = 'linear-gradient(135deg, #8BE3D8, #6BC5B8)';
        
        const coinsEarned = earnedCoins || 0;
        
        return (
          <div className="fn-gameover-screen" style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: bgGrad,
            overflow: 'hidden',
          }}>
            <div className="fn-gameover-content" style={{marginTop: "100px"}}>
              <div className="fn-go-emoji">{goEm}</div>
              <h1 className="fn-go-title" style={{marginTop: "-30px"}}>{goTi}</h1>
              <p className="fn-go-sub">{goSu}</p>
              
              <div className="fn-stats-grid">
                <div className="fn-stat-item">
                  <div className="fn-stat-icon">✔️</div>
                  <div className="fn-stat-value">{totalCorrect}</div>
                  <div className="fn-stat-label">Correct</div>
                </div>
                
                <div className="fn-stat-item">
                  <div className="fn-stat-icon">🔄</div>
                  <div className="fn-stat-value">{rounds}</div>
                  <div className="fn-stat-label">Rounds</div>
                </div>
                
                <div className="fn-stat-item">
                  <div className="fn-stat-icon">🎯</div>
                  <div className="fn-stat-value">{accuracy}%</div>
                  <div className="fn-stat-label">Accuracy</div>
                </div>
                
                <div className="fn-stat-item">
                  <div className="fn-stat-icon">⏱️</div>
                  <div className="fn-stat-value">
                    {responseTimes.current.length > 0 
                      ? Math.round(responseTimes.current.reduce((a,b)=>a+b,0)/responseTimes.current.length) + 'ms'
                      : '—'}
                  </div>
                  <div className="fn-stat-label">Avg Time</div>
                </div>
              </div>
              
              <div className="fn-coin-reward-box">
                <span className="fn-coin-icon">🪙</span>
                <span className="fn-coin-value">+{coinsEarned}</span>
                <span className="fn-coin-label">Coins Earned!</span>
              </div>
              
              <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
                <button onClick={resetGame} style={{
                  padding: '16px 40px', borderRadius: 50, border: 'none',
                  background: 'linear-gradient(135deg, #00a896, #00d4aa)', color: '#fff',
                  fontSize: 18, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0,168,150,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 12px 30px rgba(0,168,150,0.5)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 25px rgba(0,168,150,0.4)'; }}
                >🔄 Play Again</button>
                <button onClick={goBack} style={{
                  padding: '16px 40px', borderRadius: 50,
                  border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 600, cursor: 'pointer',
                  backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                >← Back</button>
              </div>
            </div>
          </div>
        );
      })()}

      
      {!isGameOver && (
        <button onClick={togglePause} className="fn-pause-btn">
          ⏸
        </button>
      )}

      {!isGameOver && (
        <div className="simple-progress-container">
          <div className={`simple-progress-bar ${gameState === GAME_STATES.MEMORIZE ? 'memorize-progress' : 'match-progress'}`}
            style={{
              width: `${gameState === GAME_STATES.MEMORIZE ? pctMemo() : pctMatch()}%`,
              background: gameState === GAME_STATES.MATCH && matchTimeLeft <= 10 ? 'linear-gradient(90deg,#e74c3c,#c0392b)' : undefined
            }} />
        </div>
      )}

      {/* Level coins notification */}
      {levelCoins > 0 && isCorrect === true && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #FFD700, #FFA500)', padding: '16px 32px',
          borderRadius: 50, display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 200, animation: 'mp-coinFloat 2.5s ease-out forwards',
          boxShadow: '0 10px 30px rgba(255,215,0,0.5)', border: '3px solid white',
        }}>
          <style>{`@keyframes mp-coinFloat { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1.1)} 40%{transform:translate(-50%,-50%) scale(1)} 80%{opacity:1;transform:translate(-50%,-80%) scale(1)} 100%{opacity:0;transform:translate(-50%,-120%) scale(0.8)} }`}</style>
          <span style={{ fontSize: 36 }}>🪙</span>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 36, color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>+{levelCoins}</span>
        </div>
      )}

      <main className="game-content">
        <div className="game-card">
          {isGameOver ? null : gameState === GAME_STATES.MEMORIZE ? (
            <div className={`phase-container memorize-phase ${phaseTransition ? 'fade-out' : ''}`}>
              <h2 className="phase-label">Memorize the numbers!</h2>
              <div className="squares-grid">
                {squares.map((sq, i) => (
                  <div key={sq.id} className="memory-square" style={{ backgroundColor: sq.color, animationDelay: `${i * 0.1}s` }}>{sq.number}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`phase-container match-phase ${phaseTransition ? 'fade-out' : 'fade-in'}`}>
              <h2 className="phase-label">Unlock the Locks!</h2>
              <div className="padlocks-grid">
                {shuffledIndices.map((origIdx) => {
                  const sq = squares[origIdx];
      
                  return (
                    <div key={sq.id} className={`padlock-wrapper ${shake ? 'shake' : ''}`}>
                      <div className={`padlock ${isCorrect === true ? 'unlocked' : ''}`}>
                        <div className="padlock-shackle"></div>
                        <div className="padlock-body" style={{ backgroundColor: sq.color, position: 'relative' }}>
                          <div className="dial-area">
                            <button className="dial-arrow up" onClick={() => cycleValue(origIdx, 1)}>▲</button>
                            <div className="dial-value">{userInputs[origIdx]}</div>
                            <button className="dial-arrow down" onClick={() => cycleValue(origIdx, -1)}>▼</button>
                          </div>
                          {isCorrect === true && <div className="checkmark-overlay">✅</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className={`check-button ${isCorrect === true ? 'success' : ''}`} onClick={handleCheck} disabled={isCorrect === true}>
                {isCorrect === true ? 'Great Job!' : 'Check'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MemoryPadlocksGame;