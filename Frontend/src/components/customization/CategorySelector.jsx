import React, { useState } from "react";
import "./CategorySelector.css";
import UnlockErrorModal from './UnlockErrorModal';

// import images from assets
import legoLogo from "../../assets/lego_logo.png";
import legoCharacters from "../../assets/3_charactersLego.png";
import legopieces from "../../assets/legopieces.png";
import legoQuote from "../../assets/lego_quote.png";
import lego_spider from "../../assets/spiderman_lego.png";
import lego_head from "../../assets/lego_head.png";

import game1_lego from "../../assets/lego_game1.png";
import game2_lego from "../../assets/lego_game2.png";
import game3_lego from "../../assets/lego_game3.png";
import game4_lego from "../../assets/lego_game4.png";
import game5_lego from "../../assets/lego_game5.png";
import game6_lego from "../../assets/lego_game6.png";

// ⭐ Game data with 6 LEGO Sets + UNIQUE COIN PRICES
// First game is FREE (price: 0), others have high/large prices
const gameData = [
  { id: 'stitch',    image: game1_lego, name: 'Stitch',               icon: '🐚', setNum: '43249-1', price: 0,      isLocked: false },
  { id: 'simba',     image: game2_lego, name: 'Young Simba',          icon: '🦁', setNum: '43247-1', price: 12500,  isLocked: true },
  { id: 'flower',    image: game3_lego, name: 'Friendship Flower',    icon: '🌸', setNum: '30404-1', price: 8700,   isLocked: true },
  { id: 'wednesday', image: game4_lego, name: "Wednesday's Dorm",     icon: '🏴', setNum: '76781-1', price: 21900,  isLocked: true },
  { id: 'pikachu',   image: game5_lego, name: 'Pikachu',              icon: '⚡', setNum: '72152-1', price: 5400,   isLocked: true },
  { id: 'castle',    image: game6_lego, name: 'Sleeping Beauty',      icon: '👑', setNum: '40720-1', price: 34200,  isLocked: true },
];

