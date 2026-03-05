import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Faces_NamesGame.css";
import Header from "../../components/common/Header/Header";

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
const SESSION_DURATION = 70;

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
  return { 
    facesCount: Math.min(2 + r, 13), 
    memorizeTime: parseFloat(Math.max(4 - r * 0.2, 2).toFixed(1)) 
  }; 
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
  
  // Shuffle and take unique males
  const shuffledMales = shuffle(MALE_FACES);
  const males = [];
  const usedMaleNames = new Set();
  
  for (let i = 0; i < mc && i < shuffledMales.length; i++) {
    // Get unique name for each male
    const availableNames = MALE_NAMES.filter(name => !usedMaleNames.has(name));
    if (availableNames.length === 0) break;
    
    const name = shuffle(availableNames)[0];
    usedMaleNames.add(name);
    males.push({ ...shuffledMales[i], name });
  }
  
  // Shuffle and take unique females
  const shuffledFemales = shuffle(FEMALE_FACES);
  const females = [];
  const usedFemaleNames = new Set();
  
  for (let i = 0; i < fc && i < shuffledFemales.length; i++) {
    // Get unique name for each female
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
  const [screen, setScreen] = useState("memorize");
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

  const [celebration, setCelebration] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const [headerTotalCoins, setHeaderTotalCoins] = useState(initialTotalCoins);

  // Analytics refs
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
  const roundIndexRef = useRef(0);
  const audioCtxRef = useRef(null);
  const totalCorrectRef = useRef(0);
  const totalFacesRef = useRef(0);
  const incorrectAttemptsRef = useRef(0);
  const totalAttemptsRef = useRef(0);

  useEffect(()=>{
    totalCorrectRef.current=totalCorrect;
    totalFacesRef.current=totalFaces;
  },[totalCorrect, totalFaces]);

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
      if (paused || screen === "gameover" || screen === "memorize") return;
      if (Date.now() - lastActivityTime.current > 10000) { 
        inactivityCount.current++; 
        lastActivityTime.current = Date.now(); 
      }
    }, 5000);
    return () => clearInterval(inactivityInterval.current);
  }, [paused, screen]);

  const togglePause = () => {
    if (screen === 'gameover') return;
    if (paused) {
      if (pauseStartTime.current) { 
        totalPausedTime.current += Date.now()-pauseStartTime.current; 
        pauseStartTime.current=null; 
      }
      lastActivityTime.current=Date.now(); 
      lastActionTime.current=Date.now();
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
    } catch(e){}
  };

  const buildRound = useCallback((idx) => {
    const { facesCount, memorizeTime } = getRoundConfig(idx);
    const chosen = createRandomFaces(facesCount);
    setFaces(chosen); 
    setNamePool(createNamePool(chosen, facesCount%2===0?1:0));
    setAssignments({}); 
    setFeedback({}); 
    setMemTime(Math.ceil(memorizeTime));
    setScreen("memorize"); 
    setIsTimerPaused(true); 
    roundIndexRef.current = idx; 
    lastActionTime.current = Date.now();
    lastActivityTime.current = Date.now();
  }, []);

  useEffect(() => { buildRound(0); }, []);

  useEffect(() => {
    if (isTimerPaused || screen==="gameover" || paused) return;
    sessionTimerRef.current = setInterval(() => {
      setSessionLeft(t => { 
        if(t<=1){
          clearInterval(sessionTimerRef.current);
          clearInterval(memTimerRef.current);
          clearTimeout(flashTimeout.current);
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
    
    // accuracy = (correct faces / total faces shown) × 100
    const accuracy = tf>0 ? Math.round((tc/tf)*100) : 0;
    
    // score = accuracy (0-100)
    const score = accuracy;
    
    // Calculate average response time (between consecutive name drops)
    const rts = responseTimes.current;
    const avgRT = rts.length>0 ? Math.round(rts.reduce((a,b)=>a+b,0)/rts.length) : 0;
    
    // Calculate response time variability (standard deviation)
    let rtVar = 0;
    if (rts.length > 1) { 
      const mean = rts.reduce((a,b)=>a+b,0)/rts.length;
      const sq = rts.map(v => Math.pow(v - mean, 2)); 
      rtVar = Math.round(Math.sqrt(sq.reduce((a,b)=>a+b,0)/rts.length)); 
    }

    // total_attempts = every drag-drop name assignment
    const totalAttempts = totalAttemptsRef.current;
    // incorrect_attempts = total attempts - correct faces
    const incorrectAttempts = Math.max(totalAttempts - tc, 0);

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
        
        // Update header coins via event
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

  const onDragStart=(n)=>{
    ensureAudio();
    setDragging(n);
    lastActivityTime.current = Date.now();
  };
  
  const onDragEnd=()=>{
    setDragging(null);
    setDragOver(null);
  };
  
  const onDragOverFn=(e,fid)=>{
    e.preventDefault();
    setDragOver(fid);
  };
  
  const onDragLeave=()=>setDragOver(null);
  
  const onDrop=(e,fid)=>{
    e.preventDefault(); 
    ensureAudio();
    if(!dragging||paused) return; 
    if(feedback[fid]==="correct") return;
    
    lastActivityTime.current=Date.now();
    
    // Record response time (time between consecutive name drops)
    const now = Date.now();
    const rt = now - lastActionTime.current;
    // Only record meaningful response times (ignore if < 100ms or > 60s)
    if (rt >= 100 && rt <= 60000) {
      responseTimes.current.push(rt);
    }
    lastActionTime.current = now;
    
    // Track total attempts (every name assignment is one attempt)
    totalAttemptsRef.current++;
    
    const prev=Object.keys(assignments).find(k=>assignments[k]===dragging);
    if(prev){
      setAssignments(p=>{const n={...p};delete n[prev];return n;});
      setFeedback(p=>{const n={...p};delete n[prev];return n;});
    }
    setAssignments(p=>({...p,[fid]:dragging}));
    setFeedback(p=>{const n={...p};delete n[fid];return n;});
    setDragging(null);
    setDragOver(null);
  };

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
        // Count incorrect attempts
        incorrectAttemptsRef.current++;
        playWrongSound();
        showMotivation();
      }
    });
    
    setFeedback(fb); 
    setRoundScore({correct,total:faces.length});
    setTotalCorrect(c=>c+correct); 
    setTotalFaces(t=>t+faces.length);
    
    setTimeout(()=>{
      setScreen("flash");
      setIsTimerPaused(true);
      flashTimeout.current=setTimeout(()=>{
        const ni=roundIndexRef.current+1;
        setRoundIndex(ni);
        buildRound(ni);
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
    buildRound(0);
  };

  const goBack = () => {
    const accuracy = totalFaces>0 ? Math.round((totalCorrect/totalFaces)*100) : 0;
    navigateBack?.({ score: accuracy }, earnedCoins);
  };

  const sessionPct = (sessionLeft/SESSION_DURATION)*100;
  const timerColor = sessionLeft>30?"#4CAF82":sessionLeft>15?"#F5B731":sessionLeft>5?"#FF8C42":"#E05C6A";
  const isCompact = faces.length>4;
  const usedNamesSet = new Set(Object.entries(assignments).filter(([fid])=>feedback[fid]==="correct").map(([,n])=>n));
  const accuracy = totalFaces>0?Math.round((totalCorrect/totalFaces)*100):0;
  const goEmoji = accuracy>=80?"🏆":accuracy>=50?"😊":"😅";
  const goTitle = accuracy>=80?"Amazing memory!":accuracy>=50?"Good job!":"Keep practicing!";

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
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:'0 0 28px' }}>No rush — take your time!</p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:24 }}>
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 20px', minWidth:75 }}>
            <div style={{ color:'#00e5bf', fontSize:22, fontWeight:700 }}>{totalCorrect}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:4 }}>Correct</div>
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
    <div className="fn-game-wrapper">
      <Header totalCoins={headerTotalCoins} />
      <div className="fn-game-content">
        <div className="stars-bg"></div>
        {paused && renderPause()}
        {celebration && (
          <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', zIndex:10000, pointerEvents:'none' }}>
            <style>{`@keyframes fn-toastAnim{0%{opacity:0;transform:translateX(-50%) scale(0.5)}15%{opacity:1;transform:translateX(-50%) scale(1.1)}25%{transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-30px)}}`}</style>
            <div style={{ animation:'fn-toastAnim 1.8s ease forwards', background:'linear-gradient(135deg,#FFD700,#FFA500)', padding:'16px 32px', borderRadius:24, display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 30px rgba(255,215,0,0.5)', border:'2px solid rgba(255,255,255,0.5)' }}>
              <span style={{ fontSize:36 }}>{celebration.emoji}</span>
              <div><div style={{ fontFamily:"'Fredoka One', cursive", fontSize:20, color:'#fff' }}>{celebration.text}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{celebration.sub}</div></div>
            </div>
          </div>
        )}
        {motivation && (
          <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', zIndex:10000, pointerEvents:'none' }}>
            <style>{`@keyframes fn-motAnim{0%{opacity:0;transform:translateX(-50%) scale(0.5)}15%{opacity:1;transform:translateX(-50%) scale(1.1)}25%{transform:translateX(-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-30px)}}`}</style>
            <div style={{ animation:'fn-motAnim 1.8s ease forwards', background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'16px 32px', borderRadius:24, display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 30px rgba(118,75,162,0.5)', border:'2px solid rgba(255,255,255,0.5)' }}>
              <span style={{ fontSize:36 }}>{motivation.emoji}</span>
              <div><div style={{ fontFamily:"'Fredoka One', cursive", fontSize:20, color:'#fff' }}>{motivation.text}</div><div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{motivation.sub}</div></div>
            </div>
          </div>
        )}
        {showCoinReward && (
          <div className="fn-coin-reward-animation">
            <span className="fn-coin-emoji">🪙</span>
            <span className="fn-coin-amount">+{earnedCoins}</span>
          </div>
        )}

        {screen !== "gameover" && (
          <div style={{ position:'fixed', top:76, right:16, zIndex:100, display:'flex', gap:10 }}>
            <button onClick={togglePause} style={{ width:44, height:44, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.25)', background:'rgba(0,0,0,0.4)', color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>⏸</button>
          </div>
        )}

        {screen !== "gameover" && (
          <div className="fn-session-timer-wrap">
            <div className="fn-session-timer-fill" style={{ width:`${sessionPct}%`, background:timerColor, transition:isTimerPaused?'none':'width 0.5s linear' }} />
          </div>
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
                    <circle className="fn-countdown-circle-progress" cx="50" cy="50" r="45" style={{ strokeDasharray:`${2*Math.PI*45}`, strokeDashoffset:`${2*Math.PI*45*(1-memTime/4)}` }} />
                  </svg>
                  <div className="fn-countdown-number">👀</div>
                </div>
              </div>
            )}
          </>
        )}

        {screen === "recall" && (
          <>
            <div className="fn-phase-label">Who is who?</div>
            <div className={`fn-faces-grid${isCompact?" fn-compact":""}`}>
              {faces.map(face => {
                const assigned=assignments[face.id]; 
                const fb=feedback[face.id];
                let dropClass="fn-drop-zone";
                if(dragOver===face.id) dropClass+=" fn-drag-over";
                if(assigned&&!fb) dropClass+=" fn-filled";
                if(fb==="correct") dropClass+=" fn-filled fn-filled-correct";
                if(fb==="wrong") dropClass+=" fn-filled fn-filled-wrong";
                let cardClass="fn-face-card";
                if(fb==="correct") cardClass+=" fn-correct";
                if(fb==="wrong") cardClass+=" fn-wrong";
                return (
                  <div key={face.id} className={cardClass} onDragOver={e=>onDragOverFn(e,face.id)} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,face.id)}>
                    <div className="fn-face-img-wrap">{face.emoji}</div>
                    <div className="fn-name-badge">
                      <div className={dropClass}>
                        {assigned ? (
                          (fb==="correct" ? "✓ " : fb==="wrong" ? "✗ " : "") + assigned
                        ) :
                          "drop here"
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="fn-names-pool">
              {namePool.map(name => (
                <div key={name} className={`fn-name-chip${usedNamesSet.has(name)?" fn-used":""}${dragging===name?" fn-dragging":""}`}
                  draggable={!usedNamesSet.has(name)} onDragStart={()=>onDragStart(name)} onDragEnd={onDragEnd}
                >{name}</div>
              ))}
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
          const goEm = accuracy>=80?"🧠":accuracy>=50?"🏆":accuracy>=30?"⭐":"💪";
          const goTi = accuracy>=80?"Brilliant Memory!":accuracy>=50?"Great Recall!":accuracy>=30?"Nice Effort!":"Great Effort!";
          const goSu = accuracy>=80?"You are a memory superstar!":accuracy>=50?"Your brain is getting stronger!":accuracy>=30?"Every round makes you better!":"You showed up and tried — that takes courage!";
          const bgGrad = accuracy>=60?'linear-gradient(135deg,#0f0c29,#302b63,#24243e)':'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)';
          
          return (
            <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:bgGrad, overflow:'hidden' }}>
              <style>{`
                @keyframes fn-trophy{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(1) rotate(0deg)}}
                @keyframes fn-slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fn-glow{0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)}50%{box-shadow:0 0 40px rgba(255,215,0,0.6)}}
                @keyframes fn-conf{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
                .fn-cf{position:absolute;border-radius:2px;animation:fn-conf linear forwards;pointer-events:none}
              `}</style>
              {totalCorrect >= 2 && Array.from({length:25}).map((_,i) => (
                <div key={i} className="fn-cf" style={{ left:`${Math.random()*100}%`, top:`-${Math.random()*20}%`, background:['#FFD700','#FF6B6B','#4ECDC4','#A78BFA','#F5B731','#00E5BF'][i%6], width:Math.random()*12+5, height:Math.random()*12+5, animationDuration:`${Math.random()*3+2}s`, animationDelay:`${Math.random()*2}s`, borderRadius:Math.random()>0.5?'50%':'2px' }} />
              ))}
              <div style={{ fontSize:100, animation:'fn-trophy 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards', filter:'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}>{goEm}</div>
              <h1 style={{ fontFamily:"'Fredoka One', cursive", fontSize:42, color:'#fff', textShadow:'0 4px 15px rgba(0,0,0,0.3)', margin:'16px 0 8px', animation:'fn-slideUp 0.6s ease-out 0.3s both' }}>{goTi}</h1>
              <p style={{ fontSize:16, color:'rgba(255,255,255,0.7)', fontWeight:600, animation:'fn-slideUp 0.6s ease-out 0.4s both', maxWidth:400, textAlign:'center', lineHeight:1.5 }}>{goSu}</p>
              
              {/* Enhanced stats display */}
              <div style={{ display:'flex', gap:16, margin:'28px 0 20px', flexWrap:'wrap', justifyContent:'center', animation:'fn-slideUp 0.6s ease-out 0.5s both' }}>
                {[
                  { value: totalCorrect, label: 'Correct', color: '#00E5BF', icon: '✔️' },
                  { value: rounds, label: 'Rounds', color: '#F5B731', icon: '🔄' },
                  { value: `${accuracy}%`, label: 'Accuracy', color: '#A78BFA', icon: '🎯' },
                  { value: Math.round(responseTimes.current.reduce((a,b)=>a+b,0)/Math.max(1,responseTimes.current.length)) + 'ms', label: 'Avg Time', color: '#FF6B6B', icon: '⏱️' }
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
                animation:'fn-slideUp 0.6s ease-out 0.7s both' 
              }}>
                <span style={{ fontSize:32 }}>🪙</span>
                <span style={{ fontFamily:"'Fredoka One', cursive", fontSize:30, color:'#fff', textShadow:'2px 2px 0 rgba(0,0,0,0.2)' }}>+{earnedCoins}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.85)', background:'rgba(0,0,0,0.15)', padding:'4px 12px', borderRadius:20 }}>
                  {earnedCoins > 0 ? 'Coins Earned!' : 'Keep going!'}
                </span>
              </div>
              
              <div style={{ display:'flex', gap:14, marginTop:28, animation:'fn-slideUp 0.6s ease-out 0.9s both' }}>
                <button onClick={resetGame} onMouseEnter={e=>e.target.style.transform='translateY(-3px)'} onMouseLeave={e=>e.target.style.transform='translateY(0)'} style={{ padding:'16px 40px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#00a896,#00d4aa)', color:'#fff', fontSize:18, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 25px rgba(0,168,150,0.4)', transition:'transform 0.2s' }}>🔄 Play Again</button>
                <button onClick={goBack} onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.12)'} onMouseLeave={e=>e.target.style.background='rgba(255,255,255,0.06)'} style={{ padding:'16px 40px', borderRadius:50, border:'2px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.8)', fontSize:18, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>← Back</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}