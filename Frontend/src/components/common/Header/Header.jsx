import './Header.css';
import logo_s from '../../../assets/logo_s.png'; 
import profileImage from '../../../assets/profile_h.png';
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
          {user ? (
            <>
              <button className="header-btn">🪙 0</button>
              <div className="profile-container" onClick={goToDashboard}>
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-img"
                  style={{ cursor: "pointer" }}
                />
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