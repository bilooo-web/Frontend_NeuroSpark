import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Faces_NamesGame.css";
import Header from "../../components/common/Header/Header";
import breathingexercise from "../../assets/breathing-video.mp4"; // Import the video
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

// ADHD-friendly difficulty progression - SLOW and GENTLE
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

  // NOTE: totalCorrectRef and totalFacesRef are now updated DIRECTLY 
  // in the assignment-check useEffect (not via state→useEffect→ref) 
  // to avoid stale ref bugs when endGame fires from timer callback.

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
        // Shift lastActionTime forward by paused duration so next RT isn't inflated
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
    
    roundIndexRef.current = idx; 
    lastActionTime.current = Date.now();
    lastActivityTime.current = Date.now();
  }, []);

  useEffect(() => {
    setScreen("intro");
  }, []);

  // Breathing instruction cycle on intro screen
  useEffect(() => {
    if (screen === "intro") {
      
      let index = 0;
      
      const speakInstruction = (text) => {
        setBreathingInstruction(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      };

      const runBreathingCycle = () => {
        if (index < instructions.length) {
          speakInstruction(instructions[index].text);
          breathingIntervalRef.current = setTimeout(() => {
            index++;
            runBreathingCycle();
          }, instructions[index].duration);
        }
      };

      setTimeout(runBreathingCycle, 1000);

      return () => {
        if (breathingIntervalRef.current) {
          clearTimeout(breathingIntervalRef.current);
        }
        window.speechSynthesis.cancel();
      };
    }
  }, [screen]);

  // Breathing sounds using Web Audio API with brown noise
  useEffect(() => {
    if (screen === "intro") {
      
      const playBreathingSounds = async () => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        
        const audioCtx = new Ctx();
        breathingAudioCtxRef.current = audioCtx;
        
        // Function to create breathing sound (inhale)
        const createInhaleSound = (startTime) => {
          const now = audioCtx.currentTime;
          
          // Brown noise for realistic breath
          const bufferSize = 2 * audioCtx.sampleRate;
          const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          
          // Brown noise (more realistic for breathing)
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
          }
          
          const noise = audioCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          
          const gainNode = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 800; // Lower frequency for deeper breath
          
          noise.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Inhale: volume rises then falls slightly
          gainNode.gain.setValueAtTime(0, now + startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, now + startTime + 1.5);
          gainNode.gain.linearRampToValueAtTime(0.08, now + startTime + 2.5);
          gainNode.gain.linearRampToValueAtTime(0, now + startTime + 3.5);
          
          noise.start(now + startTime);
          noise.stop(now + startTime + 3.5);
        };
        
        // Function to create breathing sound (exhale)
        const createExhaleSound = (startTime) => {
          const now = audioCtx.currentTime;
          
          // Slightly different noise for exhale
          const bufferSize = 2 * audioCtx.sampleRate;
          const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.03 * white)) / 1.03;
            lastOut = output[i];
          }
          
          const noise = audioCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          
          const gainNode = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 600; // Lower for exhale
          
          noise.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Exhale: starts softer, peaks, then fades
          gainNode.gain.setValueAtTime(0, now + startTime);
          gainNode.gain.linearRampToValueAtTime(0.12, now + startTime + 1.8);
          gainNode.gain.linearRampToValueAtTime(0.05, now + startTime + 2.8);
          gainNode.gain.linearRampToValueAtTime(0, now + startTime + 4);
          
          noise.start(now + startTime);
          noise.stop(now + startTime + 4);
        };
        
        // Schedule a full breathing cycle (4 seconds inhale, 4 seconds exhale)
        // Repeat 4 times (about 32 seconds)
        for (let cycle = 0; cycle < 4; cycle++) {
          const cycleStart = cycle * 8; // 8 seconds per cycle
          
          // Inhale (first 4 seconds of cycle)
          createInhaleSound(cycleStart + 1); // Start after 1 sec
          
          // Exhale (next 4 seconds of cycle)
          createExhaleSound(cycleStart + 5); // Start at 5 sec
        }
      };
      
      playBreathingSounds();
      
      return () => {
        // Clean up audio when leaving intro screen
        if (breathingAudioCtxRef.current) {
          breathingAudioCtxRef.current.close();
          breathingAudioCtxRef.current = null;
        }
      };
    }
  }, [screen]);

  const startGameFromIntro = () => {
    // Stop breathing audio and instructions
    if (breathingIntervalRef.current) {
      clearTimeout(breathingIntervalRef.current);
    }
    window.speechSynthesis.cancel();
    
    // Close breathing audio context
    if (breathingAudioCtxRef.current) {
      breathingAudioCtxRef.current.close();
      breathingAudioCtxRef.current = null;
    }
    
    // Pause video
    if (videoRef.current) {
      videoRef.current.pause();
    }
    buildRound(0);
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
    
    // Score calculation:
    // - Accuracy base: accuracy * 0.6 (max 60 pts) — primary skill measure
    // - Progression bonus: 5 pts per COMPLETED round, capped at 30 (max 30 pts)
    // - Efficiency bonus: +10 if accuracy >= 80% (max 10 pts)
    // Total capped at 100
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
    // Use incorrectAttemptsRef directly — it only counts CONFIRMED wrong answers
    // from completed rounds. Computing (totalAttempts - tc) would incorrectly 
    // count unfinished-round drops as "incorrect".
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
    
    const now = Date.now();
    const rt = now - lastActionTime.current;
    if (rt >= 500 && rt <= 60000) {
      responseTimes.current.push(rt);
    }
    lastActionTime.current = now;
    
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
        incorrectAttemptsRef.current++;
        playWrongSound();
        showMotivation();
      }
    });
    
    setFeedback(fb); 
    setRoundScore({correct,total:faces.length});
    // Update refs DIRECTLY for accurate endGame analytics (state may be stale in timer callbacks)
    totalCorrectRef.current += correct;
    totalFacesRef.current += faces.length;
    setTotalCorrect(c=>c+correct); 
    setTotalFaces(t=>t+faces.length);
    
    setTimeout(()=>{
      completedRoundsRef.current += 1; // Round fully completed
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
    // Use refs for accurate values (state may be stale)
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
      
      {/* Session Timer - visible after header, always visible during game */}
      {screen !== "gameover" && screen !== "countdown" && (
        <div className="fn-session-timer-wrap fn-timer-after-header">
          <div className="fn-session-timer-fill" style={{ width:`${sessionPct}%`, background:timerColor, transition:isTimerPaused?'none':'width 0.5s linear' }} />
        </div>
      )}
      
      <div className="fn-game-content" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="stars-bg"></div>
        {paused && renderPause()}
        
        {/* Intro Breathing Video Screen with imported video */}
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
            {/* Breathing instruction that changes */}
            
          </div>
        )}
        
        {/* Countdown Screen (3,2,1) */}
        {screen === "countdown" && (
          <div className="fn-countdown-screen">
            <div className="fn-countdown-number-large">{countdown}</div>
            <p>Get ready...</p>
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

        {/* Timer is now shown after header */}

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
          const goEm = accuracy>=80?"🧠":accuracy>=60?"🏆":accuracy>=40?"⭐":"💪";
          const goTi = accuracy>=80?"Brilliant Memory!":accuracy>=60?"Great Job!":accuracy>=40?"Good Try!":"Great Effort!";
          const goSu = accuracy>=80?"You are a memory superstar!":accuracy>=60?"Your brain is getting stronger!":accuracy>=40?"Every round makes you better!":"You showed up and tried — that's what matters!";
          const bgGrad = 'linear-gradient(135deg, #8BE3D8, #6BC5B8)';
          
          const coinsEarned = earnedCoins || 0;
          
          return (
            <div className="fn-gameover-screen">
              <div className="fn-gameover-content">
                <div className="fn-go-emoji">{goEm}</div>
                <h1 className="fn-go-title">{goTi}</h1>
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
                
              </div>            </div>
          );
        })()}
      </div>
    </div>
  );
}