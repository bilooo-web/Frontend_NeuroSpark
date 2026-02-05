import './Header.css';
import logo_s from '../../../assets/logo_s.png'; 
import profileImage from '../../../assets/profile_h.png';
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <div className="header-container">

        <div className="logo">
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
          <button className="header-btn">
            🪙 0
          </button>
          <div className="profile-container">
            <img src={profileImage} alt="Profile" className="profile-img" />
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;