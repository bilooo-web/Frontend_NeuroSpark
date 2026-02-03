import React, { useState } from 'react';
import './SignUp.css';
import signupVideo from '../../../assets/signup.mp4';
import logo from '../../../assets/logo_s.png';
import roleBg from '../../../assets/roleselection.png';
import flower from '../../../assets/flower.png';
import star from '../../../assets/star.png';
import { Link } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log('SignUp attempt:', { email, password, role });
    // Specific things to be done later
  };

  return (
    <div className="signup-page">
        {/* Background Stars scattered */}
        <img src={star} className="bg-star star-1" alt="" />
        <img src={star} className="bg-star star-2" alt="" />
        <img src={star} className="bg-star star-3" alt="" />
        <img src={star} className="bg-star star-4" alt="" />
        <img src={star} className="bg-star star-5" alt="" />
        <img src={star} className="bg-star star-6" alt="" />
        
      <div className="signup-container">
        <div className="signup-left">
          <div className="signup-logo">
            <img src={logo} alt="NeuroSpark Logo" />
          </div>
          
          <h1 className="signup-title">Create your account</h1>
          <p className="signup-subtitle">Let's get you started , it only takes a moment</p>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Enter Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group half">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm Your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="role-selection-container">
                <div className="role-header" style={{ backgroundImage: `url(${roleBg})` }}>
                    <span>Role selection</span>
                </div>
                
                <div className="role-options">
                    <img src={flower} alt="Flower" className="flower-icon left" />
                    
                    <div className="radios">
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="role" 
                                value="parent" 
                                checked={role === 'parent'}
                                onChange={(e) => setRole(e.target.value)}
                            />
                            <span className="radio-custom"></span>
                            Parent
                        </label>
                        <label className="radio-label">
                            <input 
                                type="radio" 
                                name="role" 
                                value="therapist" 
                                checked={role === 'therapist'}
                                onChange={(e) => setRole(e.target.value)}
                            />
                            <span className="radio-custom"></span>
                            Therapist
                        </label>
                    </div>

                    <img src={flower} alt="Flower" className="flower-icon right" />
                </div>
            </div>

            <button type="submit" className="signup-button">Create your Account</button>
            
            <p className="login-prompt">
              Already have an account have an account? <span className="login-link" onClick={() => window.location.reload()}>Sign In here</span>
            </p>
          </form>
        </div>

        <div className="signup-right">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="signup-video"
          >
            <source src={signupVideo} type="video/mp4" />
          </video>
          <div className="video-overlay-text">
            <h1>EXPLORE.<br/>LEARN. GROW.</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
