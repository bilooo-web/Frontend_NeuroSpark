import { useState, useEffect, useRef } from "react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import "./PathChangeGame.css";

import meditationVideo from "../../assets/breathing-exercise.mp4";

function PathChangeGame() {
  const [tile1Rotation, setTile1Rotation] = useState(0);
  const [tile2Rotation, setTile2Rotation] = useState(0);
  const [tile3Rotation, setTile3Rotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(true); 
  const [gameOver, setGameOver] = useState(false);
  
  const CANVAS_OFFSET_Y = 70;
  
  const [ball, setBall] = useState({
    color: 'red',
    position: { x: 1370, y: window.innerHeight - 150 + CANVAS_OFFSET_Y },
    velocity: { x: -2, y: 0 },
    isMoving: true,
    visible: true,
    rotation: 0
  });
  
  const [showMeditation, setShowMeditation] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [countdown, setCountdown] = useState(3); 
  
  const timerRef = useRef(null);
  const meditationVideoRef = useRef(null);
  const countdownRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  
  // SIMPLIFIED PHYSICS - CONSTANT SPEED
  const BALL_SPEED = 2.5; // Constant speed
  const TRANSITION_SMOOTHNESS = 0.3;

  const rotateTile = (tileNumber) => {
    if (tileNumber === 1) {
      setTile1Rotation((prev) => prev + 90);
    } else if (tileNumber === 2) {
      setTile2Rotation((prev) => prev + 90);
    } else if (tileNumber === 3) {
      setTile3Rotation((prev) => prev + 90);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skipMeditation = () => {
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

  // COMPLETELY REWRITTEN PATH DETECTION - SIMPLER AND MORE RELIABLE
  const isOnRoad = (x, y) => {
    const OFFSET = CANVAS_OFFSET_Y;
    const TOL = 40; // Generous tolerance
    
    // Get tile states
    const tile1Angle = tile1Rotation % 360;
    const tile2Angle = tile2Rotation % 360;
    const tile3Angle = tile3Rotation % 360;
    
    // 1. DESTINATION BLOCK
    const destY = window.innerHeight - 210 + OFFSET;
    if (x > 1300 - TOL && x < 1450 + TOL && y > destY - TOL && y < destY + 120 + TOL) {
      return { onRoad: true, direction: { x: -1, y: 0 }, centerY: destY + 60 };
    }
    
    // 2. ROAD-HORIZONTAL-1
    const h1_y = window.innerHeight - 700 + OFFSET;
    if (y > h1_y - TOL && y < h1_y + 60 + TOL && x > 900 - TOL && x < 1300 + TOL) {
      return { onRoad: true, direction: { x: -1, y: 0 }, centerY: h1_y + 30 };
    }
    
    // 3. ROAD-CURVE-1
    const curve1_y = 559.2 - 60 + OFFSET;
    const curve1_centerX = 906;
    const curve1_centerY = curve1_y;
    if (x > 776 - TOL && x < 906 + TOL && y > curve1_y - TOL && y < curve1_y + 130 + TOL) {
      const dx = x - curve1_centerX;
      const dy = y - curve1_centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30 && dist < 150) {
        const angle = Math.atan2(dy, dx);
        return { 
          onRoad: true, 
          direction: { x: -Math.sin(angle), y: Math.cos(angle) }
        };
      }
    }
    
    // 4. ROAD-VERTICAL-3
    const v3_top = 460 - 60 + OFFSET;
    const v3_left = window.innerWidth - 700;
    const v3_centerX = v3_left + 30;
    if (x > v3_left - TOL && x < v3_left + 60 + TOL && y > v3_top - TOL && y < v3_top + 110 + TOL) {
      return { onRoad: true, direction: { x: 0, y: -1 }, centerX: v3_centerX };
    }
    
    // 5-7. TILE-2 AREA with rotation support
    const tile2_left = window.innerWidth - 115;
    const tile2_top = 410 - 60 + OFFSET;
    const tile2_centerX = tile2_left + 57.5;
    const tile2_centerY = tile2_top + 57.5;
    const connection_y = tile2_top + 57.5; // Center height
    
    if (tile2Angle === 0 || tile2Angle === 180) {
      // CURVE ACTIVE - Creates a smooth 90-degree turn from horizontal (left) to vertical (down)
      
      // Extended horizontal approach path
      if (x > v3_centerX - 30 && x < tile2_left - 10 && 
          y > connection_y - 45 && y < connection_y + 45) {
        return { onRoad: true, direction: { x: 1, y: 0 }, centerY: connection_y };
      }
      
      // TILE-2 AREA - Large bounding box for curve detection
      if (x > tile2_left - 50 && x < tile2_left + 130 && 
          y > tile2_top - 50 && y < tile2_top + 130) {
        
        // The curve is in the BOTTOM-LEFT quadrant of the tile
        // It goes from LEFT (horizontal) to DOWN (vertical)
        const dx = x - tile2_centerX;
        const dy = y - tile2_centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Check if in the curve area (bottom-left quadrant)
        if (x < tile2_centerX + 10 && y > tile2_centerY - 10) {
          
          // ENTERING FROM LEFT (horizontal)
          if (x < tile2_centerX - 20 && Math.abs(y - connection_y) < 45) {
            return { onRoad: true, direction: { x: 1, y: 0 }, centerY: connection_y };
          }
          
          // IN THE CURVE - calculate tangent direction
          if (distFromCenter > 10 && distFromCenter < 70) {
            const angle = Math.atan2(dy, dx);
            
            // For a curve in bottom-left quadrant going from left to down
            // The tangent perpendicular to the radius
            const tangentX = -dy;  // perpendicular to radius
            const tangentY = dx;   // perpendicular to radius
            const magnitude = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
            
            if (magnitude > 0) {
              // Normalize the tangent direction
              const dirX = tangentX / magnitude;
              const dirY = tangentY / magnitude;
              
              // Make sure we're going in the right direction (clockwise turn)
              // From left (positive X) to down (positive Y)
              if (dirX > -0.5 || dirY > -0.5) {
                return {
                  onRoad: true,
                  direction: { x: dirX, y: dirY },
                  centerX: tile2_centerX,
                  centerY: tile2_centerY
                };
              }
            }
          }
          
          // EXITING DOWNWARD (vertical)
          if (y > tile2_centerY + 15 && Math.abs(x - tile2_centerX) < 45) {
            return { onRoad: true, direction: { x: 0, y: 1 }, centerX: tile2_centerX };
          }
        }
      }
      
      // Extended vertical exit path after the tile
      const exit_top = tile2_top + 95;
      const exit_bottom = 372 - 60 + OFFSET + 80;
      if (x > tile2_centerX - 45 && x < tile2_centerX + 45 && 
          y > exit_top && y < exit_bottom) {
        return { onRoad: true, direction: { x: 0, y: 1 }, centerX: tile2_centerX };
      }
      
    } else {
      // VERTICAL ACTIVE - straight through (90° or 270°)
      const vertical_top = tile2_top - 60;
      const vertical_bottom = 372 - 60 + OFFSET + 80;
      
      if (x > tile2_centerX - 45 && x < tile2_centerX + 45 && 
          y > vertical_top && y < vertical_bottom) {
        return { onRoad: true, direction: { x: 0, y: 1 }, centerX: tile2_centerX };
      }
    }
    
    // 8. ROAD-CURVE-9
    const curve9_top = 372 - 60 + OFFSET;
    const curve9_left = window.innerWidth - 790;
    if (x > curve9_left - 40 && x < curve9_left + 140 && 
        y > curve9_top - 40 && y < curve9_top + 140) {
      const dx = x - curve9_left;
      const dy = y - curve9_top;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 25 && dist < 130) {
        const angle = Math.atan2(dy, dx);
        return { 
          onRoad: true, 
          direction: { x: -Math.sin(angle), y: Math.cos(angle) }
        };
      }
    }
    
    // 9. ROAD-VERTICAL-4
    const v4_top = 470 - 60 + OFFSET;
    if (x > 644 - TOL && x < 704 + TOL && y > v4_top - TOL && y < v4_top + 80 + TOL) {
      return { onRoad: true, direction: { x: 0, y: 1 }, centerX: 674 };
    }
    
    // 10. ROAD-CURVE-4
    const curve4_bottom = window.innerHeight - 190 + OFFSET;
    const curve4_top = curve4_bottom - 135;
    if (x > 569 - TOL && x < 704 + TOL && y > curve4_top - TOL && y < curve4_bottom + TOL) {
      const dx = x - 569;
      const dy = y - curve4_bottom;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 35 && dist < 150) {
        const angle = Math.atan2(dy, dx);
        return { 
          onRoad: true, 
          direction: { x: -Math.sin(angle), y: Math.cos(angle) }
        };
      }
    }
    
    // 11. ROAD-HORIZONTAL-4
    const h4_bottom = window.innerHeight - 190 + OFFSET;
    const h4_top = h4_bottom - 60;
    if (y > h4_top - TOL && y < h4_bottom + TOL && x > 230 - TOL && x < 580 + TOL) {
      return { onRoad: true, direction: { x: -1, y: 0 }, centerY: h4_top + 30 };
    }
    
    // 12. TILE-3 with rotation
    const tile3_top = 560 - 60 + OFFSET;
    const tile3_left = 105;
    const tile3_centerX = tile3_left + 57.5;
    const tile3_centerY = tile3_top + 57.5;
    
    if (x > tile3_left - TOL && x < tile3_left + 115 + TOL && 
        y > tile3_top - TOL && y < tile3_top + 115 + TOL) {
      
      if (tile3Angle === 0 || tile3Angle === 180) {
        // Curve pattern
        const dx = x - tile3_centerX;
        const dy = y - tile3_centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 65) {
          const angle = Math.atan2(dy, dx);
          return { 
            onRoad: true, 
            direction: { x: -Math.sin(angle), y: Math.cos(angle) }
          };
        }
      } else {
        // Vertical pattern
        return { onRoad: true, direction: { x: 0, y: -1 }, centerX: tile3_centerX };
      }
    }
    
    // 13. ROAD-CURVE-10
    const curve10_top = 551 - 60 + OFFSET;
    if (x > 100 - TOL && x < 230 + TOL && y > curve10_top - TOL && y < curve10_top + 130 + TOL) {
      const dx = x - 100;
      const dy = y - curve10_top;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 35 && dist < 150) {
        const angle = Math.atan2(dy, dx);
        return { 
          onRoad: true, 
          direction: { x: -Math.sin(angle), y: Math.cos(angle) }
        };
      }
    }
    
    // 14. ROAD-VERTICAL-2
    const v2_top = 420 - 60 + OFFSET;
    if (x > 100 - TOL && x < 160 + TOL && y > v2_top - TOL && y < v2_top + 140 + TOL) {
      return { onRoad: true, direction: { x: 0, y: -1 }, centerX: 130 };
    }
    
    // 15. TILE-1 with rotation
    const tile1_top = 225 - 60 + 70 + OFFSET;
    const tile1_left = 25;
    const tile1_centerX = tile1_left + 57.5;
    
    if (x > tile1_left - TOL && x < tile1_left + 140 + TOL && 
        y > tile1_top - TOL && y < tile1_top + 115 + TOL) {
      
      if (tile1Angle === 0 || tile1Angle === 180) {
        // Vertical pattern
        return { onRoad: true, direction: { x: 0, y: -1 }, centerX: tile1_centerX };
      } else {
        // Curve pattern
        const tile1_centerY = tile1_top + 57.5;
        const dx = x - tile1_centerX;
        const dy = y - tile1_centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 65) {
          const angle = Math.atan2(dy, dx);
          return { 
            onRoad: true, 
            direction: { x: -Math.sin(angle), y: Math.cos(angle) }
          };
        }
      }
    }
    
    // 16. ROAD-VERTICAL-7
    const v7_top = 200 - 60 + OFFSET;
    if (x > 100 - TOL && x < 160 + TOL && y > v7_top - TOL && y < v7_top + 130 + TOL) {
      return { onRoad: true, direction: { x: 0, y: -1 }, centerX: 130 };
    }
    
    // 17. ROAD-CURVE-12
    const curve12_top = 100 - 60 + OFFSET;
    if (x > 101 - TOL && x < 203 + TOL && y > curve12_top - TOL && y < curve12_top + 102 + TOL) {
      const dx = x - 101;
      const dy = y - curve12_top;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 25 && dist < 130) {
        const angle = Math.atan2(dy, dx);
        return { 
          onRoad: true, 
          direction: { x: -Math.sin(angle), y: Math.cos(angle) }
        };
      }
    }
    
    // 18. ROAD-HORIZONTAL-6 - FINISH
    const h6_bottom = window.innerHeight - 330 + OFFSET;
    const h6_top = h6_bottom - 60;
    if (y > h6_top - TOL && y < h6_bottom + TOL && x > 200 - TOL && x < 440 + TOL) {
      return { onRoad: true, direction: { x: 1, y: 0 }, centerY: h6_top + 30 };
    }
    
    return { onRoad: false, direction: { x: 0, y: 0 } };
  };

  // COMPLETELY REWRITTEN PHYSICS - MAINTAINS CONSTANT SPEED
  useEffect(() => {
    if (showGame && ball.isMoving) {
      const animate = (currentTime) => {
        const deltaTime = Math.min((currentTime - lastTimeRef.current) / 16.67, 2);
        lastTimeRef.current = currentTime;
        
        setBall(prev => {
          const { position, velocity } = prev;
          
          const roadCheck = isOnRoad(position.x, position.y);
          
          let newVelocity = { ...velocity };
          let newPosition = { ...position };
          
          if (roadCheck.onRoad) {
            // ON ROAD - smooth transition to road direction
            const { direction, centerX, centerY } = roadCheck;
            const targetVelX = direction.x * BALL_SPEED;
            const targetVelY = direction.y * BALL_SPEED;
            
            // Smoothly interpolate velocity
            newVelocity.x += (targetVelX - newVelocity.x) * TRANSITION_SMOOTHNESS;
            newVelocity.y += (targetVelY - newVelocity.y) * TRANSITION_SMOOTHNESS;
            
            // Apply movement
            newPosition.x = position.x + newVelocity.x * deltaTime;
            newPosition.y = position.y + newVelocity.y * deltaTime;
            
            // Apply stronger centering force for curves (when both centerX and centerY are defined)
            const centeringStrength = (centerX !== undefined && centerY !== undefined) ? 0.08 : 0.04;
            
            if (centerX !== undefined) {
              const pullX = (centerX - newPosition.x) * centeringStrength;
              newPosition.x += pullX * deltaTime;
            }
            
            if (centerY !== undefined) {
              const pullY = (centerY - newPosition.y) * centeringStrength;
              newPosition.y += pullY * deltaTime;
            }
            
          } else {
            // OFF ROAD - maintain current direction and speed
            newPosition.x = position.x + newVelocity.x * deltaTime;
            newPosition.y = position.y + newVelocity.y * deltaTime;
          }
          
          // ALWAYS maintain constant speed (most important!)
          const currentSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
          if (currentSpeed > 0.1) {
            const speedRatio = BALL_SPEED / currentSpeed;
            newVelocity.x *= speedRatio;
            newVelocity.y *= speedRatio;
          } else {
            // If somehow stopped, push in default direction
            newVelocity.x = -BALL_SPEED;
            newVelocity.y = 0;
          }
          
          // Check finish
          const finalRoadTop = window.innerHeight - 330 + CANVAS_OFFSET_Y - 60;
          const finalRoadBottom = window.innerHeight - 330 + CANVAS_OFFSET_Y;
          
          if (newPosition.x > 430 && newPosition.y > finalRoadTop && newPosition.y < finalRoadBottom) {
            return {
              ...prev,
              isMoving: false,
              visible: false,
              velocity: { x: 0, y: 0 }
            };
          }
          
          // Boundary check
          if (newPosition.x < -50 || newPosition.x > window.innerWidth + 50 ||
              newPosition.y < -50 || newPosition.y > window.innerHeight + 50) {
            return {
              ...prev,
              position: { x: 1370, y: window.innerHeight - 150 + CANVAS_OFFSET_Y },
              velocity: { x: -BALL_SPEED, y: 0 }
            };
          }
          
          // Rotation for visual effect
          const rotation = prev.rotation + BALL_SPEED * 10 * deltaTime;
          
          return {
            ...prev,
            position: newPosition,
            velocity: newVelocity,
            rotation: rotation
          };
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      lastTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showGame, ball.isMoving, tile1Rotation, tile2Rotation, tile3Rotation]);

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
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
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

  const timePercentage = (timeLeft / 60) * 100;

  const getCountdownText = () => {
    switch(countdown) {
      case 3: return "READY";
      case 2: return "SET";
      case 1: return "GO!";
      default: return "";
    }
  };

  const handleRestartGame = () => {
    setTimeLeft(60);
    setGameOver(false);
    setIsRunning(true);
    
    setBall({
      color: 'red',
      position: { x: 1370, y: window.innerHeight - 150 + CANVAS_OFFSET_Y },
      velocity: { x: -BALL_SPEED, y: 0 },
      isMoving: true,
      visible: true,
      rotation: 0
    });
    
    lastTimeRef.current = Date.now();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  return (
    <div className="game-container">
      <div className="stars-bg-path" />
      <Header />
      
      {showMeditation && (
        <div className="video-screen meditation-screen">
          <div className="video-overlay">
            <button className="skip-btn" onClick={skipMeditation}>
              Skip
            </button>
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
            <div 
              className="bowling-ball"
              style={{
                position: 'absolute',
                left: `${ball.position.x}px`,
                top: `${ball.position.y}px`,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: `
                  radial-gradient(
                    circle at 35% 35%,
                    #FF4444 0%,
                    #CC0000 60%,
                    #990000 100%
                  )
                `,
                transform: `translate(-50%, -50%) rotate(${ball.rotation}deg)`,
                zIndex: 1000,
                boxShadow: `
                  0 2px 8px rgba(0, 0, 0, 0.3),
                  inset 0 1px 3px rgba(255, 255, 255, 0.3)
                `,
                border: '2px solid rgba(0, 0, 0, 0.1)'
              }}
            />
            
            <div className="road-segment road-horizontal-1"></div>
            <div className="road-segment road-curve-1"></div>
            <div className="road-segment road-vertical-3"></div>
            <div className="road-segment road-vertical-5"></div>
            <div className="road-segment road-curve-5"></div>
            <div className="road-segment road-vertical-6"></div>
            <div className="road-segment road-curve-7"></div>
            <div className="road-segment road-horizontal-2"></div>
            <div className="road-segment road-vertical-1"></div>
            <div className="road-segment road-vertical-2"></div>
            <div className="road-segment road-vertical-7"></div>
            <div className="road-segment road-curve-10"></div>
            <div className="road-segment road-vertical-4"></div>
            <div className="road-segment road-curve-4"></div>
            <div className="road-segment road-curve-8"></div>
            <div className="road-segment road-curve-9"></div>
            <div className="road-segment road-curve-11"></div>
            <div className="road-segment road-curve-12"></div>
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
            >
              {(tile1Rotation % 360 === 90 || tile1Rotation % 360 === 270) && (
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

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-message">
            <h2>Time's Up!</h2>
            <p>The bowling ball completed its roll!</p>
            <button className="restart-btn" onClick={handleRestartGame}>
              Roll Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PathChangeGame;