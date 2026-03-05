// Header.jsx
import './Header.css';
import logo_s from '../../../assets/logo_s.png';
import profileImage from '../../../assets/profile_h.png';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Header({ totalCoins }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Sync coins from backend ONLY on login (not every mount)
  useEffect(() => {
    const syncCoinsFromBackend = async () => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token || userData.role !== 'child') {
        // Not a child — don't call /child/profile at all
        if (userData.role !== 'child') setCoins(0);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/child/profile`,
          { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
        );
        const data = await res.json();
        if (data?.stats?.total_coins != null) {
          const serverCoins = Number(data.stats.total_coins);
          localStorage.setItem('totalCoins', String(serverCoins));
          setCoins(serverCoins);
        }
      } catch (e) {
        setCoins(readStoredCoins());
      }
    };

    // Only fetch on login event — NOT on mount
    // On mount, just read from localStorage (already synced)
    setCoins(readStoredCoins());
    window.addEventListener('login-success', syncCoinsFromBackend);
    return () => window.removeEventListener('login-success', syncCoinsFromBackend);
  }, []);

  // If parent passes totalCoins prop, use it (backward compat)
  useEffect(() => {
    if (typeof totalCoins === 'number' && !Number.isNaN(totalCoins)) {
      setCoins(totalCoins);
      localStorage.setItem('totalCoins', totalCoins.toString());
      return;
    }
    setCoins(readStoredCoins());
  }, [totalCoins]);

  // Listen for coin updates from games — server total is authoritative
  useEffect(() => {
    const handleCoinUpdate = (event) => {
      const detail = event?.detail || {};

      if (detail.totalCoins != null) {
        // Server-authoritative total — use directly, no addition
        const serverTotal = Number(detail.totalCoins);
        localStorage.setItem('totalCoins', String(serverTotal));
        setCoins(serverTotal);
      }

      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    };

    const handleCoinSync = () => {
      setCoins(readStoredCoins());
    };

    window.addEventListener('coins-updated', handleCoinUpdate);
    window.addEventListener('coins-synced', handleCoinSync);
    return () => {
      window.removeEventListener('coins-updated', handleCoinUpdate);
      window.removeEventListener('coins-synced', handleCoinSync);
    };
  }, []);

  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };

  // In Header.jsx, update handleLogout function:

const handleLogout = () => {
  // Clear all game-specific scores from localStorage
  const gameSlugs = ['path-change', 'padlocks', 'faces-and-names', 'pair-of-cards', 
                     'painting', 'colored-words', 'word-search', 'cars-on-the-road',
                     'handwriting-enhancement', 'one-line', 'find-the-ball', 'rearranging-blocks'];
  
  gameSlugs.forEach(slug => {
    localStorage.removeItem(`${slug}-last`);
    localStorage.removeItem(`${slug}-best`);
  });
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('totalCoins');
  setUser(null);
  setCoins(0);
  navigate('/');
};

  const goToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'guardian') {
      navigate('/guardian/dashboard');
    }
  };

  const isHomeActive = () => {
    return location.pathname === '/' || location.pathname === '/home';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/home')}>
          <img src={logo_s} alt="NeuroSpark" />
        </div>

        <nav className="nav">
          <NavLink to="/home" className={isHomeActive() ? 'active' : ''} end>Home</NavLink>
          <NavLink to="/challenges" className={({ isActive }) => isActive ? 'active' : ''}>Challenges</NavLink>
          <NavLink to="/spark-city" className={({ isActive }) => isActive ? 'active' : ''}>Spark City</NavLink>
          <NavLink to="/customization" className={({ isActive }) => isActive ? 'active' : ''}>Customization</NavLink>
          <NavLink to="/homework" className={({ isActive }) => isActive ? 'active' : ''}>Homework</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About Us</NavLink>
        </nav>

        <div className="header-right">
          {user ? (
            <>
              <button className={`header-btn ${animate ? 'coin-pop' : ''}`}
                style={animate ? { animation: 'coinBounce 0.6s ease', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#fff', borderColor: '#FFD700', transform: 'scale(1.1)' } : {}}>
                {'\uD83E\uDE99'} {coins.toLocaleString()}
              </button>
              {animate && <style>{`@keyframes coinBounce { 0%{transform:scale(1)} 30%{transform:scale(1.25)} 60%{transform:scale(0.95)} 100%{transform:scale(1)} }`}</style>}
              <div className="profile-container" onClick={goToDashboard}>
                <img src={profileImage} alt="Profile" className="profile-img" style={{ cursor: 'pointer' }} />
                <span className="profile-name">{user.full_name}</span>
              </div>
              <button className="logout-btn-small" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="header-btn signin" onClick={openSignIn}>Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;