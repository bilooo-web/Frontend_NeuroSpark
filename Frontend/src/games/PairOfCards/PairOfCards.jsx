import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PairOfCards.css';
import Header from "../../components/common/Header/Header";
import successSnd from "../../assets/Success.mp3";
import errorSnd from "../../assets/SoftFailSound.mp3";
import relaxGiraffe from "../../assets/relax-giraffe.png";
import mascotFox from "../../assets/mascot-fox.png";
import mascotFoxSleep from "../../assets/mascot-fox-sleep.png";
import mascotFoxCheer from "../../assets/mascot-fox-cheer.png";
import cardBack from "../../assets/card-back.png";

import { useNavigate } from "react-router-dom";

const ALL_EMOJIS = ['🦊','🐼','🐯','🐸','🦄','🐙','🐳','🦁','🐵','🐰','🐨','🐶','🐱','🐧','🦋','🐢','🦉','🐝','🦒','🐮'];
const SESSION_DURATION = 90;
const CELEBRATION_MSGS = [
  { emoji: '🌟', text: 'Magical!', sub: 'You did it, superstar!' },
  { emoji: '🎉', text: 'Yay!', sub: 'Brain power activated!' },
  { emoji: '✨', text: 'Sparkly!', sub: 'You are amazing!' },
  { emoji: '🦄', text: 'Wow!', sub: 'A perfect match!' },
  { emoji: '🍭', text: 'Sweet!', sub: 'Keep going hero!' },
];
const MOTIVATION_MSGS = [
  { emoji: '🤔', text: 'Almost!', sub: 'Try one more time!' },
  { emoji: '🌈', text: 'Keep going!', sub: 'You can do it!' },
  { emoji: '🧠', text: 'Think!', sub: 'Use your super memory!' },
  { emoji: '💪', text: 'So close!', sub: 'You are getting better!' },
];

function getRoundConfig(r) {
  // r is 0-based round index; convert to human-friendly round number.
  const round = r + 1;

  // Difficulty progression (pairs + preview time):
  // Preview time: 3 seconds for all rounds
  const previewTime = 3;

  // Rounds 1–2:   2 pairs →  4 cards
  // Rounds 3–4:   3 pairs →  6 cards
  // Rounds 5–6:   4 pairs →  8 cards
  // Rounds 7–8:   5 pairs → 10 cards
  // Rounds 9–10:  6 pairs → 12 cards
  // Rounds 11+:   7 pairs → 14 cards (max)
  if (round <= 2) return { pairs: 2, previewTime };
  if (round <= 4) return { pairs: 3, previewTime };
  if (round <= 6) return { pairs: 4, previewTime };
  if (round <= 8) return { pairs: 5, previewTime };
  if (round <= 10) return { pairs: 6, previewTime };
  return { pairs: 7, previewTime };
}
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function buildDeck(pairs) {
  const chosen = shuffle(ALL_EMOJIS).slice(0, pairs);
  return shuffle(chosen.flatMap((e, i) => [
    { id: i * 2,     emoji: e, pairId: i, state: 'preview' },
    { id: i * 2 + 1, emoji: e, pairId: i, state: 'preview' },
  ]));
}

/**
 * Picks a column count that grows HORIZONTALLY with the viewport,
 * so increasing pairs no longer stretches the board vertically.
 */
