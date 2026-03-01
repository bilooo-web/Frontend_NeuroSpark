import './Header.css';
import logo_s from '../../../assets/logo_s.png'; 
import profileImage from '../../../assets/profile_h.png';
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import SignInModal from "../../auth/SignInModal/SignInModal";
import SignUp from "../../auth/SignUp/SignUp";
import Home from '../../../pages/Home';

function Header({ totalCoins }) {
  const readStoredCoins = () => {
    const saved = localStorage.getItem('totalCoins');
    const parsed = Number.parseInt(saved || '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const [coins, setCoins] = useState(() => {
    if (typeof totalCoins === 'number' && !Number.isNaN(totalCoins)) {
      return totalCoins;
    }
    return readStoredCoins();
  });
  const [animate, setAnimate] = useState(false);

  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };

  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }));
  };

  // Listen for coin updates from games
  useEffect(() => {
    const handleCoinUpdate = (event) => {
      setCoins(prev => {
        const newTotal = prev + event.detail.coins;
        localStorage.setItem('totalCoins', newTotal.toString());
        return newTotal;
      });
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    };

    window.addEventListener('coins-updated', handleCoinUpdate);
    return () => window.removeEventListener('coins-updated', handleCoinUpdate);
  }, []);

  // Update coins when prop changes
  useEffect(() => {
    if (typeof totalCoins === 'number' && !Number.isNaN(totalCoins)) {
      setCoins(totalCoins);
      localStorage.setItem('totalCoins', totalCoins.toString());
      return;
    }
    setCoins(readStoredCoins());
  }, [totalCoins]);

  return (
    <header className="header">
      <div className="header-container">

        <div className="logo" onClick={() => window.location.href = '/home'}>
          <img src={logo_s} alt="NeuroSpark" />
        </div>

        <nav className="nav">
          <Link to="/home">Home</Link>
          <Link to="/challenges">Challenges</Link>
          <a href="#roadmap">Spark City</a>
          <Link to="/customization">Customization</Link>
          <a href="#homework">Homework</a>
          <Link to="/about">About Us</Link>
        </nav>

        <div className="header-right">
          <button className={`header-btn ${animate ? 'coin-pop' : ''}`}>
            🪙 {coins.toLocaleString()}
          </button>

          <div className="profile-container">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-img"
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
