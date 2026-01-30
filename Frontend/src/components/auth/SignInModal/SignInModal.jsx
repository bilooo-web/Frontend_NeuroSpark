import React, { useState } from 'react';
import './SignInModal.css';
import duckVideo from '../../../assets/Duck.mp4';
import logo from '../../../assets/logo_s.png';
import cloud from '../../../assets/cloud-blue.png';

const SignInModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('SignIn attempt:', { email, password, rememberMe });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'signin-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="signin-modal-overlay" onClick={handleOverlayClick}>
      <div className="signin-modal-container">
        <div className="signin-modal-content">
          <div className="signin-left">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="duck-video"
            >
              <source src={duckVideo} type="video/mp4" />
            </video>
          </div>

          <div className="signin-right">
            <img src={cloud} alt="Cloud" className="cloud-item cloud-left-img" />
            <img src={cloud} alt="Cloud" className="cloud-item cloud-right-img" />

            <div className="signin-logo">
              <img src={logo} alt="NeuroSpark Logo" />
            </div>
            
            <h1 className="welcome-text">WELCOME BACK</h1>
            <p className="subtitle">Enter your email and password to access your account</p>

            <form onSubmit={handleSubmit} className="signin-form">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password">Forget Password</a>
              </div>

              <button type="submit" className="signin-button">Sign in</button>
              
              <p className="signup-prompt">
                Don't have an account? <a href="#">Sign Up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
