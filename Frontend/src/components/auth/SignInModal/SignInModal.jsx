import React, { useState } from 'react';
import './SignInModal.css';
import duckVideo from '../../../assets/Duck.mp4';
import signupVideo from '../../../assets/signup.mp4';
import logo from '../../../assets/logo_s.png';
import cloud from '../../../assets/cloud-blue.png';
import cloudR from '../../../assets/cloud_r.png';
import roleBg from '../../../assets/roleselection.png';
import flower from '../../../assets/flower.png';
import star from '../../../assets/stars-white.png';

const SignInModal = ({ onClose, onSwitch }) => {
  const [isSignUp, setIsSignUp] = useState(false);


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);


  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [hasTherapist, setHasTherapist] = useState(null);
  const [therapistEmail, setTherapistEmail] = useState('');
  

  const [clinicName, setClinicName] = useState('');
  const handleSignInSubmit = (e) => {
    e.preventDefault();

    onClose();
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (signUpPassword !== signUpConfirmPassword) {
      alert("Passwords don't match!");
      return;
    }

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

            <div className="content-signin">
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

              <div className="modal-side form-side signin-form-side">
                <img src={cloud} alt="Cloud" className="cloud-item cloud-left-img" />
                <img src={cloudR} alt="Cloud" className="cloud-item cloud-right-img" />

                <div className="form-content-wrapper">
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
                      Don't have an account? <span className="switch-link" onClick={onSwitch}>Sign Up</span>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          ) : (

            <div className="content-signup">
              <div className="modal-side form-side signup-form-side">

                <img src={star} alt="Star" className="star-item star-1" />
                <img src={star} alt="Star" className="star-item star-2" />
                <img src={star} alt="Star" className="star-item star-3" />
                <img src={star} alt="Star" className="star-item star-4" />

                <div className="form-content-wrapper">
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

                    {role === 'parent' && (
                        <div className="parent-fields">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        placeholder="Enter your phone number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Child's Username</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your child's name"
                                        value={childName}
                                        onChange={(e) => setChildName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Child's Age</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your child age"
                                        value={childAge}
                                        onChange={(e) => setChildAge(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="role-selection-container" style={{ margin: '15px 0' }}>
                                 <div className="role-header" style={{ backgroundImage: `url(${roleBg})` }}>
                                    <span>Child's therapist</span>
                                </div>
                                
                                <div className="radios vertical-radios">
                                    <label className="radio-label">
                                        <input 
                                            type="radio" 
                                            name="hasTherapist" 
                                            value="yes" 
                                            checked={hasTherapist === 'yes'}
                                            onChange={(e) => setHasTherapist(e.target.value)}
                                        />
                                        <span className="radio-custom"></span>
                                        Yes
                                    </label>
                                    <label className="radio-label">
                                        <input 
                                            type="radio" 
                                            name="hasTherapist" 
                                            value="no" 
                                            checked={hasTherapist === 'no'}
                                            onChange={(e) => setHasTherapist(e.target.value)}
                                        />
                                        <span className="radio-custom"></span>
                                        No
                                    </label>
                                </div>
                            </div>

                            {hasTherapist === 'yes' && (
                                 <div className="form-group">
                                    <label>Therapist Email</label>
                                    <input 
                                        type="email" 
                                        placeholder="Enter therapist's email address"
                                        value={therapistEmail}
                                        onChange={(e) => setTherapistEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    )}
  
                    {role === 'therapist' && (
                        <div className="therapist-fields">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Phone number</label>
                                    <input 
                                        type="tel" 
                                        placeholder="Enter your phone number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Clinic / Center Name(optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter clinic or center name"
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
  
                    <button type="submit" className="auth-button">Create your Account</button>
                    
                    <p className="switch-prompt">
                      Already have an account? <span className="switch-link" onClick={onSwitch}>Sign In here</span>
                    </p>
                  </form>
                </div>
              </div>

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
