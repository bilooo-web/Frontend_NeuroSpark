import React, { useState, useEffect, useRef } from 'react';
import './PathChangeGame.css';
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

// Add roundRect method to CanvasRenderingContext2D
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.moveTo(x + r, y);
  this.lineTo(x + w - r, y);
  this.quadraticCurveTo(x + w, y, x + w, y + r);
  this.lineTo(x + w, y + h - r);
  this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  this.lineTo(x + r, y + h);
  this.quadraticCurveTo(x, y + h, x, y + h - r);
  this.lineTo(x, y + r);
  this.quadraticCurveTo(x, y, x + r, y);
  return this;
};

export default function PathChangeGame() {
  const canvasRef = useRef(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [coins, setCoins] = useState(0);

  // Game pieces positions and types (teal gate blocks)
  const [pieces, setPieces] = useState([
    { id: 1, x: 140, y: 380, type: 'gate', rotation: 0 },
    { id: 2, x: 320, y: 230, type: 'gate', rotation: 0 },
    { id: 3, x: 580, y: 350, type: 'gate', rotation: 0 },
    { id: 4, x: 580, y: 500, type: 'gate', rotation: 0 }
  ]);

  // Target circles (level nodes)
  const targets = [
    { id: 1, x: 450, y: 150, color: '#ff5b5b', darkColor: '#c92c2c', glowColor: 'rgba(255, 91, 91, 0.4)' }, // Red
    { id: 2, x: 1390, y: 70, color: '#ffc82e', darkColor: '#f28c00', glowColor: 'rgba(255, 200, 46, 0.4)' }, // Yellow
    { id: 3, x: 320, y: 390, color: '#6cc36c', darkColor: '#2e7d32', glowColor: 'rgba(108, 195, 108, 0.4)' }, // Green
    { id: 4, x: 1270, y: 480, color: '#a96adf', darkColor: '#6a1b9a', glowColor: 'rgba(169, 106, 223, 0.4)' }  // Purple
  ];

  // Starting point (not visible, path starts here)
  const startPoint = { x: 100, y: 200 };
  
  // End point (blue full circle at bottom right)
  const endPoint = { x: 1400, y: 660, color: '#3d8bd9' };

  // Small red player marker
  const playerMarker = { x: 870, y: 510 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size to match wide layout
    canvas.width = 1500 * dpr;
    canvas.height = 750 * dpr;
    canvas.style.width = '1500px';
    canvas.style.height = '750px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw everything
    drawGame(ctx);
  });

  const drawGame = (ctx) => {
    // Clear canvas
    ctx.clearRect(0, 0, 1500, 750);

    // Draw white particles
    drawParticles(ctx);

    // Draw the main path tube with 3D effect
    drawPathTube(ctx);

    // Draw teal gate blocks
    pieces.forEach(piece => {
      drawGateBlock(ctx, piece.x, piece.y);
    });

    // Draw target circles (level nodes)
    targets.forEach(target => {
      drawLevelNode(ctx, target.x, target.y, target.color, target.darkColor, target.glowColor);
    });

    // Draw small red player marker
    drawPlayerMarker(ctx, playerMarker.x, playerMarker.y);

    // Draw end point (blue target-style circle)
    drawEndPoint(ctx);
  };

  const drawParticles = (ctx) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    // Randomly scatter small white dots
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1500;
      const y = Math.random() * 750;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPathTube = (ctx) => {
    const pathColor = '#e9e9e9';
    const tubeWidth = 50;
    const lastSegmentMargin = 130;
    const rightVerticalTail = 300;
    const rightVerticalGap = 20;
    const rightVerticalX = 900;
    const rightVerticalYOffset = -100;
    const rightVerticalStartY =
      450 + lastSegmentMargin + rightVerticalGap + rightVerticalYOffset;
    const rightVerticalEndY = rightVerticalStartY - rightVerticalTail;
    const rightVerticalArcRadius = 55;
    const rightVerticalArcLength = 50;
    const curvedVerticalStartX = 960;
    const curvedVerticalStartY = 199.9;
    const curvedVerticalRadius = 70;
    const curvedVerticalHeight = 210;
    const curvedSecondArcRadius = 70;
    const curvedSecondHorizontalLength = 150;
    const detachedVerticalX = 1030;
    const detachedVerticalStartY = 70;
    const detachedVerticalHeight = 200;
    const detachedTurnRadius = 70;
    const detachedHorizontalLength = 300;

    ctx.save();
    
    // Draw outer shadow first
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 12;

    ctx.strokeStyle = pathColor;
    ctx.lineWidth = tubeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    
    
    
    
    
    
    // Curve down
    ctx.arcTo(150, 450, 150, 550, 80);
    ctx.lineTo(150, 600);
    
    // Curve right
    ctx.arcTo(150, 670, 250, 670, 80);
    ctx.lineTo(800, 670);
    
    // Continue with straight segments (no left arc)
    ctx.lineTo(900, 670);
    ctx.lineTo(900, 550);
    
    // Curve right again
    ctx.arcTo(900, 450 + lastSegmentMargin, 1000, 450 + lastSegmentMargin, 80);
    ctx.lineTo(1400, 450 + lastSegmentMargin);
    // Separate vertical segment with top arc
    ctx.moveTo(rightVerticalX, rightVerticalStartY);
    ctx.lineTo(rightVerticalX, rightVerticalEndY + rightVerticalArcRadius);
    ctx.arcTo(
      rightVerticalX,
      rightVerticalEndY,
      rightVerticalX + rightVerticalArcLength,
      rightVerticalEndY,
      rightVerticalArcRadius
    );
    ctx.lineTo(rightVerticalX + rightVerticalArcLength, rightVerticalEndY);
    // Separate segment: curve first, then vertical
    ctx.moveTo(curvedVerticalStartX, curvedVerticalStartY);
    ctx.arcTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY,
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalRadius,
      curvedVerticalRadius
    );
    ctx.lineTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalHeight
    );
    ctx.arcTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius,
      curvedVerticalStartX + curvedVerticalRadius + curvedSecondArcRadius,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius,
      curvedSecondArcRadius
    );
    ctx.lineTo(
      curvedVerticalStartX + curvedVerticalRadius + curvedSecondArcRadius + curvedSecondHorizontalLength,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius
    );
    // Separate segment: vertical, then arc right, then horizontal
    ctx.moveTo(detachedVerticalX, detachedVerticalStartY + detachedVerticalHeight);
    ctx.lineTo(detachedVerticalX, detachedVerticalStartY + detachedTurnRadius);
    ctx.arcTo(
      detachedVerticalX,
      detachedVerticalStartY,
      detachedVerticalX + detachedTurnRadius,
      detachedVerticalStartY,
      detachedTurnRadius
    );
    ctx.lineTo(
      detachedVerticalX + detachedTurnRadius + detachedHorizontalLength,
      detachedVerticalStartY
    );
    
    ctx.stroke();

    // Draw highlight on top of tube for 3D effect
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Create gradient for highlight
    const gradient = ctx.createLinearGradient(0, 0, 0, tubeWidth);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = tubeWidth * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.lineTo(400, 200);
    ctx.arcTo(500, 200, 500, 300, 80);
    ctx.lineTo(500, 350);
    ctx.arcTo(500, 450, 400, 450, 80);
    ctx.lineTo(250, 450);
    ctx.arcTo(150, 450, 150, 550, 80);
    ctx.lineTo(150, 600);
    ctx.arcTo(150, 670, 250, 670, 80);
    ctx.lineTo(800, 670);
    ctx.lineTo(900, 670);
    ctx.lineTo(900, 550);
    ctx.arcTo(900, 450 + lastSegmentMargin, 1000, 450 + lastSegmentMargin, 80);
    ctx.lineTo(1400, 450 + lastSegmentMargin);
    ctx.moveTo(rightVerticalX, rightVerticalStartY);
    ctx.lineTo(rightVerticalX, rightVerticalEndY + rightVerticalArcRadius);
    ctx.arcTo(
      rightVerticalX,
      rightVerticalEndY,
      rightVerticalX + rightVerticalArcLength,
      rightVerticalEndY,
      rightVerticalArcRadius
    );
    ctx.lineTo(rightVerticalX + rightVerticalArcLength, rightVerticalEndY);
    ctx.moveTo(curvedVerticalStartX, curvedVerticalStartY);
    ctx.arcTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY,
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalRadius,
      curvedVerticalRadius
    );
    ctx.lineTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalHeight
    );
    ctx.arcTo(
      curvedVerticalStartX + curvedVerticalRadius,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius,
      curvedVerticalStartX + curvedVerticalRadius + curvedSecondArcRadius,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius,
      curvedSecondArcRadius
    );
    ctx.lineTo(
      curvedVerticalStartX + curvedVerticalRadius + curvedSecondArcRadius + curvedSecondHorizontalLength,
      curvedVerticalStartY + curvedVerticalHeight + curvedSecondArcRadius
    );
    ctx.moveTo(detachedVerticalX, detachedVerticalStartY + detachedVerticalHeight);
    ctx.lineTo(detachedVerticalX, detachedVerticalStartY + detachedTurnRadius);
    ctx.arcTo(
      detachedVerticalX,
      detachedVerticalStartY,
      detachedVerticalX + detachedTurnRadius,
      detachedVerticalStartY,
      detachedTurnRadius
    );
    ctx.lineTo(
      detachedVerticalX + detachedTurnRadius + detachedHorizontalLength,
      detachedVerticalStartY
    );
    ctx.stroke();

    ctx.restore();
  };

  const drawLevelNode = (ctx, x, y, color, darkColor, glowColor) => {
    ctx.save();

    // Draw glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;

    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Remove shadow for inner circle
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = darkColor;
    ctx.fill();

    ctx.restore();
  };

  const drawGateBlock = (ctx, x, y) => {
    ctx.save();

    // Teal gate block
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;

    ctx.fillStyle = '#2fb6a8';
    ctx.beginPath();
    ctx.roundRect(x - 35, y - 50, 70, 100, 18);
    ctx.fill();

    ctx.restore();
  };

  const drawPlayerMarker = (ctx, x, y) => {
    ctx.save();
    
    // Small red ball
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3333';
    ctx.fill();

    // Highlight
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    ctx.restore();
  };

  const drawEndPoint = (ctx) => {
    ctx.save();

    // Outer circle
    ctx.shadowColor = 'rgba(61, 139, 217, 0.4)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y - 80, 50, 0, Math.PI * 2);
    ctx.fillStyle = endPoint.color;
    ctx.fill();

    // Inner circle
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y - 80, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#2563a8'; 
    ctx.fill();

    ctx.restore();
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on a gate block
    const clickedPiece = pieces.find(piece => {
      const dx = x - piece.x;
      const dy = y - piece.y;
      return Math.abs(dx) < 35 && Math.abs(dy) < 50;
    });

    if (clickedPiece) {
      setSelectedPiece(clickedPiece.id);
      setTimeout(() => setSelectedPiece(null), 200);
      // Could add rotation or interaction here
    }
  };

  return (
    <div className="game-container">
      <Header />

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" />
        <div className="progress-end" />
      </div>

      {/* Game Canvas */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="game-canvas"
        />
      </div>

      {/* Instructions */}
      <div className="instructions">
        Click on teal blocks to interact with the path
      </div>
    </div>
  );
}
