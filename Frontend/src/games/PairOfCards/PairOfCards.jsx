import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PairOfCards.css';
import Header from "../../components/common/Header/Header";
import successSnd from "../../assets/Success.mp3";
import errorSnd from "../../assets/SoftFailSound.mp3";
import relaxGiraffe from "../../assets/relax-giraffe.png";

import { useNavigate } from "react-router-dom";

const ALL_EMOJIS = ['🔧','⛑️','🩺','🎸','🌮','🦁','🚀','🎨','🌵','🐙','🏆','🎯','🦋','🍕','🎲','🌈','🦊','🎻','🧩','🐳'];
const SESSION_DURATION = 90;
const CELEBRATION_MSGS = [
  { emoji: '⭐', text: 'Great match!', sub: 'Your memory is awesome!' },
  { emoji: '🎉', text: 'You found it!', sub: 'Amazing brain power!' },
  { emoji: '✨', text: 'Perfect!', sub: 'You are so smart!' },
  { emoji: '🌟', text: 'Wow!', sub: 'Keep up the great work!' },
  { emoji: '💫', text: 'Fantastic!', sub: 'You remembered that!' },
];
const MOTIVATION_MSGS = [
  { emoji: '💪', text: 'Try again!', sub: 'You are getting closer!' },
  { emoji: '🌈', text: 'Keep looking!', sub: 'You will find the match!' },
  { emoji: '🧠', text: 'Think hard!', sub: 'Your brain is working on it!' },
  { emoji: '⭐', text: 'So close!', sub: 'Every flip teaches your brain!' },
];

function getRoundConfig(r) {
  return { pairs: Math.min(3 + r, 10), previewTime: parseFloat(Math.max(4 - r * 0.4, 2).toFixed(1)) };
}
function shuffle(a) { 
  const b=[...a]; 
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  } 
  return b; 
}
function buildDeck(pairs) {
  const chosen = shuffle(ALL_EMOJIS).slice(0, pairs);
  return shuffle(chosen.flatMap((e,i) => [{ id:i*2, emoji:e, pairId:i, state:'preview' },{ id:i*2+1, emoji:e, pairId:i, state:'preview' }]));
}

