import './Header.css';
import logo_s from '../../../assets/logo_s.png';
import profileImage from '../../../assets/profile_h.png';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Header({ totalCoins }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [animate, setAnimate] = useState(false);

  const readStoredCoins = () => {
    const saved = localStorage.getItem('totalCoins');
    const parsed = Number.parseInt(saved || '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener('login-success', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('login-success', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    if (typeof totalCoins === 'number' && !Number.isNaN(totalCoins)) {
      setCoins(totalCoins);
      localStorage.setItem('totalCoins', totalCoins.toString());
      return;
    }

    setCoins(readStoredCoins());
  }, [totalCoins]);

  useEffect(() => {
    const handleCoinUpdate = (event) => {
      const gainedCoins = Number(event?.detail?.coins || 0);

      setCoins((prev) => {
        const newTotal = prev + gainedCoins;
        localStorage.setItem('totalCoins', newTotal.toString());
        return newTotal;
      });

      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    };

    window.addEventListener('coins-updated', handleCoinUpdate);
    return () => window.removeEventListener('coins-updated', handleCoinUpdate);
  }, []);

  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const goToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'guardian') {
      navigate('/guardian/dashboard');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/home')}>
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
          {user ? (
            <>
              <button className={`header-btn ${animate ? 'coin-pop' : ''}`}>
                {'\uD83E\uDE99'} {coins.toLocaleString()}
              </button>
              <div className="profile-container" onClick={goToDashboard}>
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-img"
                  style={{ cursor: 'pointer' }}
                />
                <span className="profile-name">{user.full_name}</span>
              </div>
              <button className="logout-btn-small" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="header-btn signin" onClick={openSignIn}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