const CategorySelector = ({ onSelectCategory, userCoins = 0, onPurchaseGame }) => {
  const [hoveredId, setHoveredId] = useState(null);
  // Track which games have been unlocked (in a real app, this would come from backend/user state)
  const [unlockedGames, setUnlockedGames] = useState(() => {
    // Initially, only free game (stitch) is unlocked
    const unlocked = new Set();
    unlocked.add('stitch');
    return unlocked;
  });

  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    gameName: '',
    gamePrice: 0,
  });

  // Helper to format large coin numbers with commas
  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  // ⭐ Handle card click with lock/unlock logic
  const handleGameClick = (game) => {
    // Check if game is locked
    if (game.isLocked && !unlockedGames.has(game.id)) {
      // If locked, check if user has enough coins
      if (userCoins >= game.price) {
        // Confirm purchase (optional but good UX)
        const confirmPurchase = window.confirm(
          `Unlock "${game.name}" for ${formatPrice(game.price)} coins?\n\nYour current balance: ${formatPrice(userCoins)} coins`
        );
        if (confirmPurchase && onPurchaseGame) {
          onPurchaseGame(game.id, game.price);
          // Unlock the game locally
          setUnlockedGames(prev => new Set([...prev, game.id]));
          // Also send to parent so category can be selected after unlock
          if (onSelectCategory) {
            onSelectCategory({
              id: game.id,
              name: game.name,
              icon: game.icon,
              image: game.image,
              setNum: game.setNum,
            });
          }
        }
      } else {
        setErrorModal({
          isOpen: true,
          gameName: game.name,
          gamePrice: game.price,
        });
      }
      return; // Don't proceed to selection if locked and not enough coins or purchase not confirmed
    }
    
    // Game is unlocked or free — proceed with selection
    if (onSelectCategory) {
      onSelectCategory({
        id: game.id,
        name: game.name,
        icon: game.icon,
        image: game.image,
        setNum: game.setNum,
      });
    }
  };

  const closeErrorModal = () => {
    setErrorModal({ isOpen: false, gameName: '', gamePrice: 0 });
  };

  return (
    <div className="cs-wrapper">

      {/* ── HERO SECTION ── */}
      <div className="cs-hero">
        {/* scattered lego pieces top-right */}
        <img src={legopieces} alt="" className="cs-hero__pieces" />

        {/* LEGO logo */}
        <img src={legoLogo} alt="LEGO" className="cs-hero__logo" />

        {/* headline card */}
        <div className="cs-hero__card">
          <h1 className="cs-hero__title">
            Build Your LEGO World,<br />Piece by Piece
          </h1>
          <p className="cs-hero__subtitle">
            Choose your favorite sets, explore every piece, and bring your builds to <br/>
            life in an interactive 3D experience just like in real life, but better.
          </p>
        </div>

        {/* "Just Build It" quote badge */}
        <img src={legoQuote} alt="Just Build It" className="cs-hero__quote" />

        {/* three LEGO characters */}
        <img src={legoCharacters} alt="LEGO Characters" className="cs-hero__characters" />
      </div>

      {/* ── WAVE TRANSITION ── */}
      <div className="customization-wave">
        <svg 
          className="customization-wave-svg customization-wave-primary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z"
            fill="#3AC7C1"
          >
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,70 350,10 600,40 S850,70 1200,40 L1200,120 L0,120 Z;
                M0,40 C150,10 350,70 600,40 S850,10 1200,40 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg 
          className="customization-wave-svg customization-wave-secondary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z"
            fill="#3AC7C1"
          >
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,90 400,30 600,60 S800,90 1200,60 L1200,120 L0,120 Z;
                M0,60 C200,30 400,90 600,60 S800,30 1200,60 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>

        <svg 
          className="customization-wave-svg customization-wave-tertiary" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z"
            fill="#3AC7C1"
          >
            <animate
              attributeName="d"
              dur="14s"
              repeatCount="indefinite"
              values="
                M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z;
                M0,50 C100,80 300,20 500,50 S700,80 900,50 S1100,20 1200,50 L1200,120 L0,120 Z;
                M0,50 C100,20 300,80 500,50 S700,20 900,50 S1100,80 1200,50 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

      {/* ── BODY SECTION ── */}
      <div className="cs-body">
        <div className="stars-bg" />
        {/* left spider-man decoration */}
        <img src={lego_spider} alt="" className="cs-body__spider cs-body__spider--left" />

        {/* right spider-man decoration */}
        <img src={lego_spider} alt="" className="cs-body__spider cs-body__spider--right" />

        <div className="customization-content">
          <h1>Welcome to your creative space!</h1>
          <p>
            Here, you can explore different builds, choose your favorite model, and bring it to life using digital LEGO pieces.
          </p>
        </div>

        {/* ⭐ CLICKABLE GAME GRID with LOCK/UNLOCK UI ── */}
        <div className="cs-grid">
          {gameData.map((game) => {
            const isGameUnlocked = !game.isLocked || unlockedGames.has(game.id);
            const isLockedGame = game.isLocked && !unlockedGames.has(game.id);
            
            return (
              <div 
                key={game.id}
                className={`cs-grid__item ${isLockedGame ? 'cs-grid__item--locked' : ''}`}
                onClick={() => handleGameClick(game)}
                onMouseEnter={() => setHoveredId(game.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* lego head above each card */}
                <img src={lego_head} alt="" className="cs-grid__head" />
                
                {/* ⭐ CARD with LOCK OVERLAY if locked */}
                <div 
                  className="cs-grid__card"
                  style={{
                    transform: hoveredId === game.id ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hoveredId === game.id 
                      ? '0 12px 28px rgba(0, 0, 0, 0.22)' 
                      : 'none',
                    transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                    position: 'relative',
                  }}
                >
                  <img 
                    src={game.image} 
                    alt={game.name} 
                    className="cs-grid__img"
                    style={{ 
                      pointerEvents: 'none',
                      filter: isLockedGame ? 'brightness(0.4) blur(2px)' : 'none',
                      transition: 'filter 0.2s ease',
                    }}
                  />
                  
                  {/* LOCK OVERLAY — only for locked games */}
                  {isLockedGame && (
                    <div className="cs-grid__lock-overlay">
                      <div className="cs-grid__lock-icon">🔒</div>
                      <div className="cs-grid__price-tag">
                        <span className="cs-grid__coin-icon">🪙</span>
                        <span className="cs-grid__price-value">{formatPrice(game.price)}</span>
                      </div>
                      <div className="cs-grid__unlock-hint">Click to unlock</div>
                    </div>
                  )}
                  
                  {/* FREE BADGE for the first game */}
                  {!game.isLocked && !isLockedGame && (
                    <div className="cs-grid__free-badge">FREE</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <UnlockErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        gameName={errorModal.gameName}
        gamePrice={errorModal.gamePrice}
        userCoins={userCoins}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default CategorySelector;
