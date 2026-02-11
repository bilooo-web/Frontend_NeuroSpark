import React, { useState } from 'react';
import './SignUp.css';
import signupVideo from '../../../assets/signup.mp4';
import logo from '../../../assets/logo_s.png';
import roleBg from '../../../assets/roleselection.png';
import flower from '../../../assets/flower.png';
import star from '../../../assets/star.png';
import { Link } from 'react-router-dom';

const SignUp = ({ onClose, onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [hasTherapist, setHasTherapist] = useState(null);
  const [therapistEmail, setTherapistEmail] = useState('');
  const [clinicName, setClinicName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }


  };

  return (
    <div className="signup-page">

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

            <button type="submit" className="signup-button">Create your Account</button>
            
            <p className="login-prompt">
              Already have an account have an account? <span className="login-link" onClick={onSwitch}>Sign In here</span>
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
