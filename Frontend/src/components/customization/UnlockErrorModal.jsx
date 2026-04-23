import React, { useState, useEffect } from 'react';
import './UnlockErrorModal.css';

import sadLegoCharacter from '../../assets/sad_lego_character.png';
import floatingLegos from '../../assets/floating_legos.png';
import legoLogoPieces from '../../assets/lego_logo_pieces.png';
import closeX from '../../assets/close_x.png';

const readCoins = () => {
  const v = parseInt(localStorage.getItem('totalCoins') || '0', 10);
  return isNaN(v) ? 0 : v;
};

const UnlockErrorModal = ({ isOpen, onClose, gameName, gamePrice, formatPrice }) => {
  const [liveCoins, setLiveCoins] = useState(readCoins);

  useEffect(() => {
    if (!isOpen) return;
    setLiveCoins(readCoins());
    const onCoinsUpdated = (e) => {
      if (e.detail?.totalCoins != null) {
        setLiveCoins(Number(e.detail.totalCoins));
      } else {
        setLiveCoins(readCoins());
      }
    };
    const onCoinsSynced = () => setLiveCoins(readCoins());
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
        <img
          src={closeX}
          alt="close"
          className="uem-close-btn"
          onClick={onClose}
        />
        <img src={floatingLegos} alt="" className="uem-floating-legos" />
        <img src={legoLogoPieces} alt="lego" className="uem-lego-logo" />
        <div className="uem-content">
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
              Current balance: {formatPrice(liveCoins)} coins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockErrorModal;