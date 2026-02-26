import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../../components/common/Header/Header";
import './MemoryPadlocksGame.css';
import successSnd from '../../assets/Success.mp3';
import errorSnd from '../../assets/SoftFailSound.mp3';

const GAME_STATES = {
  MEMORIZE: 'MEMORIZE',
  MATCH: 'MATCH',
  RESULT: 'RESULT'
};

const INITIAL_LEVEL = 1;

const SUCCESS_SOUND = successSnd;
const ERROR_SOUND = errorSnd;

const MemoryPadlocksGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(GAME_STATES.MEMORIZE);
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [squares, setSquares] = useState([]);
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [userInputs, setUserInputs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(4);
  const [matchTimeLeft, setMatchTimeLeft] = useState(15);
  const [isCorrect, setIsCorrect] = useState(null);
  const [shake, setShake] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const generateLevelData = useCallback((lvl) => {
    const numItems = Math.min(lvl + 1, 6);
    const colors = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'];
    const newSquares = [];
    
    for (let i = 0; i < numItems; i++) {
        newSquares.push({
            id: i,
            number: Math.floor(Math.random() * 9) + 1,
            color: colors[i % colors.length]
        });
    }
    
    setSquares(newSquares);
    setShuffledIndices(Array.from({ length: numItems }, (_, i) => i));
    setUserInputs(new Array(numItems).fill(0));
    setGameState(GAME_STATES.MEMORIZE);
    setPhaseTransition(false);
    setGameOver(false);
    
    const memoTime = Math.max(4 - Math.floor(lvl / 3), 2);
    const matchTime = Math.max(15 + (lvl * 2), 10);
    
    setTimeLeft(memoTime);
    setMatchTimeLeft(matchTime);
    setIsCorrect(null);
  }, []);

  useEffect(() => {
    generateLevelData(level);
  }, [level, generateLevelData]);

  useEffect(() => {
    if (gameState === GAME_STATES.MEMORIZE && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === GAME_STATES.MEMORIZE && timeLeft === 0 && !gameOver) {
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
      }, 500); 
    }
  }, [gameState, timeLeft, gameOver, squares.length]);

  useEffect(() => {
    if (gameState === GAME_STATES.MATCH && matchTimeLeft > 0 && isCorrect !== true && !gameOver) {
      const timer = setTimeout(() => setMatchTimeLeft(matchTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === GAME_STATES.MATCH && matchTimeLeft === 0 && isCorrect !== true && !gameOver) {
        setGameOver(true);
    }
  }, [gameState, matchTimeLeft, isCorrect, gameOver]);

  const cycleValue = (originalIndex, delta) => {
    if (isCorrect === true || gameOver) return;
    const newInputs = [...userInputs];
    newInputs[originalIndex] = (newInputs[originalIndex] + delta + 10) % 10;
    setUserInputs(newInputs);
  };

  const playSound = (url) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const handleCheck = () => {
    if (gameOver) return;
    const results = userInputs.map((input, index) => input === squares[index].number);
    const allCorrect = results.every(r => r);
    
    if (allCorrect) {
      setIsCorrect(true);
      playSound(SUCCESS_SOUND);
      setTimeout(() => {
        setPhaseTransition(true);
        setTimeout(() => {
            setLevel(prev => prev + 1);
        }, 500);
      }, 2000);
    } else {
      setShake(true);
      setIsCorrect(false);
      playSound(ERROR_SOUND);
      setTimeout(() => {
        setShake(false);
        setIsCorrect(null);
      }, 600);
    }
  };

  const resetGame = () => {
    setLevel(INITIAL_LEVEL);
    generateLevelData(INITIAL_LEVEL);
  };

  const getMatchTimePercentage = () => {
    const initialMatchTime = Math.max(15 + (level * 2), 10);
    return (matchTimeLeft / initialMatchTime) * 100;
  };

  const getMemorizeTimePercentage = () => {
    const initialMemoTime = Math.max(4 - Math.floor(level / 3), 2);
    return (timeLeft / initialMemoTime) * 100;
  };

  const renderMemorize = () => (
    <div className={`phase-container memorize-phase ${phaseTransition ? 'fade-out' : ''}`}>
      <h2 className="phase-label">Memorize</h2>
      <div className="squares-grid">
        {squares.map((square, idx) => (
          <div 
            key={square.id} 
            className="memory-square" 
            style={{ 
                backgroundColor: square.color,
                animationDelay: `${idx * 0.1}s`
            }}
          >
            {square.number}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMatch = () => (
    <div className={`phase-container match-phase ${phaseTransition ? 'fade-out' : 'fade-in'}`}>
      <h2 className="phase-label">Unlock the Locks!</h2>
      <div className="padlocks-grid">
        {shuffledIndices.map((originalIndex) => {
          const square = squares[originalIndex];
          return (
            <div key={square.id} className={`padlock-wrapper ${shake ? 'shake' : ''}`}>
               <div className={`padlock ${isCorrect === true ? 'unlocked' : ''} ${userInputs[originalIndex] === square.number && isCorrect === true ? 'correct' : ''}`}>
                  <div className="padlock-shackle"></div>
                  <div className="padlock-body" style={{ backgroundColor: square.color }}>
                      <div className="dial-area">
                          <button className="dial-arrow up" onClick={() => cycleValue(originalIndex, 1)}>▲</button>
                          <div className="dial-value">{userInputs[originalIndex]}</div>
                          <button className="dial-arrow down" onClick={() => cycleValue(originalIndex, -1)}>▼</button>
                      </div>
                      {isCorrect === true && <div className="checkmark-overlay">✅</div>}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
      <button 
        className={`check-button ${isCorrect === true ? 'success' : ''}`} 
        onClick={handleCheck}
        disabled={isCorrect === true}
      >
        {isCorrect === true ? 'Great Job!' : 'Check'}
      </button>
    </div>
  );

  const renderGameOver = () => (
    <div className="phase-container game-over-phase fade-in">
        <h2 className="phase-label">Time's Up!</h2>
        <p className="game-over-text">Don't worry, you can try again!</p>
        <button className="check-button" onClick={resetGame}>Retry</button>
    </div>
  );

  return (
    <div className="memory-padlocks-game full-screen">
      <div className="mp-background-stars" />
      <Header />
      
      {!gameOver && (
        <div className="simple-progress-container">
          <div 
            className={`simple-progress-bar ${gameState === GAME_STATES.MEMORIZE ? 'memorize-progress' : 'match-progress'}`}
            style={{ 
              width: `${gameState === GAME_STATES.MEMORIZE ? getMemorizeTimePercentage() : getMatchTimePercentage()}%`,
              background: gameState === GAME_STATES.MATCH && matchTimeLeft <= 10 
                ? 'linear-gradient(90deg, #e74c3c, #c0392b)' 
                : undefined
            }}
          />
        </div>
      )}
      
      <main className="game-content">
        <div className="game-card">
            {gameOver ? renderGameOver() : (
                <>
                    {gameState === GAME_STATES.MEMORIZE && renderMemorize()}
                    {gameState === GAME_STATES.MATCH && renderMatch()}
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default MemoryPadlocksGame;