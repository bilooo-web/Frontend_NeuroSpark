import './Header.css';
import logo_s from '../../../assets/logo_s.png'; 
import profileImage from '../../../assets/profile_h.png';
import { Link } from "react-router-dom";
import { useState } from "react";

import SignInModal from "../../auth/SignInModal/SignInModal";
import SignUp from "../../auth/SignUp/SignUp";

function Header() {
  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }));
  };

  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }));
  };

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
          <button className="header-btn">🪙 0</button>

          <div className="profile-container">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-img"
              onClick={openSignIn}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
