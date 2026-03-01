import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PairOfCards.css';
import Header from "../../components/common/Header/Header";
import mouse_motivation from "../../assets/mouse.png";
import successSnd from "../../assets/Success.mp3";
import errorSnd from "../../assets/SoftFailSound.mp3";
import { useNavigate } from "react-router-dom"; 

const ALL_EMOJIS = [
  '🔧', '⛑️', '🩺', '🎸', '🌮', '🦁', '🚀', '🎨',
  '🌵', '🐙', '🏆', '🎯', '🦋', '🍕', '🎲', '🌈',
  '🦊', '🎻', '🧩', '🐳',
];

const SESSION_DURATION = 90; 

function getRoundConfig(roundIndex) {
  const pairs       = Math.min(3 + roundIndex, 10);          
  const previewTime = Math.max(4 - roundIndex * 0.4, 2);     
  return { pairs, previewTime: parseFloat(previewTime.toFixed(1)) };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs) {
  const chosen = shuffle(ALL_EMOJIS).slice(0, pairs);
  return shuffle(
    chosen.flatMap((emoji, i) => [
      { id: i * 2,     emoji, pairId: i, state: 'preview' },
      { id: i * 2 + 1, emoji, pairId: i, state: 'preview' },
    ])
  );
}

function calculateCoins(totalMatched, moves, roundsCompleted) {
  if (totalMatched === 0) return 0;
  
  const accuracy = moves > 0 ? (totalMatched / moves) * 100 : 100;
  let coins = 0;
  
  coins += totalMatched * 20;
  
  if (accuracy >= 80) coins += 100;
  else if (accuracy >= 60) coins += 60;
  else if (accuracy >= 40) coins += 30;
  
  if (roundsCompleted >= 5) coins += 80;
  else if (roundsCompleted >= 3) coins += 40;
  
  if (totalMatched === moves && totalMatched > 0) coins += 150;
  
  return coins;
}

