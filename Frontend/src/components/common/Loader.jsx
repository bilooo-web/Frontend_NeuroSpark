import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', text, fullPage = false }) => {
  const sizeClass = size === 'small' ? 'spinner-sm' : size === 'large' ? 'spinner-lg' : '';

  return (
    <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
      <div className={`loading-spinner ${sizeClass}`} />
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;