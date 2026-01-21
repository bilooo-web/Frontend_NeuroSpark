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
          <a href="#home">Home</a>
          <Link to="/challenges">Challenges</Link>
          <a href="#roadmap">Spark City</a>
          <a href="#customization">Customization</a>
          <a href="#homework">Homework</a>
          <a href="#about">About Us</a>
        </nav>

        <button className="header-btn">
          Get Started
        </button>

      </div>
    </header>
  );
}

export default Header;
