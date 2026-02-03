import React, { useState } from 'react';
import './SignInModal.css';
import duckVideo from '../../../assets/Duck.mp4';
import signupVideo from '../../../assets/signup.mp4';
import logo from '../../../assets/logo_s.png';
import cloud from '../../../assets/cloud-blue.png';
import roleBg from '../../../assets/roleselection.png';
import flower from '../../../assets/flower.png';
import star from '../../../assets/stars-white.png';

const SignInModal = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    console.log('SignIn attempt:', { email, password, rememberMe });
    onClose();
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (signUpPassword !== signUpConfirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    console.log('SignUp attempt:', { email: signUpEmail, password: signUpPassword, role });
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
          
          {!isSignUp ? (
            // SIGN IN VIEW
            <div className="content-signin">
              {/* Left: Video */}
              <div className="modal-side visual-side signin-visual">
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

              {/* Right: Form */}
              <div className="modal-side form-side signin-form-side">
                <img src={cloud} alt="Cloud" className="cloud-item cloud-left-img" />
                <img src={cloud} alt="Cloud" className="cloud-item cloud-right-img" />

                <div className="signin-logo">
                  <img src={logo} alt="NeuroSpark Logo" />
                </div>
                
                <h1 className="welcome-text">WELCOME BACK</h1>
                <p className="subtitle">Enter your email and password to access your account</p>

                <form onSubmit={handleSignInSubmit} className="auth-form">
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

                  <button type="submit" className="auth-button">Sign in</button>
                  
                  <p className="switch-prompt">
                    Don't have an account? <span className="switch-link" onClick={() => setIsSignUp(true)}>Sign Up</span>
                  </p>
                </form>
              </div>
            </div>
          ) : (
            // SIGN UP VIEW
            <div className="content-signup">
              {/* Left: Form */}
              <div className="modal-side form-side signup-form-side">
                {/* Background Stars */}
                <img src={star} alt="Star" className="star-item star-1" />
                <img src={star} alt="Star" className="star-item star-2" />
                <img src={star} alt="Star" className="star-item star-3" />
                <img src={star} alt="Star" className="star-item star-4" />

                <div className="signup-logo">
                  <img src={logo} alt="NeuroSpark Logo" />
                </div>
                
                <h1 className="signup-title">Create your account</h1>
                <p className="signup-subtitle">Let's get you started , it only takes a moment</p>

                <form onSubmit={handleSignUpSubmit} className="auth-form">
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="Enter Your Email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>Password</label>
                      <input 
                        type="password" 
                        placeholder="Enter Your password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group half">
                      <label>Confirm Password</label>
                      <input 
                        type="password" 
                        placeholder="Confirm Your password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
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

                  <button type="submit" className="auth-button">Create your Account</button>
                  
                  <p className="switch-prompt">
                    Already have an account? <span className="switch-link" onClick={() => setIsSignUp(false)}>Sign In here</span>
                  </p>
                </form>
              </div>

               {/* Right: Visual */}
               <div className="modal-side visual-side signup-visual">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
