import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Faces_NamesGame.css";
import Header from "../../components/common/Header/Header";

const MALE_FACES = [
  { id: 2,  emoji: "🧔", gender: "male" },    
  { id: 4,  emoji: "👨‍🦱", gender: "male" }, 
  { id: 6,  emoji: "👨‍🦲", gender: "male" }, 
  { id: 8,  emoji: "👴", gender: "male" },  
  { id: 10, emoji: "🧑", gender: "male" },  
  { id: 12, emoji: "👨‍🦳", gender: "male" }, 
];

const FEMALE_FACES = [
  { id: 1,  emoji: "👵", gender: "female" },   
  { id: 3,  emoji: "👩", gender: "female" },  
  { id: 5,  emoji: "👩‍🦳", gender: "female" }, 
  { id: 7,  emoji: "🧕", gender: "female" },   
  { id: 9,  emoji: "👱‍♀️", gender: "female" }, 
  { id: 11, emoji: "👩‍🦰", gender: "female" }, 
  { id: 13, emoji: "👩‍🦱", gender: "female" }, 
];

const MALE_NAMES = [
  "James", "Carlos", "Marcus", "Derek", "Ethan", "Leo"
];

const FEMALE_NAMES = [
  "Ashley", "Sophie", "Linda", "Priya", "Mia", "Yara", "Nina"
];

const ALL_FACES = [...MALE_FACES, ...FEMALE_FACES];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

function getRoundConfig(roundIndex) {
  const facesCount   = Math.min(2 + roundIndex, ALL_FACES.length);
  const memorizeTime = Math.max(4 - roundIndex * 0.2, 2);
  return { facesCount, memorizeTime: parseFloat(memorizeTime.toFixed(1)) };
}

const SESSION_DURATION = 70; 

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createRandomFaces(count) {
  const maleCount = Math.floor(count / 2);
  const femaleCount = count - maleCount;
  
  const shuffledMales = shuffle(MALE_FACES).slice(0, maleCount);
  
  const shuffledFemales = shuffle(FEMALE_FACES).slice(0, femaleCount);
  
  const shuffledMaleNames = shuffle(MALE_NAMES).slice(0, maleCount);
  
  const shuffledFemaleNames = shuffle(FEMALE_NAMES).slice(0, femaleCount);
  
  const malePairs = shuffledMales.map((face, index) => ({
    id: face.id,
    emoji: face.emoji,
    gender: face.gender,
    name: shuffledMaleNames[index]
  }));
  
  const femalePairs = shuffledFemales.map((face, index) => ({
    id: face.id,
    emoji: face.emoji,
    gender: face.gender,
    name: shuffledFemaleNames[index]
  }));
  
  const allPairs = shuffle([...malePairs, ...femalePairs]);
  
  return allPairs;
}

function createNamePool(faces, extraCount = 1) {
  const correctNames = faces.map(f => f.name);
  
  const otherNames = ALL_NAMES.filter(name => !correctNames.includes(name));
  
  const distractors = shuffle(otherNames).slice(0, extraCount);
  
  const allNames = shuffle([...correctNames, ...distractors]);
  
  return allNames;
}

function calculateCoins(totalCorrect, totalFaces, roundsCompleted) {
  if (totalFaces === 0) return 0;
  
  const accuracy = (totalCorrect / totalFaces) * 100;
  let coins = 0;
  
  coins += totalCorrect * 15;
  
  if (accuracy >= 90) coins += 75;
  else if (accuracy >= 75) coins += 45;
  else if (accuracy >= 50) coins += 25;
  
  if (roundsCompleted >= 5) coins += 60;
  else if (roundsCompleted >= 3) coins += 30;
  
  if (totalCorrect === totalFaces && totalFaces > 0) coins += 150;
  
  return coins;
}

