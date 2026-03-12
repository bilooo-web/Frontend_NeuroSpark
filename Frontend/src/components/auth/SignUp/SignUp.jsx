import React, { useState } from 'react';
import './SignUp.css';
import signupVideo from '../../../assets/signup.mp4';
import logo from '../../../assets/logo_s.png';
import roleBg from '../../../assets/roleselection.png';
import flower from '../../../assets/flower.png';
import star from '../../../assets/star.png';
import { Link } from 'react-router-dom';

const SignUp = ({ onClose, onSwitch }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [role, setRole] = useState('');

  const [childFullName, setChildFullName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [childUsername, setChildUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childConfirmPassword, setChildConfirmPassword] = useState('');
  
  const [hasTherapist, setHasTherapist] = useState(null);
  const [therapistEmail, setTherapistEmail] = useState('');
  
  const [hasChild, setHasChild] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    const payload = {
        role,
        fullName,
        username,
        phoneNumber,
        email,
        password,
        ...(role === 'parent' || (role === 'therapist' && hasChild) ? {
            childFullName,
            childDob,
            childUsername,
            childPassword
        } : {}),
        ...(role === 'parent' && hasTherapist === 'yes' ? { therapistEmail } : {})
    };
    
    console.log("Sign Up Payload:", payload);
  };

  const renderBasicFields = () => (
    <>
        <div className="form-group">
            <label>Full Name</label>
            <input 
                type="text" 
                placeholder="Enter Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
            />
        </div>
        <div className="form-group">
            <label>Username</label>
            <input 
                type="text" 
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
            />
        </div>
        <div className="form-group">
            <label>Phone Number</label>
            <input 
                type="tel" 
                placeholder="Enter Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                required
            />
        </div>
        <div className="form-group">
            <label>Email</label>
            <input 
                type="email" 
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
            />
        </div>
        <div className="form-row">
          <div className="form-group half">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group half">
            <label>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
    </>
  );

  const renderChildFields = () => (
    <div className="child-fields-section">
        <h3 className="signup-section-title">Child's Information</h3>
        <div className="form-group">
            <label>Child Full Name</label>
            <input 
                type="text" 
                placeholder="Enter Child's Full Name"
                value={childFullName}
                onChange={(e) => setChildFullName(e.target.value)}
                autoComplete="off"
                required={role === 'parent' || (role === 'therapist' && hasChild)}
            />
        </div>
        <div className="form-group">
            <label>Child Date of Birth</label>
            <input 
                type="date" 
                value={childDob}
                onChange={(e) => setChildDob(e.target.value)}
                autoComplete="bday"
                required={role === 'parent' || (role === 'therapist' && hasChild)}
                style={{ fontStyle: 'normal' }}
            />
        </div>
        <div className="form-group">
            <label>Child Username</label>
            <input 
                type="text" 
                placeholder="Enter Child's Username"
                value={childUsername}
                onChange={(e) => setChildUsername(e.target.value)}
                autoComplete="off"
                required={role === 'parent' || (role === 'therapist' && hasChild)}
            />
        </div>
        <div className="form-row">
            <div className="form-group half">
            <label>Child Password</label>
            <input 
                type="password" 
                placeholder="Child's Password"
                value={childPassword}
                onChange={(e) => setChildPassword(e.target.value)}
                autoComplete="new-password"
                required={role === 'parent' || (role === 'therapist' && hasChild)}
            />
            </div>
            <div className="form-group half">
            <label>Confirm Password</label>
            <input 
                type="password" 
                placeholder="Confirm Child Password"
                value={childConfirmPassword}
                onChange={(e) => setChildConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required={role === 'parent' || (role === 'therapist' && hasChild)}
            />
            </div>
        </div>
    </div>
  );

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
            
            {renderBasicFields()}

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
                                onChange={(e) => {
                                    setRole('parent');
                                }}
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
                                onChange={(e) => {
                                    setRole('therapist');
                                }}
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
                    {renderChildFields()}
                    
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
                                placeholder="Enter Therapist's Email"
                                value={therapistEmail}
                                onChange={(e) => setTherapistEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                    )}
                </div>
            )}

            {role === 'therapist' && (
                <div className="therapist-fields">
                     <div className="role-selection-container" style={{ margin: '15px 0' }}>
                          <div className="role-header" style={{ backgroundImage: `url(${roleBg})` }}>
                            <span>Do you have a child?</span>
                        </div>
                        <div className="radios vertical-radios">
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="hasChild" 
                                    value="yes" 
                                    checked={hasChild === true}
                                    onClick={() => setHasChild(!hasChild)}
                                    onChange={() => {}}
                                />
                                <span className="radio-custom"></span>
                                Yes
                            </label>
                        </div>
                    </div>

                    {hasChild && renderChildFields()}
                </div>
            )}

            <button type="submit" className="signup-button">Create your Account</button>
            
            <p className="login-prompt">
              Already have an account? <span className="login-link" onClick={onSwitch}>Sign In here</span>
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
