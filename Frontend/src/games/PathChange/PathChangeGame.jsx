import { useState, useEffect, useRef } from "react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import "./PathChangeGame.css";

import meditationVideo from "../../assets/breathing-exercise.mp4";

function PathChangePuzzle() {
  const [tile1Rotation, setTile1Rotation] = useState(0);
  const [tile2Rotation, setTile2Rotation] = useState(0);
  const [tile3Rotation, setTile3Rotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false); 
  const [_gameOver, setGameOver] = useState(false);
  
  const [showMeditation, setShowMeditation] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [countdown, setCountdown] = useState(3); 
  const timerRef = useRef(null);
  const meditationVideoRef = useRef(null);
  const countdownRef = useRef(null);

  const rotateTile = (tileNumber) => {
    if (tileNumber === 1) {
      setTile1Rotation((prev) => prev + 90);
    } else if (tileNumber === 2) {
      setTile2Rotation((prev) => prev + 90);
    } else if (tileNumber === 3) {
      setTile3Rotation((prev) => prev + 90);
    }
  };

  const _addTime = (seconds) => {
    setTimeLeft((prev) => prev + seconds);
    if (!isRunning) setIsRunning(true);
  };

  const _resetTimer = () => {
    setTimeLeft(60);
    setIsRunning(true);
    setGameOver(false);
  };

  const _toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const _skipMeditation = () => {
    if (meditationVideoRef.current) {
      meditationVideoRef.current.pause();
    }
    setShowMeditation(false);
    setShowCountdown(true);
  };

  const handleMeditationEnd = () => {
    setShowMeditation(false);
    setShowCountdown(true);
  };

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(countdownRef.current);
      setTimeout(() => {
        setShowCountdown(false);
        setShowGame(true);
        setIsRunning(true); 
      }, 500);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showCountdown, countdown]);

  useEffect(() => {
    if (isRunning && timeLeft > 0 && showGame) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, showGame]);

  const _formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercentage = (timeLeft / 60) * 100;

  const getCountdownText = () => {
    switch(countdown) {
      case 3: return "READY";
      case 2: return "SET";
      case 1: return "GO!";
      default: return "";
    }
  };

  return (
    <div className="game-container">
      <div className="stars-bg-path" />
      <Header />
      
      {showMeditation && (
        <div className="video-screen meditation-screen">
          <div className="video-overlay">
  
            <div className="video-controls">
          
              <button className="mute-btn" onClick={toggleMute}>
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
          <video
            ref={meditationVideoRef}
            className="fullscreen-video"
            autoPlay
            muted={isMuted}
            onEnded={handleMeditationEnd}
          >
            <source src={meditationVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      
      {showCountdown && (
        <div className="video-screen countdown-screen">
          <div className="countdown-overlay">
            <div className="countdown-circle">
              <div className="countdown-number">{countdown > 0 ? countdown : ""}</div>
              <div className="countdown-text">{getCountdownText()}</div>
            </div>
            <div className="countdown-subtitle">Get ready to connect the paths!</div>
          </div>
        </div>
      )}
      
      {showGame && (
        <>
          <div className="simple-progress-container">
            <div 
              className="simple-progress-bar" 
              style={{ 
                width: `${timePercentage}%`,
                transition: timeLeft <= 10 ? 'width 1s linear' : 'width 0.5s linear'
              }}
            />
          </div>
          
          <div className="puzzle-area">
            <div className="road-segment road-vertical-1"></div>
            <div className="road-segment road-curve-1"></div>
            <div className="road-segment road-vertical-2"></div>
            <div className="road-segment road-vertical-3"></div>
            <div className="road-segment road-vertical-5"></div>
            <div className="road-segment road-vertical-6"></div>
            <div className="road-segment road-vertical-7"></div>
            <div className="road-segment road-curve-10"></div>
            
            <div className="road-segment road-vertical-4"></div>
            <div className="road-segment road-curve-4"></div>
            <div className="road-segment road-curve-5"></div>
            <div className="road-segment road-curve-6"></div>
            <div className="road-segment road-curve-7"></div>
            <div className="road-segment road-curve-8"></div>
            <div className="road-segment road-curve-9"></div>
            <div className="road-segment road-curve-11"></div>
            <div className="road-segment road-curve-12"></div>

            <div className="road-segment road-horizontal-1"></div>
            <div className="road-segment road-horizontal-2"></div>
            <div className="road-segment road-horizontal-3"></div>
            <div className="road-segment road-horizontal-4"></div>
            <div className="road-segment road-horizontal-5"></div>
            <div className="road-segment road-horizontal-6"></div>

            <div className="node node-red" style={{ top: '80px', left: '100px' }}>
              <div className="node-inner"></div>
            </div>

            <div className="node node-yellow" style={{ top: '80px', right: '80px' }}>
              <div className="node-inner"></div>
            </div>

            <div className="node node-green" style={{ top: '320px', left: '230px' }}>
              <div className="node-inner"></div>
            </div>

            <div className="node node-purple" style={{ bottom: '310px', right: '50px' }}>
              <div className="node-inner"></div>
            </div>

            <div className="destination-block"></div>

            <div 
              className="tile tile-1"
              onClick={() => rotateTile(1)}
              style={{ 
                top: '225px', 
                left: '25px',
                transform: `rotate(${tile1Rotation}deg)`
              }}
            >              {(tile1Rotation % 360 === 90 || tile1Rotation % 360 === 270) && (
                <div className="tile-curve-11-pattern"></div>
              )}
              
              {(tile1Rotation % 360 === 0 || tile1Rotation % 360 === 180) && (
                <div className="tile-vertical-4-pattern">
                  <div className="road-marking"></div>
                </div>
              )}
            </div>

            <div 
              className="tile tile-2"
              onClick={() => rotateTile(2)}
              style={{ 
                top: '410px', 
                right: '115px',
                transform: `rotate(${tile2Rotation}deg)`
              }}
            >
              {(tile2Rotation % 360 === 90 || tile2Rotation % 360 === 270) && (
                <div className="tile-vertical-3-pattern"></div>
              )}
              
              {(tile2Rotation % 360 === 0 || tile2Rotation % 360 === 180) && (
                <div className="tile-curve-6-2-pattern"></div>
              )}
            </div>

            <div 
              className="tile tile-3"
              onClick={() => rotateTile(3)}
              style={{ 
                top: '560px', 
                left: '105px',
                transform: `rotate(${tile3Rotation}deg)`
              }}
            >
              {(tile3Rotation % 360 === 0 || tile3Rotation % 360 === 180) && (
                <div className="tile-curve-6-pattern"></div>
              )}
              
              {(tile3Rotation % 360 === 90 || tile3Rotation % 360 === 270) && (
                <div className="tile-vertical-6-pattern"></div>
              )}
            </div>
          </div>
        </>
      )}
      
    </div>
  );
}

export default PathChangePuzzle;