export default function FacesNamesGame() {
  const navigate = useNavigate();
  
  const [screen,       setScreen]       = useState("memorize");
  const [roundIndex,   setRoundIndex]   = useState(0);
  const [faces,        setFaces]        = useState([]);
  const [namePool,     setNamePool]     = useState([]);
  const [assignments,  setAssignments]  = useState({});
  const [feedback,     setFeedback]     = useState({});
  const [memTime,      setMemTime]      = useState(4);
  const [sessionLeft,  setSessionLeft]  = useState(SESSION_DURATION);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalFaces,   setTotalFaces]   = useState(0);
  const [roundScore,   setRoundScore]   = useState({ correct: 0, total: 0 });
  const [dragging,     setDragging]     = useState(null);
  const [dragOver,     setDragOver]     = useState(null);
  const [totalCoins,   setTotalCoins]   = useState(() => {
    const savedCoins = localStorage.getItem('totalCoins');
    return savedCoins ? parseInt(savedCoins) : 0;
  });
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(true); 

  const memTimerRef     = useRef(null);
  const sessionTimerRef = useRef(null);
  const flashTimeout    = useRef(null);
  const navigateTimeout = useRef(null);
  const roundIndexRef   = useRef(0);
  const audioContextRef = useRef(null);

  const ensureAudioReady = useCallback(async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.log('Failed to resume AudioContext:', error);
      }
    }

    return audioContextRef.current;
  }, []);

  useEffect(() => {
    localStorage.setItem('totalCoins', totalCoins.toString());
  }, [totalCoins]);

  useEffect(() => {
    const handleUserInteraction = () => {
      ensureAudioReady();
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    ensureAudioReady();

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [ensureAudioReady]);

  useEffect(() => {
    return () => {
      if (navigateTimeout.current) {
        clearTimeout(navigateTimeout.current);
      }
    };
  }, []);

  const playCorrectSound = async () => {
    const ctx = await ensureAudioReady();
    if (!ctx) return;
    
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        if (index % 2 === 0) {
          osc.type = 'sine';
        } else {
          osc.type = 'triangle';
        }
        
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.05);
        gain.gain.linearRampToValueAtTime(0.1, now + index * 0.08 + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + index * 0.08 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.4);
      });
      
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.value = 1568.00;
      shimmerGain.gain.setValueAtTime(0, now + 0.3);
      shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      shimmerGain.gain.linearRampToValueAtTime(0, now + 0.7);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.3);
      shimmerOsc.stop(now + 0.7);
      
    } catch (error) {
      console.log('Correct sound play failed:', error);
    }
  };

  const playWrongSound = async () => {
    const ctx = await ensureAudioReady();
    if (!ctx) return;
    
    try {
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, now);
      osc.frequency.exponentialRampToValueAtTime(196.00, now + 0.4);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.5);
      
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.value = 110.00;
      popGain.gain.setValueAtTime(0, now + 0.45);
      popGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
      popGain.gain.linearRampToValueAtTime(0, now + 0.55);
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now + 0.45);
      popOsc.stop(now + 0.55);
      
    } catch (error) {
      console.log('Wrong sound play failed:', error);
    }
  };

  const buildRound = useCallback((idx) => {
    const { facesCount, memorizeTime } = getRoundConfig(idx);
    
    const chosen = createRandomFaces(facesCount);

    const extraCount = facesCount % 2 === 0 ? 1 : 0;
    const names = createNamePool(chosen, extraCount);
    
    setFaces(chosen);
    setNamePool(names);
    setAssignments({});
    setFeedback({});
    setMemTime(Math.ceil(memorizeTime));
    setScreen("memorize");
    setIsTimerPaused(true); 
    roundIndexRef.current = idx;
  }, []);

  useEffect(() => {
    buildRound(0);
  }, []);

  useEffect(() => {
    if (isTimerPaused || screen === "gameover") {
      return;
    }
    
    sessionTimerRef.current = setInterval(() => {
      setSessionLeft(t => {
        if (t <= 1) {
          clearInterval(sessionTimerRef.current);
          clearInterval(memTimerRef.current);
          clearTimeout(flashTimeout.current);
          
          const coinsEarned = calculateCoins(totalCorrect, totalFaces, roundIndex);
          setEarnedCoins(coinsEarned);
          
          setTotalCoins(prev => prev + coinsEarned);
          setShowCoinReward(true);
          
          setScreen("gameover");
          setIsTimerPaused(false);
          
          navigateTimeout.current = setTimeout(() => {
            const bestScore = Math.max(totalCorrect, parseInt(localStorage.getItem('faces-and-names-best') || '0'));
            localStorage.setItem('faces-and-names-best', bestScore.toString());
            
            navigate('/challenges/faces-and-names', { 
              state: { 
                gameResults: {
                  lastScore: totalCorrect,
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
    
    return () => clearInterval(sessionTimerRef.current);
  }, [isTimerPaused, screen, totalCorrect, totalFaces, roundIndex, navigate]);

  useEffect(() => {
    if (screen !== "memorize") return;
    
    clearInterval(memTimerRef.current);
    const { memorizeTime } = getRoundConfig(roundIndexRef.current);
    const totalMs  = memorizeTime * 1000;
    const start    = Date.now();
    
    memTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.ceil((totalMs - elapsed) / 1000);
      
      if (remaining <= 0) {
        clearInterval(memTimerRef.current);
        setScreen("recall");
        setIsTimerPaused(false); 
      } else {
        setMemTime(remaining);
      }
    }, 250);
    
    return () => clearInterval(memTimerRef.current);
  }, [screen]);

  const onDragStart = (name) => {
    ensureAudioReady();
    setDragging(name);
  };
  const onDragEnd   = () => { setDragging(null); setDragOver(null); };
  const onDragOver  = (e, faceId) => { e.preventDefault(); setDragOver(faceId); };
  const onDragLeave = () => setDragOver(null);

  const onDrop = (e, faceId) => {
    e.preventDefault();
    ensureAudioReady();
    if (!dragging) return;
    if (feedback[faceId] === "correct") return;

    const prevFaceId = Object.keys(assignments).find(k => assignments[k] === dragging);
    if (prevFaceId) {
      setAssignments(prev => { const n = { ...prev }; delete n[prevFaceId]; return n; });
      setFeedback(prev   => { const n = { ...prev }; delete n[prevFaceId]; return n; });
    }

    setAssignments(prev => ({ ...prev, [faceId]: dragging }));
    setFeedback(prev   => { const n = { ...prev }; delete n[faceId]; return n; });
    setDragging(null);
    setDragOver(null);
  };

  useEffect(() => {
    if (screen !== "recall" || faces.length === 0) return;
    const allDone = faces.every(f => assignments[f.id]);
    if (!allDone) return;

    const fb = {};
    let correct = 0;
    
    faces.forEach(f => {
      const isCorrect = assignments[f.id] === f.name;
      fb[f.id] = isCorrect ? "correct" : "wrong";
      if (isCorrect) {
        correct++;
        playCorrectSound();
      } else {
        playWrongSound();
      }
    });
    
    setFeedback(fb);
    setRoundScore({ correct, total: faces.length });
    setTotalCorrect(c => c + correct);
    setTotalFaces(t => t + faces.length);

    setTimeout(() => {
      setScreen("flash");
      setIsTimerPaused(true); 
      flashTimeout.current = setTimeout(() => {
        const nextIdx = roundIndexRef.current + 1;
        setRoundIndex(nextIdx);
        buildRound(nextIdx);
      }, 1600);
    }, 600);
  }, [assignments, screen, faces, buildRound]);

  const sessionPct   = (sessionLeft / SESSION_DURATION) * 100;
  const timerColor   = sessionLeft > 30 ? "#4CAF82" : sessionLeft > 15 ? "#F5B731" : sessionLeft > 5 ? "#FF8C42" : "#E05C6A";
  const isCompact    = faces.length > 4;
  const usedNamesSet = new Set(
    Object.entries(assignments)
      .filter(([fid]) => feedback[fid] === "correct")
      .map(([, name]) => name)
  );

  const accuracy = totalFaces > 0 ? Math.round((totalCorrect / totalFaces) * 100) : 0;
  const goEmoji  = accuracy >= 80 ? "🏆" : accuracy >= 50 ? "😊" : "😅";
  const goTitle  = accuracy >= 80 ? "Amazing memory!" : accuracy >= 50 ? "Good job!" : "Keep practicing!";

  useEffect(() => {
    if (showCoinReward) {
      const timer = setTimeout(() => setShowCoinReward(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCoinReward]);

  return (
    <div className="fn-game-wrapper">
        <Header totalCoins={totalCoins} />
        <div className="fn-game-content">
        <div className="stars-bg"></div>

      {showCoinReward && (
        <div className="fn-coin-reward-animation">
          <span className="fn-coin-emoji">🪙</span>
          <span className="fn-coin-amount">+{earnedCoins}</span>
        </div>
      )}

      {screen !== "gameover" && (
        <div className="fn-session-timer-wrap">
          <div
            className="fn-session-timer-fill"
            style={{ 
              width: `${sessionPct}%`, 
              background: timerColor,
              transition: isTimerPaused ? 'none' : 'width 0.5s linear'
            }}
          />
        </div>
      )}

      {(screen === "memorize" || screen === "flash") && (
        <>
          <div className="fn-phase-label">Memorize</div>
          <div className={`fn-faces-grid${isCompact ? " fn-compact" : ""}`}>
            {faces.map(face => (
              <div className="fn-face-card" key={face.id}>
                <div className="fn-face-img-wrap">{face.emoji}</div>
                <div className="fn-name-badge">
                  <span className="fn-name-shown">{face.name}</span>
                </div>
              </div>
            ))}
          </div>
          
          {screen === "memorize" && (
            <div className="fn-countdown">
              <div className="fn-countdown-circle">
                <svg viewBox="0 0 100 100">
                  <circle
                    className="fn-countdown-circle-bg"
                    cx="50"
                    cy="50"
                    r="45"
                  />
                  <circle
                    className="fn-countdown-circle-progress"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 45}`,
                      strokeDashoffset: `${2 * Math.PI * 45 * (1 - memTime / 4)}`
                    }}
                  />
                </svg>
                <div className="fn-countdown-number">
                  {memTime}<small>s</small>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {screen === "recall" && (
        <>
          <div className="fn-phase-label">Who is who?</div>
          <div className={`fn-faces-grid${isCompact ? " fn-compact" : ""}`}>
            {faces.map(face => {
              const assigned = assignments[face.id];
              const fb       = feedback[face.id];
              let dropClass  = "fn-drop-zone";
              if (dragOver === face.id) dropClass += " fn-drag-over";
              if (assigned && !fb)      dropClass += " fn-filled";
              if (fb === "correct")     dropClass += " fn-filled fn-filled-correct";
              if (fb === "wrong")       dropClass += " fn-filled fn-filled-wrong";

              let cardClass = "fn-face-card";
              if (fb === "correct") cardClass += " fn-correct";
              if (fb === "wrong")   cardClass += " fn-wrong";

              return (
                <div
                  key={face.id}
                  className={cardClass}
                  onDragOver={e => onDragOver(e, face.id)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, face.id)}
                >
                  <div className="fn-face-img-wrap">{face.emoji}</div>
                  <div className="fn-name-badge">
                    <div className={dropClass}>
                      {assigned
                        ? (fb === "correct" ? "✓ " : fb === "wrong" ? "✗ " : "") + assigned
                        : "drop here"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fn-names-pool">
            {namePool.map(name => (
              <div
                key={name}
                className={`fn-name-chip${usedNamesSet.has(name) ? " fn-used" : ""}${dragging === name ? " fn-dragging" : ""}`}
                draggable={!usedNamesSet.has(name)}
                onDragStart={() => onDragStart(name)}
                onDragEnd={onDragEnd}
              >
                {name}
              </div>
            ))}
          </div>
        </>
      )}

      {screen === "flash" && (
        <div className="fn-round-flash">
          <div className="fn-flash-emoji">
            {roundScore.correct === roundScore.total ? "⭐" : roundScore.correct > 0 ? "👍" : "😬"}
          </div>
          <div className="fn-flash-text">
            {roundScore.correct === roundScore.total ? "Perfect round!" : `${roundScore.correct}/${roundScore.total} correct`}
          </div>
          <div className="fn-flash-sub">Get ready for the next one…</div>
        </div>
      )}

      {screen === "gameover" && (
        <div className="fn-gameover-screen">
          <div className="fn-go-emoji">{goEmoji}</div>
          <div className="fn-go-title">{goTitle}</div>
          <div className="fn-go-sub">Time's up! Here's how you did:</div>

          <div className="fn-stats-row">
            <div className="fn-stat-box">
              <div className="fn-stat-num">{totalCorrect}</div>
              <div className="fn-stat-lbl">Correct</div>
            </div>
            <div className="fn-stat-box">
              <div className="fn-stat-num">{roundIndex + 1}</div>
              <div className="fn-stat-lbl">Rounds</div>
            </div>
            <div className="fn-stat-box">
              <div className="fn-stat-num">{accuracy}%</div>
              <div className="fn-stat-lbl">Accuracy</div>
            </div>
          </div>
          
          {earnedCoins > 0 && (
            <div className="fn-coin-reward-box">
              <span className="fn-coin-icon">🪙</span>
              <span className="fn-coin-value">+{earnedCoins}</span>
              <span className="fn-coin-label">Coins Earned!</span>
            </div>
          )}
          
          <div className="fn-redirect-message">
            Returning to challenge in 3 seconds...
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
