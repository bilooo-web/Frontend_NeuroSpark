import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', text, fullPage = false }) => {
  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'loader-small';
      case 'large': return 'loader-large';
      default: return 'loader-medium';
    }
  };

  return (
    <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
      <div className={`loader ${getSizeClass()}`}>
        <div className="loader-circle"></div>
        <div className="loader-circle"></div>
        <div className="loader-circle"></div>
        <div className="loader-shadow"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;