function useGridColumns(totalCards) {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      let max;
      if (w < 420) max = 4;
      else if (w < 640) max = 5;
      else if (w < 900) max = 6;
      else if (w < 1200) max = 8;
      else max = 10;

      // Prefer a clean "2-row" layout: pairs columns (since totalCards = pairs*2).
      // Example: round 1 (4 cards) => 2 columns => 2 cards per row.
      const pairs = Math.ceil(totalCards / 2);
      const desired = Math.max(2, pairs);
      setCols(Math.min(max, desired));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [totalCards]);
  return cols;
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
  const [totalFlips, setTotalFlips] = useState(0);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [paused, setPaused] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(null); // { x, y, key }
  const [headerTotalCoins, setHeaderTotalCoins] = useState(initialTotalCoins);

  // Analytics refs (UNCHANGED)
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
  const roundMatchesRef = useRef(0);
  const advancingRoundRef = useRef(false);
  const roundIndexRef = useRef(0);
  const incorrectFlipsRef = useRef(0);
  const completedRoundsRef = useRef(0);

  cardsRef.current = cards;
  useEffect(() => { roundIndexRef.current = roundIndex; }, [roundIndex]);
  useEffect(() => { roundMatchesRef.current = roundMatches; }, [roundMatches]);

  useEffect(() => {
    const handleCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) setHeaderTotalCoins(e.detail.totalCoins);
    };
    window.addEventListener('coins-updated', handleCoinsUpdated);
    return () => window.removeEventListener('coins-updated', handleCoinsUpdated);
  }, []);

  const showCelebration = () => {
    const msg = CELEBRATION_MSGS[Math.floor(Math.random() * CELEBRATION_MSGS.length)];
    setCelebration(msg);
    setTimeout(() => setCelebration(null), 1600);
  };
  const showMotivation = () => {
    const msg = MOTIVATION_MSGS[Math.floor(Math.random() * MOTIVATION_MSGS.length)];
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 1600);
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
        const pausedDuration = Date.now() - pauseStartTime.current;
        totalPausedTime.current += pausedDuration;
        lastFlipTime.current += pausedDuration;
        pauseStartTime.current = null;
      }
      lastActivityTime.current = Date.now();
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
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume().catch(() => {});
    };
    window.addEventListener('click', h);
    window.addEventListener('touchstart', h);
    return () => {
      window.removeEventListener('click', h);
      window.removeEventListener('touchstart', h);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
    };
  }, []);

  const playSound = useCallback((src, vol = 0.5, rate = 1) => {
    if (!audioUnlockedRef.current) return;
    const a = new Audio(src);
    a.volume = vol;
    a.playbackRate = rate;
    a.play().catch(() => {});
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
    roundMatchesRef.current = 0;
    advancingRoundRef.current = false;
    setMoves(0);
    setStreak(0);
    setScreen('game');
    roundIdxRef.current = idx;
    clearInterval(previewRef.current);
    const totalMs = previewTime * 1000, start = Date.now();
    previewRef.current = setInterval(() => {
      const rem = Math.ceil((totalMs - (Date.now() - start)) / 1000);
      if (rem <= 0) {
        clearInterval(previewRef.current);
        playSound(errorSnd, 0.28, 1.35);
        setCards(p => p.map(c => ({ ...c, state: 'hidden' })));
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

    const completed = completedRoundsRef.current;
    const accuracyBase = Math.round(accuracy * 0.6);
    const progressionBonus = Math.min(completed * 5, 30);
    const efficiencyBonus = accuracy >= 80 ? 10 : 0;
    const score = Math.min(accuracyBase + progressionBonus + efficiencyBonus, 100);

    const incorrectAttempts = Math.max(totalMoves - matched, 0);
    const rts = responseTimes.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    let rtVar = 0;
    if (rts.length > 1) {
      const mean = rts.reduce((a, b) => a + b, 0) / rts.length;
      const sq = rts.map(v => Math.pow(v - mean, 2));
      rtVar = Math.round(Math.sqrt(sq.reduce((a, b) => a + b, 0) / (rts.length - 1)));
    }

    if (onGameComplete) {
      const result = await onGameComplete({
        score,
        duration: Math.max(dur, 1),
        accuracy,
        incorrectAttempts,
        totalAttempts: Math.max(totalMoves, 1),
        avgResponseTime: avgRT,
        responseTimeVariability: rtVar,
        inactivityEvents: inactivityCount.current,
      });
      if (result?.coinsEarned) {
        setEarnedCoins(result.coinsEarned);
        setShowCoinReward(true);
        if (result.totalCoins) setHeaderTotalCoins(result.totalCoins);
      }
    }
  };

  const handleCardClick = useCallback((idx, ev) => {
    if (locked || isPreview || paused) return;
    const card = cardsRef.current[idx];
    if (card.state !== 'hidden' || flipped.includes(idx) || flipped.length >= 2) return;

    audioUnlockedRef.current = true;
    lastActivityTime.current = Date.now();

    totalFlipsRef.current += 1;
    setTotalFlips(prev => prev + 1);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setCards(p => p.map((c, i) => i === idx ? { ...c, state: 'flipped' } : c));

    if (newFlipped.length === 2) {
      const now = Date.now();
      const rt = now - lastFlipTime.current;
      if (rt >= 500 && rt <= 60000) responseTimes.current.push(rt);
      lastFlipTime.current = now;

      movesRef.current += 1;
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newFlipped;

        setTimeout(() => {
          if (cardsRef.current[a].emoji === cardsRef.current[b].emoji) {
            totalMatchedRef.current += 1;
            playCorrectSound();
            showCelebration();
            // particle burst at click position
            if (ev) setBurst({ x: ev.clientX, y: ev.clientY, key: Date.now() });
            setStreak(s => s + 1);
            setCards(p => p.map((c, i) => i === a || i === b ? { ...c, state: 'matched' } : c));

            const nextMatches = roundMatchesRef.current + 1;
            roundMatchesRef.current = nextMatches;
            setRoundMatches(nextMatches);
            setTotalMatched(tm => tm + 1);

            if (
              nextMatches === getRoundConfig(roundIdxRef.current).pairs &&
              !advancingRoundRef.current
            ) {
              advancingRoundRef.current = true;
              completedRoundsRef.current += 1;
              playLevelCompleteSound();
              setTimeout(() => {
                setScreen('flash');
                setTimeout(() => {
                  const ni = roundIdxRef.current + 1;
                  setRoundIndex(ni);
                  buildRound(ni);
                }, 1800);
              }, 800);
            }
            setFlipped([]);
            setLocked(false);
          } else {
          incorrectFlipsRef.current += 1;
          playWrongSound();
          showMotivation();
          setStreak(0);
          setWrongPair([a, b]);
          setTimeout(() => {
            setCards(p => p.map((c, i) => i === a || i === b ? { ...c, state: 'hidden' } : c));
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
    totalPausedTime.current = 0;
    pauseStartTime.current = null;
    responseTimes.current = [];
    inactivityCount.current = 0;
    incorrectFlipsRef.current = 0;
    completedRoundsRef.current = 0;
    totalMatchedRef.current = 0;
    totalFlipsRef.current = 0;
    movesRef.current = 0;
    lastActivityTime.current = Date.now();
    lastFlipTime.current = Date.now();
    setTotalMatched(0);
    setMoves(0);
    setTotalFlips(0);
    setRoundIndex(0);
    setSessionLeft(SESSION_DURATION);
    setEarnedCoins(0);
    setPaused(false);
    setCelebration(null);
    setMotivation(null);
    setStreak(0);
    buildRound(0);
  };

  const goBack = () => {
    const flips = totalFlipsRef.current;
    const matched = totalMatchedRef.current;
    const totalMoves = Math.ceil((flips || 1) / 2);
    const acc = totalMoves > 0 ? Math.min(Math.round((matched / totalMoves) * 100), 100) : 0;
    const completed = completedRoundsRef.current;
    const accuracyBase = Math.round(acc * 0.6);
    const progressionBonus = Math.min(completed * 5, 30);
    const efficiencyBonus = acc >= 80 ? 10 : 0;
    const score = Math.min(accuracyBase + progressionBonus + efficiencyBonus, 100);
    navigateBack?.({ score }, earnedCoins);
  };

  const sessionPct = (sessionLeft / SESSION_DURATION) * 100;
  const timerColor = sessionLeft > 30 ? '#FFB347' : sessionLeft > 10 ? '#FF8C42' : '#FF6B8A';
  const { pairs } = getRoundConfig(roundIndex);

  const cols = useGridColumns(cards.length || pairs * 2);

  const totalMovesCurrent = Math.max(Math.ceil(totalFlips / 2), 1);
  const accuracy = Math.min(Math.round((totalMatched / totalMovesCurrent) * 100), 100);

  const goEmoji = accuracy >= 80 ? mascotFoxCheer : accuracy >= 50 ? mascotFox : mascotFoxSleep;
  const goTitle = accuracy >= 80 ? 'Memory Champion!' : accuracy >= 50 ? 'Great Job!' : 'Keep Practicing!';
  const goSub   = accuracy >= 80 ? 'You are a memory superstar!' : accuracy >= 50 ? 'Your brain is getting stronger!' : 'Every round makes you smarter!';

  // mascot mood
  const mascotImg = paused ? mascotFoxSleep : streak >= 2 ? mascotFoxCheer : mascotFox;
  const mascot = <img src={mascotImg} alt="Fox mascot" className="poc-mascot-img" />;

  useEffect(() => {
    if (showCoinReward) {
      const t = setTimeout(() => setShowCoinReward(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showCoinReward]);

  // clear burst after animation
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 900);
    return () => clearTimeout(t);
  }, [burst]);

  const renderPause = () => (
    <div className="fn-pause-overlay">
      <div className="fn-pause-card">
        <div className="fn-pause-icon">
          <img src={relaxGiraffe} alt="Relaxing giraffe"
               style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
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
            <span className="fn-pause-stat-value">
              {Math.floor(sessionLeft / 60)}:{(sessionLeft % 60).toString().padStart(2, '0')}
            </span>
            <span className="fn-pause-stat-label">Time Left</span>
          </div>
        </div>

        <button className="fn-pause-resume-btn" onClick={togglePause}>▶ Resume Game</button>
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

      {/* Floating background shapes */}
      <div className="poc-sky-bg" aria-hidden="true">
        <div className="poc-cloud poc-cloud-1">☁️</div>
        <div className="poc-cloud poc-cloud-2">☁️</div>
        <div className="poc-cloud poc-cloud-3">☁️</div>
        <div className="poc-sparkle poc-sparkle-1">✨</div>
        <div className="poc-sparkle poc-sparkle-2">⭐</div>
        <div className="poc-sparkle poc-sparkle-3">💫</div>
        <div className="poc-sparkle poc-sparkle-4">✨</div>
        <div className="poc-balloon poc-balloon-1">🎈</div>
        <div className="poc-balloon poc-balloon-2">🎈</div>
        <div className="poc-geo-shape poc-geo-1" />
        <div className="poc-geo-shape poc-geo-2" />
        <div className="poc-geo-shape poc-geo-3" />
        <div className="poc-geo-shape poc-geo-4" />
        <div className="poc-geo-shape poc-geo-5" />
        <div className="poc-geo-shape poc-geo-6" />
      </div>

      {paused && renderPause()}

      {celebration && (
        <div className="poc-toast poc-toast-good">
          <span className="poc-toast-emoji">{celebration.emoji}</span>
          <div>
            <div className="poc-toast-title">{celebration.text}</div>
            <div className="poc-toast-sub">{celebration.sub}</div>
          </div>
        </div>
      )}
      {motivation && (
        <div className="poc-toast poc-toast-mot">
          <span className="poc-toast-emoji">{motivation.emoji}</span>
          <div>
            <div className="poc-toast-title">{motivation.text}</div>
            <div className="poc-toast-sub">{motivation.sub}</div>
          </div>
        </div>
      )}

      {burst && (
        <div className="poc-burst" style={{ left: burst.x, top: burst.y }} key={burst.key}>
          {['🌟','✨','💖','🎉','⭐','💫'].map((e, i) => (
            <span key={i} className={`poc-burst-piece poc-burst-${i}`}>{e}</span>
          ))}
        </div>
      )}

      {showCoinReward && (
        <div className="poc-coin-reward-animation">
          <span className="poc-coin-emoji">🪙</span>
          <span className="poc-coin-amount">+{earnedCoins}</span>
        </div>
      )}

      {screen !== "gameover" && screen !== "intro" && screen !== "countdown" && (
        <button onClick={togglePause} className="fn-pause-btn">⏸</button>
      )}

      {screen !== 'gameover' && (
        <div className="poc-session-bar">
          <div className="poc-session-fill" style={{ width: `${sessionPct}%`, background: timerColor }} />
        </div>
      )}

      {(screen === 'game' || screen === 'flash') && (
        <>
          {/* Mascot + speech bubble */}
          <div className="poc-mascot-row">
            <div className={`poc-mascot ${isPreview ? 'poc-mascot-peek' : 'poc-mascot-bob'}`}>{mascot}</div>
            <div className="poc-bubble">
              {isPreview ? (
                <>Memorize the cards! <b>{previewLeft}s</b></>
              ) : streak >= 3 ? (
                <>🔥 {streak} in a row! Keep going!</>
              ) : (
                <>Pick two cards!</>
              )}
            </div>
          </div>

          {/* <div className="poc-score-row">
            <div className="poc-score-pill">
              <span className="poc-pill-icon">🎯</span>
              <span className="poc-pill-label">Matched</span>
              <span className="poc-pill-value">{roundMatches}/{pairs}</span>
            </div>
            <div className="poc-score-pill">
              <span className="poc-pill-icon">👆</span>
              <span className="poc-pill-label">Flips</span>
              <span className="poc-pill-value">{totalFlips}</span>
            </div>
            <div className="poc-score-pill">
              <span className="poc-pill-icon">⭐</span>
              <span className="poc-pill-label">Round</span>
              <span className="poc-pill-value">{roundIndex + 1}</span>
            </div>
          </div> */}

          <div className="poc-grid"
               style={{ gridTemplateColumns: `repeat(${cols}, minmax(var(--poc-card-min), var(--poc-card-max)))` }}>
            {cards.map((card, idx) => {
              const isFlipped = card.state === 'flipped' || card.state === 'matched' || card.state === 'preview';
              const isMatched = card.state === 'matched';
              const isWrong = wrongPair.includes(idx);
              const cardColors = ['#FF8EC3','#FFD84D','#4ECDC4','#58C8F5','#A78BFA','#FF9F68'];
              const bgColor = cardColors[idx % cardColors.length];
              return (
                <button
                  type="button"
                  key={card.id}
                  className={[
                    'poc-card',
                    isFlipped ? 'poc-flipped' : '',
                    isMatched ? 'poc-matched' : '',
                    isWrong ? 'poc-wrong-shake' : '',
                    (locked && !isMatched) ? 'poc-no-click' : '',
                  ].join(' ').trim()}
                  onClick={(e) => handleCardClick(idx, e)}
                  aria-label={isFlipped ? `Card ${card.emoji}` : 'Hidden card'}
                  style={{ '--card-bg': bgColor }}
                >
                  <div className="poc-card-inner">
                    <div className="poc-card-back">
                      <img src={cardBack} alt="" className="poc-back-img" />
                    </div>
                    <div className="poc-card-front">
                      <span className="poc-front-emoji">{card.emoji}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {screen === 'flash' && (
        <div className="poc-flash">
          <div className="poc-flash-emoji">🎉</div>
          <div className="poc-flash-text">Round Complete!</div>
          <div className="poc-flash-sub">Get ready for more friends…</div>
          <div className="poc-flash-confetti">
            {['🎊','🌈','⭐','💫','🎈','✨'].map((e, i) => (
              <span key={i} className={`poc-flash-c poc-flash-c-${i}`}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {screen === "gameover" && (() => {
        const rounds = roundIndex + 1;
        return (
          <div className="fn-gameover-screen">
            <div className="fn-gameover-content">
              <div className="poc-go-mascot">
                <img src={goEmoji} alt="mascot" className="poc-go-mascot-img" />
              </div>
              <h1 className="fn-go-title">{goTitle}</h1>
              <p className="fn-go-sub">{goSub}</p>

              <div className="fn-stats-grid">
                <div className="fn-stat-item fn-stat-yellow">
                  <div className="fn-stat-icon">❤️</div>
                  <div className="fn-stat-value">{totalMatched}</div>
                  <div className="fn-stat-label">PAIRS</div>
                </div>
                <div className="fn-stat-item fn-stat-teal">
                  <div className="fn-stat-icon">🎮</div>
                  <div className="fn-stat-value">{rounds}</div>
                  <div className="fn-stat-label">ROUNDS</div>
                </div>
                <div className="fn-stat-item fn-stat-blue">
                  <div className="fn-stat-icon">🎯</div>
                  <div className="fn-stat-value">{accuracy}%</div>
                  <div className="fn-stat-label">ACCURACY</div>
                </div>
                <div className="fn-stat-item fn-stat-pink">
                  <div className="fn-stat-icon">⚡</div>
                  <div className="fn-stat-value">{totalFlips}</div>
                  <div className="fn-stat-label">FLIPS</div>
                </div>
              </div>

              <div className="poc-go-actions">
                <button onClick={resetGame} className="poc-go-btn poc-go-btn-primary">
                  🚀 Play Again!
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
