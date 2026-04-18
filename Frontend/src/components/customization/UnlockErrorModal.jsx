import React, { useState, useEffect } from 'react';
import './UnlockErrorModal.css';

import sadLegoCharacter from '../../assets/sad_lego_character.png';
import floatingLegos from '../../assets/floating_legos.png';
import legoLogoPieces from '../../assets/lego_logo_pieces.png';
import closeX from '../../assets/close_x.png';

/** Read the same localStorage key the Header writes to */
const readCoins = () => {
  const v = parseInt(localStorage.getItem('totalCoins') || '0', 10);
  return isNaN(v) ? 0 : v;
};

const UnlockErrorModal = ({ isOpen, onClose, gameName, gamePrice, formatPrice }) => {
  // Live coins — always in sync with the Header
  const [liveCoins, setLiveCoins] = useState(readCoins);

  useEffect(() => {
    if (!isOpen) return;

    // Refresh immediately when modal opens
    setLiveCoins(readCoins());

    // Stay in sync with coins-updated (e.g. after earning/spending coins)
    const onCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) {
        setLiveCoins(Number(e.detail.totalCoins));
      } else {
        setLiveCoins(readCoins());
      }
    };

    // Stay in sync with coins-synced (periodic server sync)
    const onCoinsSynced = () => setLiveCoins(readCoins());

    // Stay in sync with storage changes from other tabs
    const onStorage = (e) => {
      if (e.key === 'totalCoins') setLiveCoins(readCoins());
    };

    window.addEventListener('coins-updated', onCoinsUpdated);
    window.addEventListener('coins-synced', onCoinsSynced);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('coins-updated', onCoinsUpdated);
      window.removeEventListener('coins-synced', onCoinsSynced);
      window.removeEventListener('storage', onStorage);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="uem-overlay" onClick={onClose}>
      <div className="uem-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stars-bg" />

        {/* Close Button */}
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

            {/* Live balance — always matches the Header coin display */}
            <p className="uem-balance">
              Current balance: {formatPrice(liveCoins)} coins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockErrorModal;