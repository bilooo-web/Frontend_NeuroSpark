import React from 'react';
import './UnlockErrorModal.css';

import sadLegoCharacter from '../../assets/sad_lego_character.png';
import floatingLegos from '../../assets/floating_legos.png';
import legoLogoPieces from '../../assets/lego_logo_pieces.png';
import closeX from '../../assets/close_x.png';

const UnlockErrorModal = ({ isOpen, onClose, gameName, gamePrice, userCoins, formatPrice }) => {
  if (!isOpen) return null;

  return (
    <div className="uem-overlay" onClick={onClose}>
      <div className="uem-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stars-bg" />

        {/* Close Button - X image at top */}
        <img
          src={closeX}
          alt="close"
          className="uem-close-btn"
          onClick={onClose}
        />

        {/* Floating Legos - top decoration */}
        <img src={floatingLegos} alt="" className="uem-floating-legos" />

        {/* LEGO Logo with pieces - bottom right */}
        <img src={legoLogoPieces} alt="lego" className="uem-lego-logo" />

        {/* Main Content */}
        <div className="uem-content">
          {/* Sad LEGO Character */}
          <img
            src={sadLegoCharacter}
            alt="sad lego character"
            className="uem-character"
          />

          <div className="uem-text">
            <h2>Not enough coins!</h2>

            <p>
              You need <span>{formatPrice(gamePrice)}</span> coins to unlock
              <strong> "{gameName}"</strong>
            </p>

            <p className="uem-balance">
              Current balance: {formatPrice(userCoins)} coins
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default UnlockErrorModal;
