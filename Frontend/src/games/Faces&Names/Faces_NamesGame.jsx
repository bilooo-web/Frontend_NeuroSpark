import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Faces_NamesGame.css";
import Header from "../../components/common/Header/Header";
import breathingexercise from "../../assets/breathing-video.mp4"; 
import relaxGiraffe from "../../assets/relax-giraffe.png";

const MALE_FACES = [
  { id:2, emoji:"🧔", gender:"male" }, { id:4, emoji:"👨‍🦱", gender:"male" },
  { id:6, emoji:"👨‍🦲", gender:"male" }, { id:8, emoji:"👴", gender:"male" },
  { id:10, emoji:"🧑", gender:"male" }, { id:12, emoji:"👨‍🦳", gender:"male" },
];
const FEMALE_FACES = [
  { id:1, emoji:"👵", gender:"female" }, { id:3, emoji:"👩", gender:"female" },
  { id:5, emoji:"👩‍🦳", gender:"female" }, { id:7, emoji:"🧕", gender:"female" },
  { id:9, emoji:"👱‍♀️", gender:"female" }, { id:11, emoji:"👩‍🦰", gender:"female" },
  { id:13, emoji:"👩‍🦱", gender:"female" },
];
const MALE_NAMES = ["James","Carlos","Marcus","Derek","Ethan","Leo"];
const FEMALE_NAMES = ["Ashley","Sophie","Linda","Priya","Mia","Yara","Nina"];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];
const SESSION_DURATION = 120; 

const CELEBRATION_MSGS = [
  { emoji: '🧠', text: 'You got it!', sub: 'Your memory is amazing!' },
  { emoji: '🌟', text: 'Correct!', sub: 'You remembered the name!' },
  { emoji: '🎉', text: 'Brilliant!', sub: 'Your brain is so powerful!' },
  { emoji: '✨', text: 'Fantastic!', sub: 'What an incredible memory!' },
];
const MOTIVATION_MSGS = [
  { emoji: '💪', text: 'Almost!', sub: 'You are getting closer!' },
  { emoji: '🌈', text: 'Keep trying!', sub: 'Mistakes help you learn!' },
  { emoji: '⭐', text: 'Good try!', sub: 'Your brain is growing!' },
  { emoji: '🔥', text: 'Not quite!', sub: 'You will get it next time!' },
];

function getRoundConfig(r) { 
  let facesCount;
  let memorizeTime;
  
  if (r <= 1) {
    facesCount = 2;
    memorizeTime = 5.0;
  } else if (r <= 3) {
    facesCount = 3;
    memorizeTime = 4.5;
  } else if (r <= 5) {
    facesCount = 4;
    memorizeTime = 4.0;
  } else if (r <= 7) {
    facesCount = 5;
    memorizeTime = 3.5;
  } else if (r <= 9) {
    facesCount = 6;
    memorizeTime = 3.0;
  } else if (r <= 12) {
    facesCount = 7;
    memorizeTime = 3.0;
  } else {
    facesCount = Math.min(8, 2 + Math.floor(r * 0.5));
    memorizeTime = Math.max(2.5, 5.0 - r * 0.15);
  }
  
  return { facesCount, memorizeTime }; 
}

function shuffle(a) { 
  const b=[...a]; 
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  } 
  return b; 
}

function createRandomFaces(count) {
  const mc = Math.floor(count / 2), fc = count - mc;
  
  const shuffledMales = shuffle(MALE_FACES);
  const males = [];
  const usedMaleNames = new Set();
  
  for (let i = 0; i < mc && i < shuffledMales.length; i++) {
    const availableNames = MALE_NAMES.filter(name => !usedMaleNames.has(name));
    if (availableNames.length === 0) break;
    
    const name = shuffle(availableNames)[0];
    usedMaleNames.add(name);
    males.push({ ...shuffledMales[i], name });
  }
  
  const shuffledFemales = shuffle(FEMALE_FACES);
  const females = [];
  const usedFemaleNames = new Set();
  
  for (let i = 0; i < fc && i < shuffledFemales.length; i++) {
    const availableNames = FEMALE_NAMES.filter(name => !usedFemaleNames.has(name));
    if (availableNames.length === 0) break;
    
    const name = shuffle(availableNames)[0];
    usedFemaleNames.add(name);
    females.push({ ...shuffledFemales[i], name });
  }
  
  return shuffle([...males, ...females]);
}

