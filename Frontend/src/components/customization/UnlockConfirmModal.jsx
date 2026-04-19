import React from 'react';
import './UnlockConfirmModal.css';
import legoCharacters from '../../assets/3_charactersLego.png';
import floatingLegos from '../../assets/floating_legos.png';
import legoLogoPieces from '../../assets/lego_logo_pieces.png';
import closeX from '../../assets/close_x.png';

const UnlockConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pieceName, 
  piecePrice, 
  liveCoins, 
  formatPrice 
}) => {
  if (!isOpen) return null;

  return (
    <div className="ucm-overlay" onClick={onClose}>
      <div className="ucm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stars-bg" />
        <img src={closeX} alt="close" className="ucm-close-btn" onClick={onClose} />
        <img src={floatingLegos} alt="" className="ucm-floating-legos" />
        <img src={legoLogoPieces} alt="lego" className="ucm-lego-logo" />

        <div className="ucm-content">
          
          <img src={legoCharacters} alt="lego character" className="ucm-character" />

          <div className="ucm-text">
            <h2>Unlock this piece?</h2>
            <p>
              Unlock <strong>"{pieceName}"</strong> for <span className="ucm-price">{formatPrice(piecePrice)} coins</span>
            </p>
            <p className="ucm-balance">Your balance: {formatPrice(liveCoins)} coins</p>
            
            <div className="ucm-actions">
              <button className="ucm-btn ucm-btn--cancel" onClick={onClose}>Cancel</button>
              <button className="ucm-btn ucm-btn--confirm" onClick={onConfirm}>Unlock!</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockConfirmModal;
