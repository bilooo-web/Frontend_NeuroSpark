import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../../components/common/Header/Header";
import './MemoryPadlocksGame.css';
import successSnd from '../../assets/Success.mp3';
import errorSnd from '../../assets/SoftFailSound.mp3';

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
  const [gameOver, setGameOver] = useState(false);
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
      if (paused || gameOver) return;
      if (gameState === GAME_STATES.MATCH && isCorrect !== true) {
        if (Date.now() - lastActivityTime.current > 10000) {
          inactivityCount.current += 1;
          lastActivityTime.current = Date.now();
        }
      }
    }, 5000);
    return () => clearInterval(inactivityInterval.current);
  }, [gameState, gameOver, isCorrect, paused]);

  const togglePause = () => {
    if (gameOver) return;
    if (paused) {
      if (pauseStartTime.current) {
        totalPausedTime.current += Date.now() - pauseStartTime.current;
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
    setGameOver(false);
    setLevelCoins(0);
    setTimeLeft(getMemorizeTime(lvl));
    setMatchTimeLeft(getMatchTime(lvl));
    setIsCorrect(null);
  }, []);

  useEffect(() => { generateLevelData(level); }, [level, generateLevelData]);

  // Memorize countdown
  useEffect(() => {
    if (paused || gameOver) return;
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
  }, [gameState, timeLeft, paused, gameOver, squares.length]);

  // Match countdown
  useEffect(() => {
    if (paused || gameOver) return;
    if (gameState === GAME_STATES.MATCH && matchTimeLeft > 0 && isCorrect !== true) {
      const t = setTimeout(() => setMatchTimeLeft(matchTimeLeft - 1), 1000);
      return () => clearTimeout(t);
    } else if (gameState === GAME_STATES.MATCH && matchTimeLeft === 0 && isCorrect !== true) {
      finishGame();
    }
  }, [gameState, matchTimeLeft, isCorrect, paused, gameOver]);

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
    setGameOver(true);
    clearInterval(inactivityInterval.current);

    const activeDuration = Math.round((Date.now() - gameStartTime.current - totalPausedTime.current) / 1000);
    const totalAtt = totalChecks.current;
    const correctCount = correctLevels.current;
    
    // accuracy = (correct check clicks / total check clicks) × 100
    const accuracy = totalAtt > 0 ? Math.round((correctCount / totalAtt) * 100) : 0;
    
    // score = min(levelsCompleted × 20, 100)
    const score = Math.min(correctCount * 20, 100);
    
    // Calculate average response time (between check clicks)
    const rts = responseTimes.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    
    // Calculate response time variability (standard deviation)
    let rtVar = 0;
    if (rts.length > 1) {
      const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
      const sqDiffs = rts.map(v => Math.pow(v - mean, 2));
      rtVar = Math.round(Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / rts.length));
    }

    // incorrect_attempts = total checks - correct levels
    const incorrectAttempts = Math.max(totalAtt - correctCount, 0);

    if (onGameComplete) {
      const result = await onGameComplete({
        score,
        duration: Math.max(activeDuration, 1),
        accuracy,
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
    if (isCorrect === true || gameOver || paused) return;
    
    // Only track activity time for inactivity detection (NOT response times)
    lastActivityTime.current = Date.now();
    lastInputTime.current = Date.now();
    
    const newInputs = [...userInputs];
    newInputs[origIdx] = (newInputs[origIdx] + delta + 10) % 10;
    setUserInputs(newInputs);
  };

  const playSound = (url) => { new Audio(url).play().catch(() => {}); };

  const handleCheck = () => {
    if (gameOver || paused) return;
    
    lastActivityTime.current = Date.now();
    totalChecks.current += 1;
    
    // Record response time: time from match phase start (first check) or from last check
    const now = Date.now();
    if (matchPhaseStart.current) {
      const rt = now - (responseTimes.current.length === 0 ? matchPhaseStart.current : lastInputTime.current);
      // Only record meaningful response times (100ms - 60s)
      if (rt >= 100 && rt <= 60000) {
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
    generateLevelData(INITIAL_LEVEL);
  };

  const goBack = () => {
    const score = Math.min(correctLevels.current * 20, 100);
    if (navigateBack) navigateBack({ score }, earnedCoins);
  };

  const maxMatchTime = getMatchTime(level);
  const pctMatch = () => (matchTimeLeft / maxMatchTime) * 100;
  const pctMemo = () => (timeLeft / getMemorizeTime(level)) * 100;

  const score = Math.min(correctLevels.current * 20, 100);
  const accuracy = totalChecks.current > 0 ? Math.round((correctLevels.current / totalChecks.current) * 100) : 0;

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,30,0.92)', backdropFilter: 'blur(16px)' }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: '48px 44px', textAlign: 'center', maxWidth: 380, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>⏸️</div>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>Paused</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px' }}>Take your time</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px', minWidth: 80 }}>
            <div style={{ color: '#00e5bf', fontSize: 24, fontWeight: 700 }}>Lv.{level}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>Level</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px', minWidth: 80 }}>
            <div style={{ color: '#f5b731', fontSize: 24, fontWeight: 700 }}>{correctLevels.current}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>Cleared</div>
          </div>
          
        </div>
        <button onClick={togglePause} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #00a896, #00d4aa)', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginBottom: 12, letterSpacing: 0.5 }}>
          ▶ Resume
        </button>
        <button onClick={async () => { if (abandonSession) await abandonSession(); navigate('/challenges'); }} style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>
          Quit to Challenges
        </button>
      </div>
    </div>
  );

  /* ── Game Over Screen with Coin Display ── */
  const renderGameOver = () => {
    const cleared = correctLevels.current;
    const emoji = cleared >= 5 ? '👑' : cleared >= 3 ? '🏆' : cleared >= 1 ? '⭐' : '💪';
    const title = cleared >= 5 ? 'Lock Master!' : cleared >= 3 ? 'Great Memory!' : cleared >= 1 ? 'Nice Try!' : 'Keep Going!';
    const subtitle = cleared >= 5 ? 'You conquered all locks like a true champion!' : cleared >= 3 ? 'Your memory is getting really sharp!' : cleared >= 1 ? 'You unlocked some tough challenges!' : 'Every attempt makes your brain stronger!';
    const bgGrad = cleared >= 3 ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: bgGrad,
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes mp-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(180deg)} }
          @keyframes mp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
          @keyframes mp-slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
          @keyframes mp-fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes mp-confettiFall { 0%{transform:translateY(-100vh) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
          @keyframes mp-glow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)} 50%{box-shadow:0 0 40px rgba(255,215,0,0.6)} }
          @keyframes mp-trophy { 0%{transform:scale(0) rotate(-20deg)} 50%{transform:scale(1.3) rotate(10deg)} 100%{transform:scale(1) rotate(0deg)} }
          .mp-confetti{position:absolute;width:10px;height:10px;border-radius:2px;animation:mp-confettiFall linear forwards;pointer-events:none}
        `}</style>

        {/* Confetti (only if cleared >= 2) */}
        {cleared >= 2 && Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="mp-confetti" style={{
            left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`,
            background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F5B731', '#00E5BF'][i % 6],
            width: Math.random() * 12 + 6, height: Math.random() * 12 + 6,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }} />
        ))}

        {/* Trophy emoji */}
        <div style={{ fontSize: 100, animation: 'mp-trophy 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}>
          {emoji}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Fredoka One', 'Outfit', cursive", fontSize: 42, color: '#fff',
          textShadow: '0 4px 15px rgba(0,0,0,0.3)', margin: '16px 0 8px',
          animation: 'mp-slideUp 0.6s ease-out 0.3s both', letterSpacing: 1,
        }}>{title}</h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 600,
          animation: 'mp-slideUp 0.6s ease-out 0.4s both', maxWidth: 400, textAlign: 'center',
          lineHeight: 1.5, padding: '0 20px',
        }}>{subtitle}</p>

        {/* Enhanced Stats cards */}
        <div style={{
          display: 'flex', gap: 16, margin: '28px 0 20px', flexWrap: 'wrap',
          justifyContent: 'center', animation: 'mp-slideUp 0.6s ease-out 0.5s both',
        }}>
          {[
            { value: cleared, label: 'Levels Cleared', color: '#00E5BF', icon: '🔓' },
            { value: `${score}%`, label: 'Score', color: '#F5B731', icon: '📊' },
            { value: `${accuracy}%`, label: 'Accuracy', color: '#A78BFA', icon: '🎯' },
            { value: Math.round(responseTimes.current.reduce((a,b)=>a+b,0)/Math.max(1,responseTimes.current.length)) + 'ms', label: 'Avg Time', color: '#FF6B6B', icon: '⏱️' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 20,
              padding: '20px 28px', minWidth: 120, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 32, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Coins earned - SHOW HOW MUCH THEY GAINED */}
        <div style={{
            background: earnedCoins > 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,255,255,0.08)', borderRadius: 50,
            padding: '14px 36px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: earnedCoins > 0 ? '0 8px 30px rgba(255,215,0,0.35)' : 'none',
            border: earnedCoins > 0 ? '3px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
            animation: 'mp-slideUp 0.6s ease-out 0.7s both' + (earnedCoins > 0 ? ', mp-glow 2s ease-in-out infinite' : ''),
          }}>
            <span style={{ fontSize: 32 }}>🪙</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 30, color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>+{earnedCoins}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.15)', padding: '4px 12px', borderRadius: 20 }}>
              {earnedCoins > 0 ? 'Coins Earned!' : 'Keep going!'}
            </span>
          </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 14, marginTop: 28, animation: 'mp-slideUp 0.6s ease-out 0.9s both' }}>
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
    );
  };

  return (
    <div className="memory-padlocks-game full-screen">
      <div className="mp-background-stars" />
      <Header totalCoins={headerTotalCoins} />

      {paused && renderPause()}
      {celebration && renderToast(celebration, 'celebrate')}
      {motivation && renderToast(motivation, 'motivate')}
      {gameOver && renderGameOver()}

      
      {!gameOver && (
        <div style={{ position: 'fixed', top: 76, right: 16, zIndex: 100, display: 'flex', gap: 10 }}>
          <button onClick={togglePause} style={{
            width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)',
            background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⏸</button>
        </div>
      )}

      {!gameOver && (
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
          {gameOver ? null : gameState === GAME_STATES.MEMORIZE ? (
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