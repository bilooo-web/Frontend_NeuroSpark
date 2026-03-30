import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PathChangeGame from './PathChange/PathChangeGame';
import MemoryPadlocksGame from './MemoryPadlocks/MemoryPadlocksGame';
import FacesNamesGame from './Faces&Names/Faces_NamesGame';
import PairOfCardsGame from './PairOfCards/PairOfCards';

const GameSwitcher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameInfo, setGameInfo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const sessionIdRef = useRef(null);
  const gameInfoRef = useRef(null);
  const initCalled = useRef(false);
  const gameFinishedRef = useRef(false);
  const gameActiveRef = useRef(false); // Tracks if game is actively being played (any role)
  const [totalCoins, setTotalCoins] = useState(() => {
    const saved = localStorage.getItem('totalCoins');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
      navigate(`/challenges/${id}`, { replace: true });
      return;
    }
    if (!initCalled.current) {
      initCalled.current = true;
      initGame();
    }
  }, [id]);

  // Listen for coin updates
  useEffect(() => {
    const handleCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) {
        setTotalCoins(e.detail.totalCoins);
      }
    };
    
    window.addEventListener('coins-updated', handleCoinsUpdated);
    return () => window.removeEventListener('coins-updated', handleCoinsUpdated);
  }, []);

  // Browser tab close / refresh guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (gameActiveRef.current && !gameFinishedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Browser back button guard
  useEffect(() => {
    if (!gameActiveRef.current || gameFinishedRef.current) return;

    // Push a dummy state so we can intercept back
    window.history.pushState({ gameGuard: true }, '');

    const handlePopState = (e) => {
      if (gameActiveRef.current && !gameFinishedRef.current) {
        // Re-push state to prevent leaving
        window.history.pushState({ gameGuard: true }, '');
        setShowLeavePopup(true);
        setPendingNavigation(`/challenges/${id}`);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [id, sessionId, loading]);

  // Intercept Header navigation (logo, nav links, dashboard, logout)
  useEffect(() => {
    const handleHeaderNavigate = (e) => {
      if (!gameActiveRef.current || gameFinishedRef.current) return;
      // Cancel the navigation — GameSwitcher will handle it
      e.preventDefault();
      setShowLeavePopup(true);
      setPendingNavigation(e.detail?.path || '/');
    };

    window.addEventListener('header-navigate', handleHeaderNavigate);
    return () => window.removeEventListener('header-navigate', handleHeaderNavigate);
  }, []);

  // Handle confirmed leave
  const handleConfirmLeave = async () => {
    setShowLeavePopup(false);
    // Only abandon session if one exists (child users)
    if (sessionIdRef.current && abandonSession) {
      await abandonSession();
    }
    gameFinishedRef.current = true;
    gameActiveRef.current = false;
    setGameFinished(true);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    } else {
      navigate(`/challenges/${id}`);
    }
  };

  const handleCancelLeave = () => {
    setShowLeavePopup(false);
    setPendingNavigation(null);
  };

  const initGame = async () => {
    try {
      const gamesRes = await api.get('/games');
      const games = Array.isArray(gamesRes) ? gamesRes : gamesRes.data || [];
      const game = games.find(g => g.game_slug === id);

      if (!game) {
        setGameInfo(null);
        setLoading(false);
        return;
      }

      setGameInfo(game);
      gameInfoRef.current = game;
      gameActiveRef.current = true; // Game is now active for all users

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'child') {
        // Sync real coins from backend
        try {
          const profileRes = await api.get('/child/profile');
          if (profileRes?.stats?.total_coins != null) {
            localStorage.setItem('totalCoins', String(profileRes.stats.total_coins));
            setTotalCoins(profileRes.stats.total_coins);
            window.dispatchEvent(new CustomEvent('coins-synced'));
          }
        } catch (e) { /* non-critical */ }

        await createSession(game);
      }
    } catch (err) {
      console.error('Game init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (game) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'child') return null;
    try {
      const g = game || gameInfoRef.current;
      if (!g) return null;
      const res = await api.post(`/child/games/${g.id}/start`, {});
      const newId = res.session_id;
      setSessionId(newId);
      sessionIdRef.current = newId;
      return newId;
    } catch (err) {
      console.warn('Could not start session:', err.message);
      return null;
    }
  };

  const startNewSession = useCallback(async () => {
    if (!gameInfoRef.current) return null;
    return await createSession(gameInfoRef.current);
  }, []);

  const abandonSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await api.post(`/child/game-sessions/${sid}/abandon`);
    } catch (err) {
      console.warn('Could not abandon session:', err.message);
    }
    sessionIdRef.current = null;
  }, []);

  /**
   * Calculate coins based on performance and game's max reward
   * Formula: base_coins * (accuracy/100) + bonus for perfect performance
   */
  const calculateCoinsEarned = (results, maxReward) => {
    if (!maxReward) return Math.max(1, Math.round(results.accuracy / 20));
    
    const accuracy = results.accuracy || 0;
    const incorrectAttempts = results.incorrectAttempts || 0;
    
    // Base coins based on accuracy (0-100%)
    let coins = Math.round(maxReward * (accuracy / 100));
    
    // Bonus for perfect accuracy (90%+)
    if (accuracy >= 90) {
      coins += Math.round(maxReward * 0.25);
    } else if (accuracy >= 75) {
      coins += Math.round(maxReward * 0.1);
    }
    
    // Bonus for no mistakes
    if (incorrectAttempts === 0) {
      coins += Math.round(maxReward * 0.2);
    }
    
    
    // Ensure minimum 1 coin for participation
    return Math.max(1, Math.min(coins, Math.round(maxReward * 1.5)));
  };

  const handleGameComplete = useCallback(async (results) => {
    let coinsEarned = 0;
    let totalCoinsFromServer = null;
    const currentSessionId = sessionIdRef.current;
    const game = gameInfoRef.current;

    if (currentSessionId && game) {
      try {
        // Calculate coins based on game's reward_coins
        const calculatedCoins = calculateCoinsEarned(results, game.reward_coins || 10);
        
        // Ensure all metrics are properly rounded/sanitized
        const payload = {
          score: Math.min(100, Math.max(0, Math.round(results.score || 0))),
          duration: Math.max(1, Math.round(results.duration || 1)),
          accuracy: Math.min(100, Math.max(0, Math.round(results.accuracy || 0))),
          incorrect_attempts: Math.max(0, Math.round(results.incorrectAttempts || 0)),
          total_attempts: Math.max(1, Math.round(results.totalAttempts || 1)),
          avg_response_time: Math.max(0, Math.round(results.avgResponseTime || 0)),
          response_time_variability: Math.max(0, Math.round(results.responseTimeVariability || 0)),
          inactivity_events: Math.max(0, Math.round(results.inactivityEvents || 0)),
          // NOTE: coins_earned is calculated server-side, do not send from client
        };

        const res = await api.post(`/child/game-sessions/${currentSessionId}/complete`, payload);
        
        // Use server response if available, otherwise use our calculation
        coinsEarned = res.coins_earned !== undefined ? res.coins_earned : calculatedCoins;
        totalCoinsFromServer = res.total_coins;

        // Update localStorage and dispatch event
        if (totalCoinsFromServer != null) {
          localStorage.setItem('totalCoins', String(totalCoinsFromServer));
          setTotalCoins(totalCoinsFromServer);
          window.dispatchEvent(new CustomEvent('coins-updated', {
            detail: { totalCoins: totalCoinsFromServer, earned: coinsEarned }
          }));
        } else {
          // Fallback: update local coins
          const currentCoins = parseInt(localStorage.getItem('totalCoins') || '0');
          const newTotal = currentCoins + coinsEarned;
          localStorage.setItem('totalCoins', String(newTotal));
          setTotalCoins(newTotal);
          window.dispatchEvent(new CustomEvent('coins-updated', {
            detail: { totalCoins: newTotal, earned: coinsEarned }
          }));
        }

        sessionIdRef.current = null;
        gameFinishedRef.current = true;
        gameActiveRef.current = false;
        setGameFinished(true);
      } catch (err) {
        console.error('Failed to complete session:', err);
      }
    }

    // Update local scores as cache
    const scoreVal = Math.min(100, Math.max(0, Math.round(results.score || 0)));
    localStorage.setItem(`${id}-last`, scoreVal.toString());
    const prevBest = parseInt(localStorage.getItem(`${id}-best`) || '0');
    const newBest = Math.max(prevBest, scoreVal);
    localStorage.setItem(`${id}-best`, newBest.toString());

    return { 
      coinsEarned, 
      bestScore: newBest, 
      totalCoins: totalCoinsFromServer || parseInt(localStorage.getItem('totalCoins') || '0')
    };
  }, [id]);

  const navigateBack = useCallback((results, coinsEarned) => {
    const scoreVal = Math.min(100, Math.max(0, Math.round(results?.score || 0)));
    const prevBest = parseInt(localStorage.getItem(`${id}-best`) || '0');
    navigate(`/challenges/${id}`, {
      state: {
        gameResults: { lastScore: scoreVal, bestScore: prevBest },
        earnedCoins: coinsEarned || 0,
      },
    });
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#00a896', borderRadius: '50%', animation: 'gsSpin 0.7s linear infinite' }} />
        <style>{`@keyframes gsSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  if (!token) return null;

  const gameProps = {
    onGameComplete: handleGameComplete,
    startNewSession,
    abandonSession,
    navigateBack,
    gameInfo,
    totalCoins,
  };

  const leavePopup = showLeavePopup ? (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'32px 40px', maxWidth:400, width:'90%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'#1a1a2e', margin:'0 0 8px' }}>Leave Game?</h2>
        <p style={{ fontSize:14, color:'#64748b', marginBottom:24, lineHeight:1.6 }}>Your progress will be lost and this session will be abandoned. Are you sure?</p>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={handleCancelLeave} style={{ flex:1, padding:'14px', borderRadius:50, border:'2px solid #e2e8f0', background:'#fff', color:'#334155', fontSize:16, fontWeight:600, cursor:'pointer' }}>No, Stay</button>
          <button onClick={handleConfirmLeave} style={{ flex:1, padding:'14px', borderRadius:50, border:'none', background:'linear-gradient(135deg,#e74c3c,#c0392b)', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer' }}>Yes, Leave</button>
        </div>
      </div>
    </div>
  ) : null;

  let gameComponent;
  switch (id) {
    case 'path-change':
      gameComponent = <PathChangeGame {...gameProps} />;
      break;
    case 'padlocks':
      gameComponent = <MemoryPadlocksGame {...gameProps} />;
      break;
    case 'faces-and-names':
      gameComponent = <FacesNamesGame {...gameProps} />;
      break;
    case 'pair-of-cards':
      gameComponent = <PairOfCardsGame {...gameProps} />;
      break;
    default:
      gameComponent = (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: '#fff', background: '#1a1a1a', gap: '16px' }}>
          <p>🚧 This game is coming soon!</p>
          <button onClick={() => navigate('/challenges')} style={{ marginTop: '16px', padding: '12px 32px', borderRadius: '30px', border: 'none', background: '#00a896', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
            Back to Challenges
          </button>
        </div>
      );
  }

  return (
    <>
      {gameComponent}
      {leavePopup}
    </>
  );
};

export default GameSwitcher;