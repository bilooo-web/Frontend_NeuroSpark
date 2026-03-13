import React from 'react';
import './CharacterSelectionModal.css';
import char1 from '../../assets/characterone.png';
import char2 from '../../assets/charactertwo.png';
import char3 from '../../assets/characterthree.png';
import char4 from '../../assets/characterfour.png';
import char5 from '../../assets/characterfive.png';
import char6 from '../../assets/charactersix.png';

const characters = [
  { id: '1', img: char1, name: 'Character One' },
  { id: '2', img: char2, name: 'Character Two' },
  { id: '3', img: char3, name: 'Character Three' },
  { id: '4', img: char4, name: 'Character Four' },
  { id: '5', img: char5, name: 'Character Five' },
  { id: '6', img: char6, name: 'Character Six' },
];

const CharacterSelectionModal = ({ isOpen, onClose, onSelect, selectedId }) => {
  if (!isOpen) return null;

  return (
    <div className="char-modal-overlay" onClick={onClose}>
      <div className="char-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="char-modal-header">
          <h3>Choose Your Friend!</h3>
          <button className="char-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="char-grid">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`char-item ${selectedId === char.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(char.id);
                onClose();
              }}
            >
              <img src={char.img} alt={char.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectionModal;