function createNamePool(faces, extra=1) {
  const correct=faces.map(f=>f.name);
  return shuffle([...correct, ...shuffle(ALL_NAMES.filter(n=>!correct.includes(n))).slice(0,extra)]);
}

export default function FacesNamesGame({ 
  onGameComplete, 
  startNewSession, 
  abandonSession, 
  navigateBack, 
  gameInfo,
  totalCoins: initialTotalCoins = 0 
}) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [faces, setFaces] = useState([]);
  const [namePool, setNamePool] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [feedback, setFeedback] = useState({});
  const [memTime, setMemTime] = useState(4);
  const [sessionLeft, setSessionLeft] = useState(SESSION_DURATION);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalFaces, setTotalFaces] = useState(0);
  const [roundScore, setRoundScore] = useState({ correct:0, total:0 });
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const [celebration, setCelebration] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [headerTotalCoins, setHeaderTotalCoins] = useState(initialTotalCoins);
  const [breathingInstruction, setBreathingInstruction] = useState("Breathe in...");

  const gameStartTime = useRef(Date.now());
  const totalPausedTime = useRef(0);
  const pauseStartTime = useRef(null);
  const responseTimes = useRef([]);
  const lastActionTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const inactivityCount = useRef(0);
  const inactivityInterval = useRef(null);
  
  const gameFinished = useRef(false);
  const memTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const flashTimeout = useRef(null);
  const countdownTimerRef = useRef(null);
  const roundIndexRef = useRef(0);
  const audioCtxRef = useRef(null);
  const totalCorrectRef = useRef(0);
  const totalFacesRef = useRef(0);
  const incorrectAttemptsRef = useRef(0);
  const totalAttemptsRef = useRef(0);
  const completedRoundsRef = useRef(0);
  const videoRef = useRef(null);
  const breathingIntervalRef = useRef(null);
  const breathingAudioCtxRef = useRef(null);

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
      if (paused || screen === "gameover" || screen === "memorize" || screen === "intro") return;
      if (Date.now() - lastActivityTime.current > 10000) { 
        inactivityCount.current++; 
        lastActivityTime.current = Date.now(); 
      }
    }, 5000);
    return () => clearInterval(inactivityInterval.current);
  }, [paused, screen]);

  const togglePause = () => {
    if (screen === 'gameover' || screen === 'intro') return;
    if (paused) {
      if (pauseStartTime.current) { 
        const pausedDuration = Date.now()-pauseStartTime.current;
        totalPausedTime.current += pausedDuration; 
        lastActionTime.current += pausedDuration;
        pauseStartTime.current=null; 
      }
      lastActivityTime.current=Date.now(); 
      setPaused(false);
      if (screen==="recall") setIsTimerPaused(false);
    } else {
      pauseStartTime.current=Date.now(); 
      setPaused(true); 
      setIsTimerPaused(true);
    }
  };

  const ensureAudio = useCallback(async () => {
    const Ctx = window.AudioContext||window.webkitAudioContext; 
    if(!Ctx) return null;
    if (!audioCtxRef.current||audioCtxRef.current.state==='closed') audioCtxRef.current=new Ctx();
    if (audioCtxRef.current.state==='suspended') try{await audioCtxRef.current.resume();}catch(e){}
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const h=()=>ensureAudio();
    window.addEventListener('click',h); 
    window.addEventListener('touchstart',h); 
    ensureAudio();
    return () => { 
      window.removeEventListener('click',h); 
      window.removeEventListener('touchstart',h); 
      if(audioCtxRef.current){audioCtxRef.current.close();audioCtxRef.current=null;} 
    };
  }, [ensureAudio]);

  const playCorrectSound = async () => {
    const ctx=await ensureAudio(); 
    if(!ctx) return;
    try { 
      const now=ctx.currentTime;
      [523.25,659.25,783.99,1046.50].forEach((f,i) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type=i%2===0?'sine':'triangle'; 
        o.frequency.value=f;
        g.gain.setValueAtTime(0,now+i*0.08); 
        g.gain.linearRampToValueAtTime(0.15,now+i*0.08+0.05); 
        g.gain.linearRampToValueAtTime(0,now+i*0.08+0.4);
        o.connect(g); 
        g.connect(ctx.destination); 
        o.start(now+i*0.08); 
        o.stop(now+i*0.08+0.4);
      });
    } catch(e){}
  };
  
  const playWrongSound = async () => {
    const ctx=await ensureAudio(); 
    if(!ctx) return;
    try { 
      const now=ctx.currentTime; 
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; 
      o.frequency.setValueAtTime(392,now); 
      o.frequency.exponentialRampToValueAtTime(196,now+0.4);
      g.gain.setValueAtTime(0.1,now); 
      g.gain.linearRampToValueAtTime(0,now+0.5);
      o.connect(g); 
      g.connect(ctx.destination); 
      o.start(now); 
      o.stop(now+0.5);
    } catch(error){void error;}
  };

  const buildRound = useCallback((idx, showCountdown = false) => {
    const { facesCount, memorizeTime } = getRoundConfig(idx);
    const chosen = createRandomFaces(facesCount);
    setFaces(chosen);
    setNamePool(createNamePool(chosen, facesCount % 2 === 0 ? 1 : 0));
    setAssignments({});
    setFeedback({});
    setMemTime(Math.ceil(memorizeTime));

    clearInterval(countdownTimerRef.current);

    if (showCountdown) {
      setScreen("countdown");
      setCountdown(3);

      let count = 3;
      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count === 0) {
          clearInterval(countdownTimerRef.current);
          setScreen("memorize");
          setIsTimerPaused(true);
        } else {
          setCountdown(count);
        }
      }, 1000);
    } else {
      setScreen("memorize");
      setIsTimerPaused(true);
    }

    roundIndexRef.current = idx;
    lastActionTime.current = Date.now();
    lastActivityTime.current = Date.now();
  }, []);

  useEffect(() => {
    setScreen("intro");
  }, []);

  
  const startGameFromIntro = () => {
    buildRound(0, true);
  };

  useEffect(() => {
    if (isTimerPaused || screen==="gameover" || paused || screen==="intro" || screen==="countdown") return;
    sessionTimerRef.current = setInterval(() => {
      setSessionLeft(t => { 
        if(t<=1){
          clearInterval(sessionTimerRef.current);
          clearInterval(memTimerRef.current);
          clearTimeout(flashTimeout.current);
          clearInterval(countdownTimerRef.current);
          endGame();
          return 0;
        } 
        return t-1; 
      });
    }, 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [isTimerPaused, screen, paused]);

  const endGame = async () => {
    if (gameFinished.current) return;
    gameFinished.current = true;
    clearInterval(inactivityInterval.current);
    setScreen("gameover");
    setIsTimerPaused(false);

    const dur = Math.round((Date.now()-gameStartTime.current-totalPausedTime.current)/1000);
    const tc = totalCorrectRef.current, tf = totalFacesRef.current;
    
    const accuracy = tf>0 ? Math.round((tc/tf)*100) : 0;
    const completed = completedRoundsRef.current;
    const accuracyBase = Math.round(accuracy * 0.6);
    const progressionBonus = Math.min(completed * 5, 30);
    const efficiencyBonus = accuracy >= 80 ? 10 : 0;
    const score = Math.min(accuracyBase + progressionBonus + efficiencyBonus, 100);
    
    const rts = responseTimes.current;
    const avgRT = rts.length>0 ? Math.round(rts.reduce((a,b)=>a+b,0)/rts.length) : 0;
    
    let rtVar = 0;
    if (rts.length > 1) { 
      const mean = rts.reduce((a,b)=>a+b,0)/rts.length;
      const sq = rts.map(v => Math.pow(v - mean, 2)); 
      rtVar = Math.round(Math.sqrt(sq.reduce((a,b)=>a+b,0)/(rts.length - 1))); 
    }

    const totalAttempts = totalAttemptsRef.current;
    const incorrectAttempts = incorrectAttemptsRef.current;

    if (onGameComplete) {
      const result = await onGameComplete({
        score: score,
        duration: Math.max(dur,1), 
        accuracy: accuracy,
        incorrectAttempts: incorrectAttempts,
        totalAttempts: Math.max(totalAttempts, 1),
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

  useEffect(() => {
    if (screen!=="memorize" || paused) return;
    clearInterval(memTimerRef.current);
    const { memorizeTime } = getRoundConfig(roundIndexRef.current);
    const totalMs=memorizeTime*1000, start=Date.now();
    memTimerRef.current = setInterval(() => {
      const rem=Math.ceil((totalMs-(Date.now()-start))/1000);
      if(rem<=0){
        clearInterval(memTimerRef.current);
        setScreen("recall");
        setIsTimerPaused(false);
        lastActionTime.current=Date.now();
        lastActivityTime.current=Date.now();
      }
      else setMemTime(rem);
    }, 250);
    return () => clearInterval(memTimerRef.current);
  }, [screen, paused]);

  useEffect(() => {
    if (screen!=="recall"||faces.length===0||paused) return;
    if (!faces.every(f=>assignments[f.id])) return;
    
    const fb={}; 
    let correct=0;
    
    faces.forEach(f=>{
      const ok=assignments[f.id]===f.name;
      fb[f.id]=ok?"correct":"wrong";
      if(ok){
        correct++;
        playCorrectSound();
        showCelebration();
      } else {
        incorrectAttemptsRef.current++;
        playWrongSound();
        showMotivation();
      }
    });
    
    setFeedback(fb); 
    setRoundScore({correct,total:faces.length});
    totalCorrectRef.current += correct;
    totalFacesRef.current += faces.length;
    setTotalCorrect(c=>c+correct); 
    setTotalFaces(t=>t+faces.length);
    
    setTimeout(()=>{
      completedRoundsRef.current += 1; 
      setScreen("flash");
      setIsTimerPaused(true);
      flashTimeout.current=setTimeout(()=>{
        const ni=roundIndexRef.current+1;
        setRoundIndex(ni);
        buildRound(ni, false);
      },1600);
    },600);
  },[assignments,screen,faces,paused,buildRound]);

  const resetGame = async () => {
    gameFinished.current=false;
    if(startNewSession) await startNewSession();
    gameStartTime.current=Date.now(); 
    totalPausedTime.current=0; 
    pauseStartTime.current=null;
    responseTimes.current=[]; 
    inactivityCount.current=0; 
    incorrectAttemptsRef.current = 0;
    totalAttemptsRef.current = 0;
    completedRoundsRef.current = 0;
    totalCorrectRef.current = 0;
    totalFacesRef.current = 0;
    lastActivityTime.current=Date.now(); 
    lastActionTime.current=Date.now();
    setTotalCorrect(0);
    setTotalFaces(0);
    setRoundIndex(0);
    setSessionLeft(SESSION_DURATION);
    setEarnedCoins(0);
    setPaused(false);
    setCelebration(null);
    setMotivation(null);
    
    setScreen("intro");
  };

  const goBack = () => {
    const tc = totalCorrectRef.current;
    const tf = totalFacesRef.current;
    const accuracy = tf>0 ? Math.round((tc/tf)*100) : 0;
    const completed = completedRoundsRef.current;
    const accuracyBase = Math.round(accuracy * 0.6);
    const progressionBonus = Math.min(completed * 5, 30);
    const efficiencyBonus = accuracy >= 80 ? 10 : 0;
    const score = Math.min(accuracyBase + progressionBonus + efficiencyBonus, 100);
    navigateBack?.({ score }, earnedCoins);
  };

  const sessionPct = (sessionLeft/SESSION_DURATION)*100;
  const timerColor = sessionLeft>60?"#4CAF82":sessionLeft>30?"#F5B731":sessionLeft>15?"#FF8C42":"#E05C6A";
  const isCompact = faces.length>4;
  const usedNamesSet = new Set(Object.entries(assignments).filter(([fid])=>feedback[fid]==="correct").map(([,n])=>n));
  const accuracy = totalFaces>0?Math.round((totalCorrect/totalFaces)*100):0;

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
            <span className="fn-pause-stat-value">{totalCorrect}</span>
            <span className="fn-pause-stat-label">Correct</span>
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
    <div className="fn-game-wrapper">
      <Header totalCoins={headerTotalCoins} />
      
      {screen !== "gameover" && screen !== "countdown" && (
        <div className="fn-session-timer-wrap fn-timer-after-header">
          <div className="fn-session-timer-fill" style={{ width:`${sessionPct}%`, background:timerColor, transition:isTimerPaused?'none':'width 0.5s linear' }} />
        </div>
      )}
      
      <div className="fn-game-content" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="fn-stars-bg"></div>
        {paused && renderPause()}
        
        {screen === "intro" && (
          <div className="fn-intro-screen">
            <video 
              ref={videoRef}
              src={breathingexercise} 
              autoPlay 
              muted 
              className="fn-breathing-video"
              onEnded={startGameFromIntro}
            />
          </div>
        )}
        
        {screen === "countdown" && (
          <div className="fn-countdown-screen">
            <div className="fn-countdown-number-large">{countdown}</div>
            <p>Get ready astronaut...</p>
          </div>
        )}
        
        {celebration && (
          <div className="fn-celebration-toast">
            <div className="fn-celebration-content">
              <span className="fn-celebration-emoji">{celebration.emoji}</span>
              <div>
                <div className="fn-celebration-text">{celebration.text}</div>
                <div className="fn-celebration-sub">{celebration.sub}</div>
              </div>
            </div>
          </div>
        )}
        
        {motivation && (
          <div className="fn-motivation-toast">
            <div className="fn-motivation-content">
              <span className="fn-motivation-emoji">{motivation.emoji}</span>
              <div>
                <div className="fn-motivation-text">{motivation.text}</div>
                <div className="fn-motivation-sub">{motivation.sub}</div>
              </div>
            </div>
          </div>
        )}
        
        {showCoinReward && (
          <div className="fn-coin-reward-animation">
            <span className="fn-coin-emoji">🪙</span>
            <span className="fn-coin-amount">+{earnedCoins}</span>
          </div>
        )}

        {screen !== "gameover" && screen !== "intro" && screen !== "countdown" && (
          <button onClick={togglePause} className="fn-pause-btn">
            ⏸
          </button>
        )}


        {(screen === "memorize" || screen === "flash") && (
          <>
            <div className="fn-phase-label">Memorize</div>
            <div className={`fn-faces-grid${isCompact?" fn-compact":""}`}>
              {faces.map(face => (
                <div className="fn-face-card" key={face.id}>
                  <div className="fn-face-img-wrap">{face.emoji}</div>
                  <div className="fn-name-badge"><span className="fn-name-shown">{face.name}</span></div>
                </div>
              ))}
            </div>
            {screen === "memorize" && (
              <div className="fn-countdown">
                <div className="fn-countdown-circle">
                  <svg viewBox="0 0 100 100">
                    <circle className="fn-countdown-circle-bg" cx="50" cy="50" r="45" />
                    <circle className="fn-countdown-circle-progress" cx="50" cy="50" r="45" style={{ strokeDasharray:`${2*Math.PI*45}`, strokeDashoffset:`${2*Math.PI*45*(1-memTime/getRoundConfig(roundIndex).memorizeTime)}` }} />
                  </svg>
                  <div className="fn-countdown-number">{memTime}s</div>
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
                const fb = feedback[face.id];
                let dropClass = "fn-drop-zone";
                if (dragOver === face.id) dropClass += " fn-drag-over";
                if (dragging && !assigned && feedback[face.id] !== "correct") dropClass += " fn-awaiting-drop";
                if (assigned && !fb) dropClass += " fn-filled";
                if (fb === "correct") dropClass += " fn-filled fn-filled-correct";
                if (fb === "wrong") dropClass += " fn-filled fn-filled-wrong";
                let cardClass = "fn-face-card";
                if (fb === "correct") cardClass += " fn-correct";
                if (fb === "wrong") cardClass += " fn-wrong";

                return (
                  <div
                    key={face.id}
                    className={cardClass}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOver(face.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault(); 
                      e.dataTransfer.dropEffect = "move"; 
                      setDragOver(face.id);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget)) return;
                      setDragOver(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault(); 
                      const draggedName =
                        dragging || e.dataTransfer.getData("text/plain");

                      if (!draggedName || paused) return;
                      if (feedback[face.id] === "correct") return;

                      ensureAudio();
                      lastActivityTime.current = Date.now();

                      const now = Date.now();
                      const rt = now - lastActionTime.current;
                      if (rt >= 500 && rt <= 60000) {
                        responseTimes.current.push(rt);
                      }
                      lastActionTime.current = now;

                      totalAttemptsRef.current++;

                      const prev = Object.keys(assignments).find(k => assignments[k] === draggedName);
                      if (prev) {
                        setAssignments(p => {
                          const n = { ...p };
                          delete n[prev];
                          return n;
                        });
                        setFeedback(p => {
                          const n = { ...p };
                          delete n[prev];
                          return n;
                        });
                      }

                      setAssignments(p => ({ ...p, [face.id]: draggedName }));
                      setFeedback(p => {
                        const n = { ...p };
                        delete n[face.id];
                        return n;
                      });
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onClick={(e) => {
                      if (!dragging || paused) return;
                      if (feedback[face.id] === "correct") return;
                      e.preventDefault();

                      const draggedName = dragging;

                      ensureAudio();
                      lastActivityTime.current = Date.now();

                      const now = Date.now();
                      const rt = now - lastActionTime.current;
                      if (rt >= 500 && rt <= 60000) {
                        responseTimes.current.push(rt);
                      }
                      lastActionTime.current = now;

                      totalAttemptsRef.current++;

                      const prev = Object.keys(assignments).find(k => assignments[k] === draggedName);
                      if (prev) {
                        setAssignments(p => {
                          const n = { ...p };
                          delete n[prev];
                          return n;
                        });
                        setFeedback(p => {
                          const n = { ...p };
                          delete n[prev];
                          return n;
                        });
                      }

                      setAssignments(p => ({ ...p, [face.id]: draggedName }));
                      setFeedback(p => {
                        const n = { ...p };
                        delete n[face.id];
                        return n;
                      });
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onTouchEnd={(e) => {
                      if (dragging && !feedback[face.id]) {
                        e.preventDefault();
                        const draggedName = dragging;

                        if (!draggedName || paused) return;
                        if (feedback[face.id] === "correct") return;

                        ensureAudio();
                        lastActivityTime.current = Date.now();

                        const now = Date.now();
                        const rt = now - lastActionTime.current;
                        if (rt >= 500 && rt <= 60000) {
                          responseTimes.current.push(rt);
                        }
                        lastActionTime.current = now;

                        totalAttemptsRef.current++;

                        const prev = Object.keys(assignments).find(k => assignments[k] === draggedName);
                        if (prev) {
                          setAssignments(p => {
                            const n = { ...p };
                            delete n[prev];
                            return n;
                          });
                          setFeedback(p => {
                            const n = { ...p };
                            delete n[prev];
                            return n;
                          });
                        }

                        setAssignments(p => ({ ...p, [face.id]: draggedName }));
                        setFeedback(p => {
                          const n = { ...p };
                          delete n[face.id];
                          return n;
                        });
                        setDragging(null);
                        setDragOver(null);
                      }
                    }}
                  >
                    <div className="fn-face-img-wrap">{face.emoji}</div>
                    <div className="fn-name-badge">
                      <div className={dropClass}>
                        {assigned ? (
                          (fb === "correct" ? "✓ " : fb === "wrong" ? "✗ " : "") + assigned
                        ) : (
                          " drop here"
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fn-names-pool">
              {namePool.map(name => {
                const isUsed = usedNamesSet.has(name);
                const isDragging = dragging === name;

                return (
                  <div
                    key={name}
                    className={`fn-name-chip${isUsed ? " fn-used" : ""}${isDragging ? " fn-dragging fn-selected" : ""}`}
                    draggable={!isUsed}
                    onPointerDown={(e) => {
                      if (isUsed) return;
                      if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
                        setDragging(name); 
                        lastActivityTime.current = Date.now();
                      }
                    }}
                    onDragStart={(e) => {
                      if (!isUsed) {
                        e.dataTransfer.setData("text/plain", name);
                        e.dataTransfer.effectAllowed = "move";
                        document.body.style.cursor = "grabbing"; 
                        try {
                          e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
                        } catch {}
                        setDragging(name);
                        lastActivityTime.current = Date.now();
                      } else {
                        e.preventDefault();
                        return false;
                      }
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    style={{
                      cursor: isUsed ? 'default' : 'grab',
                      opacity: isUsed ? 0.4 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onTouchStart={(e) => {
                      if (isUsed) return;
                      const element = e.currentTarget;
                      setDragging(name);
                      lastActivityTime.current = Date.now();
                      element.style.transform = 'scale(0.98)';
                      setTimeout(() => {
                        element.style.transform = '';
                      }, 150);
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {screen === "flash" && (
          <div className="fn-round-flash">
            <div className="fn-flash-emoji">{roundScore.correct===roundScore.total?"⭐":roundScore.correct>0?"👍":"😬"}</div>
            <div className="fn-flash-text">{roundScore.correct===roundScore.total?"Perfect round!":`${roundScore.correct}/${roundScore.total} correct`}</div>
            <div className="fn-flash-sub">Get ready for the next one…</div>
          </div>
        )}

        {screen === "gameover" && (() => {
          const rounds = roundIndex + 1;
          const goEm = accuracy>=80?"🧠":accuracy>=60?"🏆":accuracy>=40?"⭐":"💪";
          const goTi = accuracy>=80?"Brilliant Memory!":accuracy>=60?"Great Job!":accuracy>=40?"Good Try!":"Great Effort!";
          const goSu = accuracy>=80?"You are a memory superstar!":accuracy>=60?"Your brain is getting stronger!":accuracy>=40?"Every round makes you better!":"You showed up and tried — that's what matters!";
          const coinsEarned = earnedCoins || 0;
          
          return (
            <div className="FN-gameover-screen">
              <div className="FN-gameover-content">
                <div className="FN-go-emoji">{goEm}</div>
                <h1 className="FN-go-title">{goTi}</h1>
                <p className="FN-go-sub">{goSu}</p>
                
                <div className="FN-stats-grid">
                  <div className="FN-stat-item">
                    <div className="FN-stat-icon">✔️</div>
                    <div className="FN-stat-value">{totalCorrect}</div>
                    <div className="FN-stat-label">Correct</div>
                  </div>
                  
                  <div className="FN-stat-item">
                    <div className="FN-stat-icon">🔄</div>
                    <div className="FN-stat-value">{rounds}</div>
                    <div className="FN-stat-label">Rounds</div>
                  </div>
                  
                  <div className="FN-stat-item">
                    <div className="FN-stat-icon">🎯</div>
                    <div className="FN-stat-value">{accuracy}%</div>
                    <div className="FN-stat-label">Accuracy</div>
                  </div>
                  
                  <div className="FN-stat-item">
                    <div className="FN-stat-icon">⏱️</div>
                    <div className="FN-stat-value">
                        {responseTimes.current.length > 0
                          ? (responseTimes.current.reduce((a,b)=>a+b,0) / responseTimes.current.length / 1000).toFixed(1) + 's'
                        : '—'}
                    </div>
                    <div className="FN-stat-label">Avg Time</div>
                  </div>
                </div>
              
                
                <div style={{ display: 'flex', gap: 14, marginTop: 28, justifyContent: 'center' }}>
                  <button onClick={resetGame} style={{
                    padding: '16px 40px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg, #00a896, #00d4aa)', color: '#fff',
                    fontSize: 18, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(0,168,150,0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}> Play Again</button>
                  <button onClick={goBack} style={{
                    padding: '16px 40px', borderRadius: 50,
                    border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 600, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                  }}>← Back</button>
                </div>
                
              </div>            </div>
          );
        })()}
      </div>
    </div>
  );
}