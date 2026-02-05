import './Header.css';
import logo_s from '../../../assets/logo_s.png'; // Import the logo
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

        <button className="header-btn">
          Get Started
        </button>

      </div>
    </header>
  );
}

export default Header;