export default function PairOfCards({ 
  onGameComplete, 
  startNewSession, 
  abandonSession, 
  navigateBack, 
  gameInfo,
  totalCoins: initialTotalCoins = 0 
}) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('game');
  const [roundIndex, setRoundIndex] = useState(0);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [locked, setLocked] = useState(false);
  const [previewLeft, setPreviewLeft] = useState(0);
  const [isPreview, setIsPreview] = useState(true);
  const [sessionLeft, setSessionLeft] = useState(SESSION_DURATION);
  const [totalMatched, setTotalMatched] = useState(0);
  const [roundMatches, setRoundMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [totalFlips, setTotalFlips] = useState(0); // Track total card flips
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [paused, setPaused] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [headerTotalCoins, setHeaderTotalCoins] = useState(initialTotalCoins);

  // Analytics refs
  const gameStartTime = useRef(Date.now());
  const totalPausedTime = useRef(0);
  const pauseStartTime = useRef(null);
  const responseTimes = useRef([]);
  const lastFlipTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const inactivityCount = useRef(0);
  const inactivityInterval = useRef(null);
  const gameFinished = useRef(false);
  const sessionRef = useRef(null);
  const previewRef = useRef(null);
  const roundIdxRef = useRef(0);
  const cardsRef = useRef([]);
  const audioUnlockedRef = useRef(false);
  const audioCtxRef = useRef(null);
  const totalMatchedRef = useRef(0);
  const movesRef = useRef(0);
  const totalFlipsRef = useRef(0);
  const roundIndexRef = useRef(0);
  const incorrectFlipsRef = useRef(0);

  cardsRef.current = cards;
  useEffect(()=>{totalMatchedRef.current=totalMatched;},[totalMatched]);
  useEffect(()=>{movesRef.current=moves;},[moves]);
  useEffect(()=>{totalFlipsRef.current=totalFlips;},[totalFlips]);
  useEffect(()=>{roundIndexRef.current=roundIndex;},[roundIndex]);

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
    const msg=CELEBRATION_MSGS[Math.floor(Math.random()*CELEBRATION_MSGS.length)]; 
    setCelebration(msg); 
    setTimeout(()=>setCelebration(null),1800); 
  };
  
  const showMotivation = () => { 
    const msg=MOTIVATION_MSGS[Math.floor(Math.random()*MOTIVATION_MSGS.length)]; 
    setMotivation(msg); 
    setTimeout(()=>setMotivation(null),1800); 
  };

  useEffect(() => {
    inactivityInterval.current = setInterval(() => {
      if (paused || screen === 'gameover' || isPreview) return;
      if (Date.now() - lastActivityTime.current > 10000) { 
        inactivityCount.current++; 
        lastActivityTime.current = Date.now(); 
      }
    }, 5000);
    return () => clearInterval(inactivityInterval.current);
  }, [paused, screen, isPreview]);

  const togglePause = () => {
    if (screen === 'gameover') return;
    if (paused) {
      if (pauseStartTime.current) { 
        totalPausedTime.current += Date.now() - pauseStartTime.current; 
        pauseStartTime.current = null; 
      }
      lastActivityTime.current = Date.now(); 
      lastFlipTime.current = Date.now(); 
      setPaused(false);
    } else { 
      pauseStartTime.current = Date.now(); 
      setPaused(true); 
    }
  };


  useEffect(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const h = () => { 
      audioUnlockedRef.current = true; 
      if(audioCtxRef.current?.state==='suspended') audioCtxRef.current.resume().catch(()=>{}); 
    };
    window.addEventListener('click', h); 
    window.addEventListener('touchstart', h);
    return () => { 
      window.removeEventListener('click', h); 
      window.removeEventListener('touchstart', h); 
      if(audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close(); 
      }
    };
  }, []);

  const playSound = useCallback((src, vol=0.5, rate=1) => { 
    if(!audioUnlockedRef.current) return; 
    const a=new Audio(src); 
    a.volume=vol; 
    a.playbackRate=rate; 
    a.play().catch(()=>{}); 
  }, []);
  
  const playCorrectSound = () => playSound(successSnd, 0.52, 1);
  const playWrongSound = () => playSound(errorSnd, 0.45, 1);
  const playLevelCompleteSound = () => playSound(successSnd, 0.7, 1.2);

  const buildRound = useCallback((idx) => {
    const { pairs, previewTime } = getRoundConfig(idx);
    setCards(buildDeck(pairs)); 
    setFlipped([]); 
    setWrongPair([]);
    setLocked(true); 
    setIsPreview(true); 
    setPreviewLeft(Math.ceil(previewTime));
    setRoundMatches(0); 
    setMoves(0); 
    setScreen('game'); 
    roundIdxRef.current = idx;
    clearInterval(previewRef.current);
    const totalMs = previewTime * 1000, start = Date.now();
    previewRef.current = setInterval(() => {
      const rem = Math.ceil((totalMs - (Date.now() - start)) / 1000);
      if (rem <= 0) {
        clearInterval(previewRef.current);
        playSound(errorSnd, 0.28, 1.35);
        setCards(p => p.map(c => ({...c, state: 'hidden'}))); 
        setIsPreview(false); 
        setLocked(false);
        lastFlipTime.current = Date.now();
        lastActivityTime.current = Date.now();
      } else setPreviewLeft(rem);
    }, 200);
  }, []);

  useEffect(() => { buildRound(0); }, []);

  useEffect(() => {
    if (paused || screen === 'gameover') return;
    sessionRef.current = setInterval(() => {
      setSessionLeft(t => { 
        if (t <= 1) { 
          clearInterval(sessionRef.current); 
          clearInterval(previewRef.current); 
          endGame(); 
          return 0; 
        } 
        return t - 1; 
      });
    }, 1000);
    return () => clearInterval(sessionRef.current);
  }, [paused, screen]);

  const endGame = async () => {
    if (gameFinished.current) return;
    gameFinished.current = true;
    clearInterval(inactivityInterval.current);
    setScreen('gameover');

    const dur = Math.round((Date.now() - gameStartTime.current - totalPausedTime.current) / 1000);
    const matched = totalMatchedRef.current;
    const flips = totalFlipsRef.current; 
    
    const totalMoves = Math.ceil(flips / 2);
    
    const accuracy = totalMoves > 0 ? Math.min(Math.round((matched / totalMoves) * 100), 100) : 0;
    const score = accuracy;
    
    const incorrectAttempts = Math.max(totalMoves - matched, 0);
    
    const rts = responseTimes.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a,b) => a+b, 0) / rts.length) : 0;
    
    let rtVar = 0;
    if (rts.length > 1) { 
      const mean = rts.reduce((a,b) => a+b, 0) / rts.length;
      const sq = rts.map(v => Math.pow(v - mean, 2)); 
      rtVar = Math.round(Math.sqrt(sq.reduce((a,b) => a+b, 0) / rts.length)); 
    }

    if (onGameComplete) {
      const result = await onGameComplete({
        score,
        duration: Math.max(dur, 1),
        accuracy,
        incorrectAttempts: incorrectAttempts,
        totalAttempts: Math.max(totalMoves, 1), 
        avgResponseTime: avgRT,
        responseTimeVariability: rtVar,
        inactivityEvents: inactivityCount.current,
      });
      
      if (result?.coinsEarned) { 
        setEarnedCoins(result.coinsEarned); 
        setShowCoinReward(true);
        
        if (result.totalCoins) {
          setHeaderTotalCoins(result.totalCoins);
        }
      }
    }
  };

  const handleCardClick = useCallback((idx) => {
    if (locked || isPreview || paused) return;
    const card = cardsRef.current[idx];
    if (card.state !== 'hidden' || flipped.includes(idx) || flipped.length >= 2) return;
    
    audioUnlockedRef.current = true;
    lastActivityTime.current = Date.now();

    setTotalFlips(prev => prev + 1);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setCards(p => p.map((c,i) => i===idx ? {...c, state:'flipped'} : c));

    if (newFlipped.length === 2) {
      const now = Date.now();
      const rt = now - lastFlipTime.current;
      if (rt >= 100 && rt <= 60000) {
        responseTimes.current.push(rt);
      }
      lastFlipTime.current = now;

      setLocked(true); 
      setMoves(m => m + 1);
      const [a,b] = newFlipped;
      
      setTimeout(() => {
        if (cardsRef.current[a].emoji === cardsRef.current[b].emoji) {
          playCorrectSound();
          showCelebration();
          setCards(p => p.map((c,i) => i===a||i===b ? {...c,state:'matched'} : c));
          setRoundMatches(rm => {
            const nr = rm+1;
            setTotalMatched(tm => tm+1);
            if (nr === getRoundConfig(roundIdxRef.current).pairs) {
              playLevelCompleteSound();
              setTimeout(() => { 
                setScreen('flash'); 
                setTimeout(() => { 
                  const ni=roundIdxRef.current+1; 
                  setRoundIndex(ni); 
                  buildRound(ni); 
                }, 1800); 
              }, 800);
            }
            return nr;
          });
          setFlipped([]); 
          setLocked(false);
        } else {
          incorrectFlipsRef.current += 1;
          playWrongSound();
          showMotivation();
          setWrongPair([a,b]);
          setTimeout(() => { 
            setCards(p => p.map((c,i) => i===a||i===b ? {...c,state:'hidden'} : c)); 
            setWrongPair([]); 
            setFlipped([]); 
            setLocked(false); 
          }, 900);
        }
      }, 50);
    }
  }, [locked, isPreview, flipped, paused, buildRound]);

  const resetGame = async () => {
    gameFinished.current = false;
    if (startNewSession) await startNewSession();
    gameStartTime.current = Date.now(); 
    totalPausedTime.current=0; 
    pauseStartTime.current=null;
    responseTimes.current=[]; 
    inactivityCount.current=0; 
    incorrectFlipsRef.current = 0;
    lastActivityTime.current=Date.now(); 
    lastFlipTime.current=Date.now();
    setTotalMatched(0); 
    setMoves(0); 
    setTotalFlips(0);
    setRoundIndex(0); 
    setSessionLeft(SESSION_DURATION);
    setEarnedCoins(0); 
    setPaused(false); 
    setCelebration(null); 
    setMotivation(null);
    buildRound(0);
  };

  const goBack = () => {
    const totalMoves = Math.ceil((totalFlips || 1) / 2);
    const accuracy = totalMoves > 0 ? Math.min(Math.round((totalMatched / totalMoves) * 100), 100) : 0;
    navigateBack?.({ score: accuracy }, earnedCoins);
  };

  const sessionPct = (sessionLeft / SESSION_DURATION) * 100;
  const timerColor = sessionLeft > 30 ? '#F5B731' : sessionLeft > 10 ? '#FF8C42' : '#E05C6A';
  const { pairs } = getRoundConfig(roundIndex);
  const useThreeCols = pairs > 4;
  
  const totalMovesCurrent = Math.max(Math.ceil(totalFlips / 2), 1);
  const accuracy = Math.min(Math.round((totalMatched / totalMovesCurrent) * 100), 100);
  
  const goEmoji = accuracy >= 80 ? '🏆' : accuracy >= 50 ? '😊' : '😅';
  const goTitle = accuracy >= 80 ? 'Incredible memory!' : accuracy >= 50 ? 'Nice work!' : 'Keep practicing!';

  useEffect(()=>{
    if(showCoinReward){
      const t=setTimeout(()=>setShowCoinReward(false),2000);
      return()=>clearTimeout(t);
    }
  }, [showCoinReward]);

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
              <span className="fn-pause-stat-value">{totalMatched}</span>
              <span className="fn-pause-stat-label">Matched</span>
            </div>
            <div className="fn-pause-stat">
              <span className="fn-pause-stat-value">{roundIndex + 1}</span>
              <span className="fn-pause-stat-label">Round</span>
            </div>
            <div className="fn-pause-stat">
              <span className="fn-pause-stat-value">{Math.floor(sessionLeft / 60)}:{(sessionLeft % 60).toString().padStart(2, '0')}</span>
              <span className="fn-pause-stat-label">Time Left</span>
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
    <div className="poc-game-wrapper">
      <Header totalCoins={headerTotalCoins} />
      <div className="stars-bg" />
      <div className="poc-stars-bg"></div>
      {paused && renderPause()}
      {celebration && (
        <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', zIndex:10000, pointerEvents:'none' }}>
          <style>{`@keyframes poc-toastAnim{0%{opacity:0;transform:translateX(-50%) scale(0.5)}15%{opacity:1;transform:translateX(-50%) scale(1.1)}25%{transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-30px)}}`}</style>
          <div style={{ animation:'poc-toastAnim 1.8s ease forwards', background:'linear-gradient(135deg,#FFD700,#FFA500)', padding:'16px 32px', borderRadius:24, display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 30px rgba(255,215,0,0.5)', border:'2px solid rgba(255,255,255,0.5)' }}>
            <span style={{ fontSize:36 }}>{celebration.emoji}</span>
            <div><div style={{ fontFamily:"'Fredoka One', cursive", fontSize:20, color:'#fff' }}>{celebration.text}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{celebration.sub}</div></div>
          </div>
        </div>
      )}
      {motivation && (
        <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', zIndex:10000, pointerEvents:'none' }}>
          <style>{`@keyframes poc-motAnim{0%{opacity:0;transform:translateX(-50%) scale(0.5)}15%{opacity:1;transform:translateX(-50%) scale(1.1)}25%{transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-30px)}}`}</style>
          <div style={{ animation:'poc-motAnim 1.8s ease forwards', background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'16px 32px', borderRadius:24, display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 30px rgba(118,75,162,0.5)', border:'2px solid rgba(255,255,255,0.5)' }}>
            <span style={{ fontSize:36 }}>{motivation.emoji}</span>
            <div><div style={{ fontFamily:"'Fredoka One', cursive", fontSize:20, color:'#fff' }}>{motivation.text}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{motivation.sub}</div></div>
          </div>
        </div>
      )}
      {showCoinReward && (
        <div className="poc-coin-reward-animation">
          <span className="poc-coin-emoji">🪙</span>
          <span className="poc-coin-amount">+{earnedCoins}</span>
        </div>
      )}

      {screen !== "gameover" && screen !== "intro" && screen !== "countdown" && (
          <button onClick={togglePause} className="fn-pause-btn">
            ⏸
          </button>
        )}

      {screen !== 'gameover' && (
        <div className="poc-session-bar">
          <div className="poc-session-fill" style={{ width:`${sessionPct}%`, background:timerColor }} />
        </div>
      )}

      {(screen === 'game' || screen === 'flash') && (
        <>
          <div className="poc-phase">
              {isPreview ? (
                <>
                  Memorize the cards! 
                  <span className="poc-preview-timer"> ({previewLeft}s)</span>
                </>
              ) : (
                'Match the pairs'
              )}
            </div>
          <div className="poc-score-row">
            <div className="poc-score-pill">Matched <span className="poc-score-value">{roundMatches}/{pairs}</span></div>
            <div className="poc-score-pill">Flips <span className="poc-score-value">{totalFlips}</span></div>
            <div className="poc-score-pill">Accuracy <span className="poc-score-value">
              {Math.ceil(totalFlips / 2) > 0 ? Math.min(Math.round((totalMatched / Math.max(Math.ceil(totalFlips / 2), 1)) * 100), 100) : 0}%
            </span></div>
          </div>
          <div className={`poc-grid${useThreeCols ? ' poc-cols3' : ''}`}>
            {cards.map((card, idx) => {
              const isFlipped = card.state==='flipped'||card.state==='matched'||card.state==='preview';
              const isMatched = card.state==='matched';
              const isWrong = wrongPair.includes(idx);
              return (
                <div key={card.id}
                  className={['poc-card', isFlipped?'poc-flipped':'', isMatched?'poc-matched':'', isWrong?'poc-wrong-shake':'', (locked&&!isMatched)?'poc-no-click':''].join(' ').trim()}
                  onClick={() => handleCardClick(idx)}
                  style={{}}
                >
                  <div className="poc-card-inner">
                    <div className="poc-card-back">?</div>
                    <div className="poc-card-front">{card.emoji}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {screen === 'flash' && (
        <div className="poc-flash">
          <div className="poc-flash-emoji">⭐</div>
          <div className="poc-flash-text">Round cleared!</div>
          <div className="poc-flash-sub">Get ready for more cards…</div>
        </div>
      )}

        {screen === "gameover" && (() => {
          const rounds = roundIndex + 1;
          const goEm = accuracy>=80?"🧠":accuracy>=60?"🏆":accuracy>=40?"⭐":"💪";
          const goTi = accuracy>=80?"Brilliant Memory!":accuracy>=60?"Great Job!":accuracy>=40?"Good Try!":"Great Effort!";
          const goSu = accuracy>=80?"You are a memory superstar!":accuracy>=60?"Your brain is getting stronger!":accuracy>=40?"Every round makes you better!":"You showed up and tried — that's what matters!";
          const bgGrad = 'linear-gradient(135deg, #8BE3D8, #6BC5B8)';
          
          const coinsEarned = earnedCoins || 0;
          
          return (
            <div className="fn-gameover-screen">
              <div className="fn-gameover-content">
                <div className="fn-go-emoji" style={{marginTop: "0px", marginBottom: "-40px"}}>{goEm}</div>
                <h1 className="fn-go-title">{goTi}</h1>
                <p className="fn-go-sub">{goSu}</p>
                
                <div className="fn-stats-grid">
                  <div className="fn-stat-item">
                    <div className="fn-stat-icon">✔️</div>
                    <div className="fn-stat-value">{totalMatched}</div>
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
                
                <div style={{ display: 'flex', gap: 14, marginTop: 28, justifyContent: 'center' }}>
                  <button onClick={resetGame} style={{
                    padding: '16px 40px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg, #00a896, #00d4aa)', color: '#fff',
                    fontSize: 18, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(0,168,150,0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}>🔄 Play Again</button>
                  <button onClick={goBack} style={{
                    padding: '16px 40px', borderRadius: 50,
                    border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 600, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                  }}>← Back</button>
                </div>
                
              </div>
            </div>
          );
        })()}
    </div>
  );
}