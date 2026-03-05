import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PairOfCards.css';
import Header from "../../components/common/Header/Header";
import successSnd from "../../assets/Success.mp3";
import errorSnd from "../../assets/SoftFailSound.mp3";
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
      if(audioCtxRef.current) audioCtxRef.current.close(); 
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
    // NOTE: Do NOT reset totalFlips or totalMatched here — they are session-wide
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
    const flips = totalFlipsRef.current; // Total individual card flips across all rounds
    
    // Each move = flipping 2 cards. Total moves = flips / 2 (approx, rounded up for odd flips)
    const totalMoves = Math.ceil(flips / 2);
    
    // accuracy = (matched pairs / total moves) × 100
    const accuracy = totalMoves > 0 ? Math.min(Math.round((matched / totalMoves) * 100), 100) : 0;
    const score = accuracy;
    
    // incorrect_attempts = total moves - matched pairs
    const incorrectAttempts = Math.max(totalMoves - matched, 0);
    
    // Calculate average response time (between consecutive moves)
    const rts = responseTimes.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a,b) => a+b, 0) / rts.length) : 0;
    
    // Calculate response time variability (standard deviation)
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
        totalAttempts: Math.max(totalMoves, 1), // Total moves (2-card flips), not individual flips
        avgResponseTime: avgRT,
        responseTimeVariability: rtVar,
        inactivityEvents: inactivityCount.current,
      });
      
      if (result?.coinsEarned) { 
        setEarnedCoins(result.coinsEarned); 
        setShowCoinReward(true);
        
        // Update header coins
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

    // Increment total flips counter (individual card flips across all rounds)
    setTotalFlips(prev => prev + 1);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setCards(p => p.map((c,i) => i===idx ? {...c, state:'flipped'} : c));

    if (newFlipped.length === 2) {
      // Record response time per move (2-card flip = 1 move)
      const now = Date.now();
      const rt = now - lastFlipTime.current;
      // Only record meaningful response times (100ms - 60s)
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
          // Count this as one incorrect move
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
  
  // Calculate accuracy based on moves (matched pairs / total moves)
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
    <div style={{ position:'fixed', inset:0, zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(10,10,30,0.92)', backdropFilter:'blur(16px)' }}>
      <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:28, padding:'48px 44px', textAlign:'center', maxWidth:380, width:'90%', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:56, marginBottom:8 }}>⏸️</div>
        <h2 style={{ color:'#fff', fontSize:26, fontWeight:700, margin:'0 0 6px' }}>Paused</h2>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:'0 0 28px' }}>Take your time — you are doing great!</p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:24 }}>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 20px', minWidth:75 }}>
            <div style={{ color:'#00e5bf', fontSize:22, fontWeight:700 }}>{totalMatched}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:4 }}>Matched</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 20px', minWidth:75 }}>
            <div style={{ color:'#f5b731', fontSize:22, fontWeight:700 }}>R{roundIndex+1}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:4 }}>Round</div>
          </div>
        </div>
        <button onClick={togglePause} style={{ width:'100%', padding:16, borderRadius:16, border:'none', background:'linear-gradient(135deg,#00a896,#00d4aa)', color:'#fff', fontSize:18, fontWeight:700, cursor:'pointer', marginBottom:12 }}>▶ Resume</button>
        <button onClick={async () => { if (abandonSession) await abandonSession(); navigate('/challenges'); }} style={{ width:'100%', padding:14, borderRadius:16, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:14, cursor:'pointer' }}>Quit to Challenges</button>
      </div>
    </div>
  );

  return (
    <div className="poc-game-wrapper">
      <Header totalCoins={headerTotalCoins} />
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

      {screen !== 'gameover' && (
        <div style={{ position:'fixed', top:76, right:16, zIndex:100, display:'flex', gap:10 }}>
          <button onClick={togglePause} style={{ width:44, height:44, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.25)', background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>⏸</button>
        </div>
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

      {screen === 'gameover' && (() => {
        const rounds = roundIndex + 1;
        const emoji = accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : accuracy >= 30 ? '😊' : '💪';
        const title = accuracy >= 80 ? 'Memory Champion!' : accuracy >= 50 ? 'Sharp Memory!' : accuracy >= 30 ? 'Great Effort!' : 'Awesome Try!';
        const subtitle = accuracy >= 80 ? 'Your brain is on fire!' : accuracy >= 50 ? 'You are building amazing memory skills!' : accuracy >= 30 ? 'Every game makes you better!' : 'You showed up and tried — that takes real courage!';
        const bgGrad = accuracy >= 60 ? 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' : 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)';
        
        // Calculate final stats for display using moves
        const totalMoves = Math.max(Math.ceil(totalFlips / 2), 1);
        const finalAccuracy = Math.min(Math.round((totalMatched / totalMoves) * 100), 100);
        const incorrectMoves = Math.max(totalMoves - totalMatched, 0);
        
        return (
          <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:bgGrad, overflow:'hidden' }}>
            <style>{`
              @keyframes poc-trophy{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(1) rotate(0deg)}}
              @keyframes poc-slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
              @keyframes poc-glow{0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)}50%{box-shadow:0 0 40px rgba(255,215,0,0.6)}}
              @keyframes poc-conf{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
              .poc-cf{position:absolute;border-radius:2px;animation:poc-conf linear forwards;pointer-events:none}
            `}</style>
            {totalMatched >= 2 && Array.from({length:25}).map((_,i) => (
              <div key={i} className="poc-cf" style={{ left:`${Math.random()*100}%`, top:`-${Math.random()*20}%`, background:['#FFD700','#FF6B6B','#4ECDC4','#A78BFA','#F5B731','#00E5BF'][i%6], width:Math.random()*12+5, height:Math.random()*12+5, animationDuration:`${Math.random()*3+2}s`, animationDelay:`${Math.random()*2}s`, borderRadius:Math.random()>0.5?'50%':'2px' }} />
            ))}
            <div style={{ fontSize:100, animation:'poc-trophy 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards', filter:'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}>{emoji}</div>
            <h1 style={{ fontFamily:"'Fredoka One', cursive", fontSize:42, color:'#fff', textShadow:'0 4px 15px rgba(0,0,0,0.3)', margin:'16px 0 8px', animation:'poc-slideUp 0.6s ease-out 0.3s both' }}>{title}</h1>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.7)', fontWeight:600, animation:'poc-slideUp 0.6s ease-out 0.4s both', maxWidth:400, textAlign:'center', lineHeight:1.5 }}>{subtitle}</p>
            
            {/* Enhanced stats display with correct analytics */}
            <div style={{ display:'flex', gap:16, margin:'28px 0 20px', flexWrap:'wrap', justifyContent:'center', animation:'poc-slideUp 0.6s ease-out 0.5s both' }}>
              {[
                { value: totalMatched, label: 'Pairs', color: '#00E5BF', icon: '🃏' },
                { value: rounds, label: 'Rounds', color: '#F5B731', icon: '🔄' },
                { value: `${finalAccuracy}%`, label: 'Accuracy', color: '#A78BFA', icon: '🎯' },
                { value: incorrectMoves, label: 'Mistakes', color: '#FF6B6B', icon: '❌' },
                { value: Math.round(responseTimes.current.reduce((a,b)=>a+b,0)/Math.max(1,responseTimes.current.length)) + 'ms', label: 'Avg Time', color: '#FFA500', icon: '⏱️' }
              ].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'18px 24px', minWidth:110, textAlign:'center', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(10px)' }}>
                  <div style={{ fontSize:24 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:28, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:4, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                </div>
              ))}
            </div>
            
            {/* Coin reward display - SHOW HOW MUCH THEY GAINED */}
            <div style={{ 
              background: earnedCoins > 0 ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'rgba(255,255,255,0.08)', 
              borderRadius:50, 
              padding:'14px 36px', 
              display:'flex', 
              alignItems:'center', 
              gap:14, 
              boxShadow: earnedCoins > 0 ? '0 8px 30px rgba(255,215,0,0.35)' : 'none', 
              border: earnedCoins > 0 ? '3px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)', 
              animation:'poc-slideUp 0.6s ease-out 0.7s both' 
            }}>
              <span style={{ fontSize:32 }}>🪙</span>
              <span style={{ fontFamily:"'Fredoka One', cursive", fontSize:30, color:'#fff', textShadow:'2px 2px 0 rgba(0,0,0,0.2)' }}>+{earnedCoins}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', background:'rgba(0,0,0,0.15)', padding:'4px 12px', borderRadius:20 }}>
                {earnedCoins > 0 ? 'Coins Earned!' : 'Keep going!'}
              </span>
            </div>
            
            <div style={{ display:'flex', gap:14, marginTop:28, animation:'poc-slideUp 0.6s ease-out 0.9s both' }}>
              <button onClick={resetGame} onMouseEnter={e=>e.target.style.transform='translateY(-3px)'} onMouseLeave={e=>e.target.style.transform='translateY(0)'} style={{ padding:'16px 40px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#00a896,#00d4aa)', color:'#fff', fontSize:18, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 25px rgba(0,168,150,0.4)', transition:'transform 0.2s' }}>🔄 Play Again</button>
              <button onClick={goBack} onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.12)'} onMouseLeave={e=>e.target.style.background='rgba(255,255,255,0.06)'} style={{ padding:'16px 40px', borderRadius:50, border:'2px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.8)', fontSize:18, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>← Back</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}