export default function PairOfCards() {
  const navigate = useNavigate(); 
  
  const [screen,       setScreen]       = useState('game');   
  const [roundIndex,   setRoundIndex]   = useState(0);
  const [cards,        setCards]        = useState([]);
  const [flipped,      setFlipped]      = useState([]);       
  const [wrongPair,    setWrongPair]    = useState([]);       
  const [locked,       setLocked]       = useState(false);    
  const [previewLeft,  setPreviewLeft]  = useState(0);        
  const [isPreview,    setIsPreview]    = useState(true);
  const [sessionLeft,  setSessionLeft]  = useState(SESSION_DURATION);
  const [totalMatched, setTotalMatched] = useState(0);
  const [totalPairs,   setTotalPairs]   = useState(0);
  const [roundMatches, setRoundMatches] = useState(0);
  const [moves,        setMoves]        = useState(0);
  const [totalCoins,   setTotalCoins]   = useState(() => {
    const savedCoins = localStorage.getItem('totalCoins');
    return savedCoins ? parseInt(savedCoins) : 0;
  });
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const sessionRef   = useRef(null);
  const previewRef   = useRef(null);
  const roundIdxRef  = useRef(0);
  const cardsRef     = useRef([]);
  const audioUnlockedRef = useRef(false);
  const audioContextRef = useRef(null);
  const navigateTimeout = useRef(null); 

  cardsRef.current = cards;

  useEffect(() => {
    localStorage.setItem('totalCoins', totalCoins.toString());
  }, [totalCoins]);

  useEffect(() => {
    return () => {
      if (navigateTimeout.current) {
        clearTimeout(navigateTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const resumeAudio = async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          console.log('Failed to resume AudioContext:', error);
        }
      }
    };

    const handleUserInteraction = () => {
      audioUnlockedRef.current = true;
      resumeAudio();
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    resumeAudio();

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((src, volume = 0.5, playbackRate = 1) => {
    if (!audioUnlockedRef.current) return;
    const audio = new Audio(src);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.play().catch(() => {});
  }, []);

  const playPreviewEndSound = () => {
    playSound(errorSnd, 0.28, 1.35);
  };

  const playFlipSound = async () => {
    if (!audioContextRef.current || !audioUnlockedRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      
      const bufferSize = 4096;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = noiseBuffer;
      
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;
      noiseFilter.Q.value = 0.5;
      
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start(now);
      noise.stop(now + 0.15);
      
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(180, now);
      snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      
      snapGain.gain.setValueAtTime(0.15, now + 0.02);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      
      snapOsc.start(now + 0.02);
      snapOsc.stop(now + 0.12);
      
      const rustle = ctx.createBufferSource();
      const rustleGain = ctx.createGain();
      const rustleFilter = ctx.createBiquadFilter();
      
      const rustleBuffer = ctx.createBuffer(1, 2048, ctx.sampleRate);
      const rustleOutput = rustleBuffer.getChannelData(0);
      for (let i = 0; i < 2048; i++) {
        rustleOutput[i] = Math.random() * 2 - 1;
      }
      rustle.buffer = rustleBuffer;
      
      rustleFilter.type = 'highpass';
      rustleFilter.frequency.value = 1500;
      
      rustleGain.gain.setValueAtTime(0.05, now + 0.03);
      rustleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      rustle.connect(rustleFilter);
      rustleFilter.connect(rustleGain);
      rustleGain.connect(ctx.destination);
      
      rustle.start(now + 0.03);
      rustle.stop(now + 0.1);
      
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.value = 60;
      
      thumpGain.gain.setValueAtTime(0.1, now + 0.12);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      
      thumpOsc.start(now + 0.12);
      thumpOsc.stop(now + 0.2);
      
    } catch (error) {
      console.log('Flip sound failed:', error);
      playSound(errorSnd, 0.18, 1.9);
    }
  };

  const playCorrectSound = () => {
    playSound(successSnd, 0.52, 1);
  };

  const playWrongSound = () => {
    playSound(errorSnd, 0.45, 1);
  };

  const playLevelCompleteSound = () => {
    playSound(successSnd, 0.7, 1.2);
  };

  const buildRound = useCallback((idx) => {
    const { pairs, previewTime } = getRoundConfig(idx);
    const deck = buildDeck(pairs);
    setCards(deck);
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
    const totalMs = previewTime * 1000;
    const start   = Date.now();
    previewRef.current = setInterval(() => {
      const remaining = Math.ceil((totalMs - (Date.now() - start)) / 1000);
      if (remaining <= 0) {
        clearInterval(previewRef.current);
        
        playPreviewEndSound();
        
        setCards(prev => prev.map(c => ({ ...c, state: 'hidden' })));
        setIsPreview(false);
        setLocked(false);
      } else {
        setPreviewLeft(remaining);
      }
    }, 200);
  }, []);

  useEffect(() => {
    buildRound(0);
  }, []); 

  useEffect(() => {
    sessionRef.current = setInterval(() => {
      setSessionLeft(t => {
        if (t <= 1) {
          clearInterval(sessionRef.current);
          clearInterval(previewRef.current);
          
          const coinsEarned = calculateCoins(totalMatched, moves, roundIndex);
          setEarnedCoins(coinsEarned);
          setTotalCoins(prev => prev + coinsEarned);
          setShowCoinReward(true);
          
          setScreen('gameover');
          
          navigateTimeout.current = setTimeout(() => {
            const bestScore = Math.max(totalMatched, parseInt(localStorage.getItem('pair-of-cards-best') || '0'));
            localStorage.setItem('pair-of-cards-best', bestScore.toString());
            
            navigate('/challenges/pair-of-cards', { 
              state: { 
                gameResults: {
                  lastScore: totalMatched,
                  bestScore: bestScore
                },
                earnedCoins: coinsEarned
              } 
            });
          }, 3000);
          
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(sessionRef.current);
  }, [totalMatched, moves, roundIndex, navigate]);

  const handleCardClick = useCallback((idx) => {
    if (locked || isPreview) return;
    const card = cardsRef.current[idx];
    if (card.state !== 'hidden') return;     
    if (flipped.includes(idx)) return;
    if (flipped.length >= 2) return;

    audioUnlockedRef.current = true;

    playFlipSound();

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, state: 'flipped' } : c));

    if (newFlipped.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newFlipped;

      setTimeout(() => {
        const currentCards = cardsRef.current;
        const emojiA = currentCards[a].emoji;
        const emojiB = currentCards[b].emoji;

        if (emojiA === emojiB) {
          playCorrectSound();
          
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, state: 'matched' } : c
          ));
          setRoundMatches(rm => {
            const newRm = rm + 1;
            setTotalMatched(tm => tm + 1);
            const { pairs } = getRoundConfig(roundIdxRef.current);
            if (newRm === pairs) {
              playLevelCompleteSound();
              
              setTimeout(() => {
                setScreen('flash');
                setTimeout(() => {
                  const nextIdx = roundIdxRef.current + 1;
                  setRoundIndex(nextIdx);
                  buildRound(nextIdx);
                }, 1800);
              }, 800);
            }
            return newRm;
          });
          setFlipped([]);
          setLocked(false);
        } else {
          playWrongSound();
          
          setWrongPair([a, b]);
          setTimeout(() => {
            setCards(prev => prev.map((c, i) =>
              i === a || i === b ? { ...c, state: 'hidden' } : c
            ));
            setWrongPair([]);
            setFlipped([]);
            setLocked(false);
          }, 900);
        }
      }, 50);
    }
  }, [locked, isPreview, flipped, buildRound]);

  const sessionPct  = (sessionLeft / SESSION_DURATION) * 100;
  const timerColor  = sessionLeft > 30 ? '#F5B731' : sessionLeft > 10 ? '#FF8C42' : '#E05C6A';
  const { pairs }   = getRoundConfig(roundIndex);
  const useThreeCols = pairs > 4;

  const accuracy    = moves > 0 ? Math.round((totalMatched / moves) * 100) : 100;
  const goEmoji     = accuracy >= 70 ? '🏆' : accuracy >= 40 ? '😊' : '😅';
  const goTitle     = accuracy >= 70 ? 'Incredible memory!' : accuracy >= 40 ? 'Nice work!' : 'Keep practicing!';

  useEffect(() => {
    if (showCoinReward) {
      const timer = setTimeout(() => setShowCoinReward(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCoinReward]);

  return (
    <div className="poc-game-wrapper">
        <Header totalCoins={totalCoins} /> 
        <div className="poc-stars-bg"></div>

      {showCoinReward && (
        <div className="poc-coin-reward-animation">
          <span className="poc-coin-emoji">🪙</span>
          <span className="poc-coin-amount">+{earnedCoins}</span>
        </div>
      )}

      {screen !== 'gameover' && (
        <div className="poc-session-bar">
          <div className="poc-session-fill"
            style={{ width: `${sessionPct}%`, background: timerColor }} />
        </div>
      )}

      {(screen === 'game' || screen === 'flash') && (
        <>
          <div className="poc-phase">
            {isPreview
              ? <>Memorize! <span className="poc-preview-timer">{previewLeft}s</span></>
              : `Match the pairs`}
          </div>
          <div className="poc-score-row">
            <div className="poc-score-pill">
              Matched <span className="poc-score-value">{roundMatches}/{pairs}</span>
            </div>
            <div className="poc-score-pill">
              Moves <span className="poc-score-value">{moves}</span>
            </div>
          </div>

          <div className={`poc-grid${useThreeCols ? ' poc-cols3' : ''}`}>
            {cards.map((card, idx) => {
              const isFlipped  = card.state === 'flipped' || card.state === 'matched' || card.state === 'preview';
              const isMatched  = card.state === 'matched';
              const isWrong    = wrongPair.includes(idx);
              return (
                <div
                  key={card.id}
                  className={[
                    'poc-card',
                    isFlipped   ? 'poc-flipped'     : '',
                    isMatched   ? 'poc-matched'      : '',
                    isWrong     ? 'poc-wrong-shake'  : '',
                    (locked && !isMatched) ? 'poc-no-click' : '',
                  ].join(' ').trim()}
                  onClick={() => handleCardClick(idx)}
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

      {screen === 'gameover' && (
        <div className="poc-gameover">
          <div className="poc-go-emoji">{goEmoji}</div>
          <div className="poc-go-title">{goTitle}</div>
          <div className="poc-go-sub">Time's up! Here's your summary:</div>

          <div className="poc-stats">
            <div className="poc-stat">
              <div className="poc-stat-num">{totalMatched}</div>
              <div className="poc-stat-lbl">Pairs Found</div>
            </div>
            <div className="poc-stat">
              <div className="poc-stat-num">{roundIndex + 1}</div>
              <div className="poc-stat-lbl">Rounds</div>
            </div>
            <div className="poc-stat">
              <div className="poc-stat-num">{moves}</div>
              <div className="poc-stat-lbl">Total Moves</div>
            </div>
          </div>

          {earnedCoins > 0 && (
            <div className="poc-coin-reward-box">
              <span className="poc-coin-icon">🪙</span>
              <span className="poc-coin-value">+{earnedCoins}</span>
              <span className="poc-coin-label">Coins Earned!</span>
            </div>
          )}

          <div className="poc-redirect-message">
            Returning to challenge in 3 seconds...
          </div>
        </div>
      )}

    </div>
  );
}