import React, { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AuthModal.css';
import duckVideo from '../../assets/Duck.mp4';
import signupVideo from '../../assets/signup.mp4';
import logo from '../../assets/logo_s.png';
import cloud from '../../assets/cloud-blue.png';
import cloudR from '../../assets/cloud_r.png';
import roleBg from '../../assets/roleselection.png';
import flower from '../../assets/flower.png';
import star from '../../assets/stars-white.png';

// ============= VALIDATION FUNCTIONS (Based on AuthController.php) =============

/**
 * Validate email against backend rules
 * Backend validates: email format, allowed domains, disposable domains, MX records
 */
const validateEmail = (email, isTherapist = false) => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Allowed domains from backend
  const allowedDomains = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
    'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'outlook.co.uk', 'live.com',
    'live.co.uk', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    'proton.me', 'pm.me', 'mail.com', 'gmx.com', 'gmx.net', 'yandex.com',
    'yandex.ru', 'inbox.com', 'zoho.com', 'rediffmail.com', 'rocketmail.com',
    'att.net', 'verizon.net', 'comcast.net', 'cox.net', 'earthlink.net'
  ];
  
  // Disposable domains from backend
  const disposableDomains = [
    'example.com', 'test.com', 'mailinator.com', 'guerrillamail.com',
    'tempmail.com', 'fake.com', 'example.org', '10minutemail.com',
    'throwawaymail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'yopmail.com', 'maildrop.cc', 'getairmail.com', 'mailnator.com',
    'dispostable.com', 'spamgourmet.com', 'mailcatch.com', 'mintemail.com',
    'mailmoat.com', 'spambox.us', 'throwawayemail.com', 'tempinbox.com',
    'emailondeck.com', 'guerrillamail.org', 'guerrillamail.net', 'guerrillamail.biz',
    'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me', 'temp-mail.ru',
    'tempemail.co', 'tempemail.net', 'tempemail.org'
  ];
  
  // Check if domain is in allowed list
  if (!allowedDomains.includes(domain) && !disposableDomains.includes(domain)) {
    return isTherapist 
      ? 'Therapist email must be from a major email provider (Gmail, Yahoo, Hotmail, Outlook, iCloud, AOL, etc.)'
      : 'Only email addresses from major email providers are allowed.';
  }
  
  if (disposableDomains.includes(domain)) {
    return isTherapist
      ? 'Please use a permanent email address for the therapist. Temporary emails are not allowed.'
      : 'Please use a permanent email address. Temporary/disposable emails are not allowed.';
  }
  
  // Check if same as parent email (for therapist invitation)
  // This will be checked in the component
  
  return null;
};

/**
 * Validate password against backend rules
 * Backend requires: min 8 chars, letters, mixed case, numbers, symbols
 */
const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[@$!%*?&]/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
  return null;
};

/**
 * Validate phone number (E.164 format expected: +<country><digits>)
 * Accepts +<1-4 digit dial code><6-15 digit national number>
 */
const validatePhoneNumber = (phone) => {
  if (!phone) return 'Phone number is required';
  // Must start with + and contain only digits after
  if (!/^\+[0-9]{7,18}$/.test(phone)) {
    return 'Please enter a valid phone number';
  }
  // National part should be at least 6 digits (after dial code of 1-4 digits)
  const digitsOnly = phone.replace(/^\+/, '');
  if (digitsOnly.length < 7) return 'Phone number is too short';
  if (digitsOnly.length > 18) return 'Phone number is too long';
  return null;
};

/**
 * Validate username against backend rules
 * Backend: max 30 chars, unique (checked on server)
 */
const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters long';
  if (username.length > 30) return 'Username must not exceed 30 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
};

/**
 * Validate full name
 */
const validateFullName = (name) => {
  if (!name) return 'Full name is required';
  if (name.length < 2) return 'Full name must be at least 2 characters long';
  if (name.length > 100) return 'Full name must not exceed 100 characters';
  return null;
};

/**
 * Validate date of birth — child must be aged 8 to 12 inclusive
 */
const validateDateOfBirth = (dob) => {
  if (!dob) return 'Date of birth is required';

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 'Please enter a valid date';

  const today = new Date();
  if (birthDate > today) return 'Date of birth must be in the past';

  // Compute precise age (years)
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 8) return 'Child must be at least 8 years old';
  if (age > 12) return 'Child must be 12 years old or younger';

  return null;
};

/**
 * Check if passwords match
 */
const validatePasswordMatch = (password, confirmPassword, fieldName = 'Passwords') => {
  if (password !== confirmPassword) return `${fieldName} do not match`;
  return null;
};


/**
 * Validate username for login/forgot password
 */
const validateIdentifier = (identifier) => {
  if (!identifier) return 'Username or email is required';
  
  // If it looks like an email, validate email format
  if (identifier.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) return 'Please enter a valid email address';
  } else {
    // Validate username format
    if (identifier.length < 3) return 'Username must be at least 3 characters long';
    if (identifier.length > 30) return 'Username must not exceed 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) return 'Username can only contain letters, numbers, and underscores';
  }
  
  return null;
};

// ============= CUSTOM INPUT COMPONENTS =============

// Password input component with visibility toggle
const PasswordInput = ({ 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  label, 
  showPassword, 
  setShowPassword,
  disabled,
  required = true,
  isChild = false,
  error,
  touched,
  name
}) => {
  const [inputId] = useState(() => `password-${Math.random().toString(36).substr(2, 9)}`);
  
  const toggleVisibility = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };
  
  return (
    <div className={`form-group password-group ${error && touched ? 'has-error' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input-wrapper">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          className={isChild ? "child-password-input" : ""}
          autoComplete={isChild ? "new-password" : "current-password"}
        />
        <button
          type="button"
          className={`password-toggle ${showPassword ? 'visible' : ''}`}
          onClick={toggleVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex="-1"
        >
          {showPassword ? (
            <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
            </svg>
          ) : (
            <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
            </svg>
          )}
        </button>
      </div>
      {error && touched && <div className="field-error-message">{error}</div>}
    </div>
  );
};

// ============= COUNTRY DATA (alphabetical, ~140 countries) =============
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', dial: '+1268', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', dial: '+1242', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', dial: '+1246', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', dial: '+238', flag: '🇨🇻' },
  { code: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', dial: '+243', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', dial: '+1767', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', dial: '+1809', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', dial: '+1473', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', dial: '+1876', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', dial: '+853', flag: '🇲🇴' },
  { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { code: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KP', name: 'North Korea', dial: '+850', flag: '🇰🇵' },
  { code: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'PR', name: 'Puerto Rico', dial: '+1787', flag: '🇵🇷' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'SM', name: 'San Marino', dial: '+378', flag: '🇸🇲' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬' },
  { code: 'TT', name: 'Trinidad and Tobago', dial: '+1868', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼' },
];

const DEFAULT_COUNTRY_CODE = 'LB'; // Lebanon as default

// ============= PHONE INPUT WITH INTERNATIONAL DROPDOWN =============
const PhoneInput = ({ value, onChange, onBlur, label, error, touched, disabled }) => {
  const [inputId] = useState(() => `phone-${Math.random().toString(36).substr(2, 9)}`);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState(
    () => COUNTRIES.find(c => c.code === DEFAULT_COUNTRY_CODE) || COUNTRIES[0]
  ); // default Lebanon
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  // Parse incoming `value` (E.164 like "+201234567890") into country + national digits
  const parseValue = (raw) => {
    if (!raw || !raw.startsWith('+')) return { c: country, national: '' };
    // Try longest dial-code match first to disambiguate +1 vs +1xxx etc.
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    const match = sorted.find(c => raw.startsWith(c.dial));
    if (match) return { c: match, national: raw.slice(match.dial.length) };
    return { c: country, national: raw.replace(/^\+/, '') };
  };

  const { national } = parseValue(value);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // If parent gave us a value and we haven't synced country yet, do so once
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const parsed = parseValue(value);
      if (parsed.c.code !== country.code) setCountry(parsed.c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleCountrySelect = (c) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
    // Rebuild value with new dial code + existing national digits
    onChange(`${c.dial}${national}`);
  };

  const handleNationalChange = (e) => {
    // Strip everything except digits
    const digits = e.target.value.replace(/\D/g, '');
    onChange(`${country.dial}${digits}`);
  };

  const filtered = search.trim()
    ? COUNTRIES.filter(c => {
        const q = search.trim().toLowerCase();
        return c.name.toLowerCase().includes(q)
          || c.dial.includes(q)
          || c.code.toLowerCase().includes(q);
      })
    : COUNTRIES;

  return (
    <div className={`form-group phone-group ${error && touched ? 'has-error' : ''}`} ref={wrapperRef}>
      <label htmlFor={inputId}>{label}</label>
      <div className={`phone-input-wrapper ${open ? 'open' : ''}`}>
        <button
          type="button"
          className="phone-country-btn"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          aria-label="Select country code"
          aria-expanded={open}
        >
          <span className="phone-flag">{country.flag}</span>
          <span className="phone-dial">{country.dial}</span>
          <svg className={`phone-chevron ${open ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className="phone-divider" aria-hidden="true" />

        <input
          id={inputId}
          type="tel"
          className="phone-national-input"
          value={national}
          onChange={handleNationalChange}
          onBlur={onBlur}
          placeholder="123 456 7890"
          disabled={disabled}
          inputMode="numeric"
          autoComplete="tel-national"
        />
      </div>

      {open && (
        <div className="phone-dropdown" role="listbox">
          <div className="phone-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              className="phone-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
            />
          </div>
          <div className="phone-country-list">
            {filtered.length === 0 ? (
              <div className="phone-no-results">No countries found</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`phone-country-item ${c.code === country.code ? 'active' : ''}`}
                  onClick={() => handleCountrySelect(c)}
                  role="option"
                  aria-selected={c.code === country.code}
                >
                  <span className="phone-flag">{c.flag}</span>
                  <span className="phone-country-name">{c.name}</span>
                  <span className="phone-country-dial">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && touched && <div className="field-error-message">{error}</div>}
    </div>
  );
};

// ============= CUSTOM DATE PICKER (age 8-12 enforced) =============
const MIN_AGE = 8;
const MAX_AGE = 12;
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAY_LABELS = ['S','M','T','W','T','F','S'];

const DatePicker = ({ value, onChange, onBlur, label, error, touched, disabled, className = '' }) => {
  const [inputId] = useState(() => `dp-${Math.random().toString(36).substr(2, 9)}`);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Allowed range: today minus MAX_AGE years (oldest allowed birth date) → today minus MIN_AGE years (youngest)
  // i.e. child age between 8 and 12 inclusive.
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  // Earliest birth date = the day they would turn (MAX_AGE+1) tomorrow → effectively MAX_AGE years ago + 1 day
  // Simpler: earliest = today - (MAX_AGE+1) years + 1 day; latest = today - MIN_AGE years
  const minDate = new Date(todayY - MAX_AGE - 1, todayM, todayD + 1);
  const maxDate = new Date(todayY - MIN_AGE, todayM, todayD);

  const parsedValue = value ? new Date(value) : null;
  const validParsed = parsedValue && !isNaN(parsedValue.getTime()) ? parsedValue : null;

  // View state: which month/year the calendar is showing
  const [viewYear, setViewYear] = useState(() =>
    validParsed ? validParsed.getFullYear() : maxDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    validParsed ? validParsed.getMonth() : maxDate.getMonth()
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Year options — only years within allowed range
  const yearOptions = [];
  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y++) {
    yearOptions.push(y);
  }

  const formatDisplay = (d) =>
    `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const isDateAllowed = (d) => d >= minDate && d <= maxDate;

  // Build calendar grid for current view
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrevMonth = () => {
    let m = viewMonth - 1;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    // Disallow navigating before the earliest allowed month
    const candidate = new Date(y, m + 1, 0); // last day of candidate month
    if (candidate < minDate) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const goNextMonth = () => {
    let m = viewMonth + 1;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    const candidate = new Date(y, m, 1); // first day of candidate month
    if (candidate > maxDate) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const picked = new Date(viewYear, viewMonth, day);
    if (!isDateAllowed(picked)) return;
    // Format as YYYY-MM-DD (local)
    const yyyy = picked.getFullYear();
    const mm = String(picked.getMonth() + 1).padStart(2, '0');
    const dd = String(picked.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleYearChange = (e) => setViewYear(parseInt(e.target.value, 10));
  const handleMonthChange = (e) => setViewMonth(parseInt(e.target.value, 10));

  // Disable prev/next chevrons at boundaries
  const prevDisabled = (() => {
    let m = viewMonth - 1, y = viewYear;
    if (m < 0) { m = 11; y--; }
    return new Date(y, m + 1, 0) < minDate;
  })();
  const nextDisabled = (() => {
    let m = viewMonth + 1, y = viewYear;
    if (m > 11) { m = 0; y++; }
    return new Date(y, m, 1) > maxDate;
  })();

  return (
    <div className={`form-group dp-group ${className} ${error && touched ? 'has-error' : ''}`} ref={wrapperRef}>
      <label htmlFor={inputId}>{label}</label>
      <button
        id={inputId}
        type="button"
        className={`dp-trigger ${open ? 'open' : ''} ${!validParsed ? 'placeholder' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        onBlur={onBlur}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="dp-cal-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="dp-display">
          {validParsed ? formatDisplay(validParsed) : 'Select date of birth'}
        </span>
        <svg className={`dp-chevron ${open ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="dp-popover" role="dialog">
          <div className="dp-header">
            <button type="button" className="dp-nav-btn" onClick={goPrevMonth} disabled={prevDisabled} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="dp-selects">
              <select className="dp-select" value={viewMonth} onChange={handleMonthChange}>
                {MONTH_NAMES.map((mn, idx) => {
                  // Disable months that fall entirely outside range for the chosen year
                  const lastDayOfMonth = new Date(viewYear, idx + 1, 0);
                  const firstDayOfMonth = new Date(viewYear, idx, 1);
                  const monthOutOfRange = lastDayOfMonth < minDate || firstDayOfMonth > maxDate;
                  return (
                    <option key={mn} value={idx} disabled={monthOutOfRange}>{mn}</option>
                  );
                })}
              </select>
              <select className="dp-select" value={viewYear} onChange={handleYearChange}>
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button type="button" className="dp-nav-btn" onClick={goNextMonth} disabled={nextDisabled} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="dp-weekdays">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="dp-weekday">{w}</div>
            ))}
          </div>

          <div className="dp-grid">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="dp-cell empty" />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const allowed = isDateAllowed(cellDate);
              const selected = validParsed && sameDay(cellDate, validParsed);
              return (
                <button
                  key={i}
                  type="button"
                  className={`dp-cell ${selected ? 'selected' : ''} ${!allowed ? 'disabled' : ''}`}
                  onClick={() => handleDayClick(day)}
                  disabled={!allowed}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="dp-footer">
            <span className="dp-hint">Ages {MIN_AGE}–{MAX_AGE} only</span>
          </div>
        </div>
      )}

      {error && touched && <div className="field-error-message">{error}</div>}
    </div>
  );
};

// Reusable Input component with validation
const Input = ({ 
  type = "text", 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  label, 
  error,
  touched,
  required = true,
  disabled = false,
  name,
  ...props 
}) => {
  const [inputId] = useState(() => `input-${Math.random().toString(36).substr(2, 9)}`);
  
  return (
    <div className={`form-group ${error && touched ? 'has-error' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        className={error && touched ? 'error' : ''}
        {...props}
      />
      {error && touched && <div className="field-error-message">{error}</div>}
    </div>
  );
};

// ============= MAIN AUTH MODAL COMPONENT =============

const AuthModal = ({ onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', 'forgot'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [cloudsVisible, setCloudsVisible] = useState(true);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sign Up state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  // Child fields
  const [childName, setChildName] = useState('');
  const [childUsername, setChildUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childConfirmPassword, setChildConfirmPassword] = useState('');
  const [childDob, setChildDob] = useState('');

  // Therapist options
  const [hasTherapist, setHasTherapist] = useState(null);
  const [therapistEmail, setTherapistEmail] = useState('');

  // Therapist specific
  const [hasChild, setHasChild] = useState(false);

  // Forgot Password state
  const [resetIdentifier, setResetIdentifier] = useState(''); // Can be email or username
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: identifier, 2: verify, 3: new password
  const [countdown, setCountdown] = useState(0);
  const [isChildReset, setIsChildReset] = useState(false); // Track if it's a child reset

  // Scroll detection ref
  const formContentRef = useRef(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showChildPassword, setShowChildPassword] = useState(false);
  const [showChildConfirmPassword, setShowChildConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Field-specific error states
  const [fieldErrors, setFieldErrors] = useState({
    fullName: null,
    username: null,
    phoneNumber: null,
    email: null,
    password: null,
    confirmPassword: null,
    childName: null,
    childUsername: null,
    childPassword: null,
    childConfirmPassword: null,
    childDob: null,
    therapistEmail: null,
    resetIdentifier: null,
    resetCode: null,
    newPassword: null,
    confirmNewPassword: null
  });

  // Touched fields to show validation only after user interacts
  const [touchedFields, setTouchedFields] = useState({});

  const API_BASE_URL = 'http://localhost:8000/api';

  // Toast notification configurations
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      icon: "🎉",
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const showInfoToast = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  // Handle field blur to mark as touched
  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Validate all fields on the fly
  useEffect(() => {
    validateAllFields();
  }, [fullName, username, phoneNumber, signUpEmail, signUpPassword, signUpConfirmPassword, 
      childName, childUsername, childPassword, childConfirmPassword, childDob, therapistEmail, role, hasTherapist, hasChild]);

  const validateAllFields = () => {
    const errors = {};
    
    // Basic fields validation
    if (fullName || touchedFields.fullName) {
      const nameError = validateFullName(fullName);
      if (nameError) errors.fullName = nameError;
    }
    
    if (username || touchedFields.username) {
      const usernameError = validateUsername(username);
      if (usernameError) errors.username = usernameError;
    }
    
    if (phoneNumber || touchedFields.phoneNumber) {
      const phoneError = validatePhoneNumber(phoneNumber);
      if (phoneError) errors.phoneNumber = phoneError;
    }
    
    if (signUpEmail || touchedFields.email) {
      const emailError = validateEmail(signUpEmail);
      if (emailError) errors.email = emailError;
    }
    
    if (signUpPassword || touchedFields.password) {
      const passwordError = validatePassword(signUpPassword);
      if (passwordError) errors.password = passwordError;
    }
    
    if ((signUpConfirmPassword || touchedFields.confirmPassword) && signUpPassword) {
      const matchError = validatePasswordMatch(signUpPassword, signUpConfirmPassword, 'Passwords');
      if (matchError) errors.confirmPassword = matchError;
    }
    
    // Parent specific validation
    if (role === 'parent') {
      if (childName || touchedFields.childName) {
        const childNameError = validateFullName(childName);
        if (childNameError) errors.childName = childNameError;
      }
      
      if (childUsername || touchedFields.childUsername) {
        const childUsernameError = validateUsername(childUsername);
        if (childUsernameError) errors.childUsername = childUsernameError;
      }
      
      if (childDob || touchedFields.childDob) {
        const childDobError = validateDateOfBirth(childDob);
        if (childDobError) errors.childDob = childDobError;
      }
      
      if (childPassword || touchedFields.childPassword) {
        const childPasswordError = validatePassword(childPassword);
        if (childPasswordError) errors.childPassword = childPasswordError;
      }
      
      if ((childConfirmPassword || touchedFields.childConfirmPassword) && childPassword) {
        const matchError = validatePasswordMatch(childPassword, childConfirmPassword, 'Child passwords');
        if (matchError) errors.childConfirmPassword = matchError;
      }
      
      if (hasTherapist === 'yes' && (therapistEmail || touchedFields.therapistEmail)) {
        const therapistEmailError = validateEmail(therapistEmail, true);
        if (therapistEmailError) errors.therapistEmail = therapistEmailError;
        
        // Check if therapist email is same as parent email
        if (therapistEmail && signUpEmail && therapistEmail === signUpEmail) {
          errors.therapistEmail = 'You cannot invite yourself as a therapist';
        }
      }
    }
    
    // Therapist specific validation
    if (role === 'therapist' && hasChild) {
      if (childName || touchedFields.childName) {
        const childNameError = validateFullName(childName);
        if (childNameError) errors.childName = childNameError;
      }
      
      if (childUsername || touchedFields.childUsername) {
        const childUsernameError = validateUsername(childUsername);
        if (childUsernameError) errors.childUsername = childUsernameError;
      }
      
      if (childDob || touchedFields.childDob) {
        const childDobError = validateDateOfBirth(childDob);
        if (childDobError) errors.childDob = childDobError;
      }
      
      if (childPassword || touchedFields.childPassword) {
        const childPasswordError = validatePassword(childPassword);
        if (childPasswordError) errors.childPassword = childPasswordError;
      }
      
      if ((childConfirmPassword || touchedFields.childConfirmPassword) && childPassword) {
        const matchError = validatePasswordMatch(childPassword, childConfirmPassword, 'Child passwords');
        if (matchError) errors.childConfirmPassword = matchError;
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if all required fields are filled
  const checkRequiredFields = () => {
    const missingFields = [];
    
    if (!fullName) missingFields.push('Full Name');
    if (!username) missingFields.push('Username');
    if (!phoneNumber) missingFields.push('Phone Number');
    if (!signUpEmail) missingFields.push('Email');
    if (!signUpPassword) missingFields.push('Password');
    if (!signUpConfirmPassword) missingFields.push('Confirm Password');
    if (!role) missingFields.push('Role Selection');

    if (role === 'parent') {
      if (!childName) missingFields.push("Child's Full Name");
      if (!childDob) missingFields.push("Child's Date of Birth");
      if (!childUsername) missingFields.push("Child's Username");
      if (!childPassword) missingFields.push("Child's Password");
      if (!childConfirmPassword) missingFields.push("Confirm Child's Password");
      if (hasTherapist === null) missingFields.push("Child's Therapist Selection");
      if (hasTherapist === 'yes' && !therapistEmail) missingFields.push('Therapist Email');
    }

    if (role === 'therapist' && hasChild) {
      if (!childName) missingFields.push("Child's Full Name");
      if (!childDob) missingFields.push("Child's Date of Birth");
      if (!childUsername) missingFields.push("Child's Username");
      if (!childPassword) missingFields.push("Child's Password");
      if (!childConfirmPassword) missingFields.push("Confirm Child's Password");
    }

    return missingFields;
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-scroll to new sections when they appear
  useEffect(() => {
    if ((role === 'parent' || (role === 'therapist' && hasChild)) && formContentRef.current) {
      setTimeout(() => {
        formContentRef.current.scrollTo({
          top: formContentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [role, hasChild]);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (formContentRef.current) {
        const { scrollHeight, clientHeight } = formContentRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight);
      }
    };
    
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [role, hasChild, mode]);

  const handleModeSwitch = (newMode) => {
    setTransitioning(true);
    setCloudsVisible(false);
    setError('');
    setSuccessMessage('');
    
    setTimeout(() => {
      setMode(newMode);
      setTransitioning(false);
      setTimeout(() => setCloudsVisible(true), 50);
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'auth-modal-overlay') {
      onClose();
    }
  };

  const handleSignInSubmit = async (e) => {
  e.preventDefault();
  
  // Mark fields as touched
  setTouchedFields(prev => ({ 
    ...prev, 
    email: true, 
    password: true 
  }));
  
  // Validate fields based on input type
  let identifierError = null;
  
  if (!email) {
    identifierError = 'Username or email is required';
  } else if (email.includes('@')) {
    // It's an email - validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      identifierError = 'Please enter a valid email address';
    }
  } else {
    // It's a username - validate username format
    if (email.length < 3) {
      identifierError = 'Username must be at least 3 characters long';
    } else if (email.length > 30) {
      identifierError = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(email)) {
      identifierError = 'Username can only contain letters, numbers, and underscores';
    }
  }
  
  const passwordError = validatePassword(password);
  
  const newErrors = {};
  if (identifierError) newErrors.email = identifierError;
  if (passwordError) newErrors.password = passwordError;
  
  if (Object.keys(newErrors).length > 0) {
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    showErrorToast('Please fix the validation errors');
    return;
  }

  // Validate required fields
  if (!email || !password) {
    showErrorToast('Please fill in all required fields');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier: email,
        password: password,
        device_name: 'Web Browser',
        remember: rememberMe
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        const errors = data.errors || {};
        const errorMessages = Object.values(errors).flat();
        errorMessages.forEach(msg => showErrorToast(msg));
        
        // Map backend errors to form fields
        if (errors.identifier) {
          setFieldErrors(prev => ({ ...prev, email: errors.identifier[0] }));
        }
        if (errors.password) {
          setFieldErrors(prev => ({ ...prev, password: errors.password[0] }));
        }
        throw new Error('Validation failed');
      } else if (response.status === 429) {
        showErrorToast('Too many attempts. Please try again later.');
        throw new Error('Rate limit exceeded');
      } else if (response.status === 401) {
        // More helpful error message based on input type
        if (email.includes('@')) {
          showErrorToast('Invalid email or password');
          setFieldErrors(prev => ({ 
            ...prev, 
            email: 'Email not found or incorrect',
            password: 'Password is incorrect'
          }));
        } else {
          showErrorToast('Invalid username or password');
          setFieldErrors(prev => ({ 
            ...prev, 
            email: 'Username not found or incorrect',
            password: 'Password is incorrect'
          }));
        }
        throw new Error('Invalid credentials');
      } else if (response.status === 403) {
        showErrorToast(data.message || 'Your account is not active. Please contact support.');
        throw new Error('Account not active');
      } else {
        showErrorToast(data.message || data.error || 'Login failed');
        throw new Error(data.message || 'Login failed');
      }
    }

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user.role === 'guardian' && data.user.guardian_type) {
        localStorage.setItem('guardian_type', data.user.guardian_type);
      }
      console.log('User data:', data.user);
      console.log('Guardian type:', data.user.guardian_type);
      

      // Dispatch login success event
      window.dispatchEvent(new CustomEvent('login-success'));

      // Success messages based on role
      const roleMessages = {
        admin: 'Welcome back, Admin! 👋 Redirecting to dashboard...',
        guardian: 'Welcome back! 🎉 Ready to help your child learn? Redirecting to dashboard...',
        child: 'Welcome back! 🎮 Time for fun learning!'
      };
      
      showSuccessToast(roleMessages[data.user.role] || 'Login successful!');
      
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'guardian') {
          navigate('/guardian/dashboard');
        } else if (data.user.role === 'child') {
          navigate('/'); // Navigate to home page for children
        }
        onClose();
      }, 800);
    }
  } catch (err) {
    setError(err.message || 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show validation errors
    const allFields = [
      'fullName', 'username', 'phoneNumber', 'email', 'password', 'confirmPassword',
      ...(role === 'parent' ? ['childName', 'childUsername', 'childPassword', 'childConfirmPassword', 'childDob'] : []),
      ...(role === 'therapist' && hasChild ? ['childName', 'childUsername', 'childPassword', 'childConfirmPassword', 'childDob'] : [])
    ];
    
    const newTouched = {};
    allFields.forEach(field => { newTouched[field] = true; });
    if (role === 'parent' && hasTherapist === 'yes') {
      newTouched.therapistEmail = true;
    }
    setTouchedFields(newTouched);
    
    // Validate all fields
    const isValid = validateAllFields();
    
    // Check required fields
    const missingFields = checkRequiredFields();
    
    if (missingFields.length > 0) {
      showErrorToast(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsLoading(false);
      return;
    }
    
    if (!isValid) {
      showErrorToast('Please fix the validation errors before submitting');
      return;
    }

    setIsLoading(true);
    setError('');

    const payload = {
      full_name: fullName,
      username: username,
      email: signUpEmail,
      password: signUpPassword,
      password_confirmation: signUpConfirmPassword,
      phone_number: phoneNumber,
      role_type: role,
      ...(role === 'parent' ? { has_therapist: hasTherapist === 'yes' } : {}),
      ...(role === 'parent' && hasTherapist === 'yes' ? { therapist_email: therapistEmail } : {}),
      ...(role === 'therapist' ? { has_child: hasChild } : {}),
    };

    if (role === 'parent' || (role === 'therapist' && hasChild)) {
      payload.child_full_name = childName;
      payload.child_username = childUsername || childName.toLowerCase().replace(/\s+/g, '_');
      payload.child_password = childPassword;
      payload.child_password_confirmation = childConfirmPassword;
      payload.child_date_of_birth = childDob;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          const errors = data.errors || {};
          const errorMessages = Object.values(errors).flat();
          
          // Map backend errors to form fields
          const backendErrors = {};
          Object.keys(errors).forEach(key => {
            if (key === 'email') backendErrors.email = errors[key][0];
            if (key === 'username') backendErrors.username = errors[key][0];
            if (key === 'phone_number') backendErrors.phoneNumber = errors[key][0];
            if (key === 'password') backendErrors.password = errors[key][0];
            if (key === 'child_full_name') backendErrors.childName = errors[key][0];
            if (key === 'child_username') backendErrors.childUsername = errors[key][0];
            if (key === 'child_password') backendErrors.childPassword = errors[key][0];
            if (key === 'child_date_of_birth') backendErrors.childDob = errors[key][0];
            if (key === 'therapist_email') backendErrors.therapistEmail = errors[key][0];
          });
          
          setFieldErrors(prev => ({ ...prev, ...backendErrors }));
          errorMessages.forEach(msg => showErrorToast(msg));
          throw new Error('Validation failed');
        } else if (response.status === 429) {
          showErrorToast('Too many registration attempts. Please try again later.');
          throw new Error('Rate limit exceeded');
        } else {
          showErrorToast(data.message || data.error || 'Registration failed');
          throw new Error(data.message || 'Registration failed');
        }
      }

      if (data.success) {
        // Customize success message based on role (matching backend)
        let successMessage = '';
        if (role === 'parent') {
          successMessage = 'Registration successful! 🎉 Please check your email to verify your account.';
          if (hasTherapist === 'yes' && therapistEmail) {
            successMessage = 'Registration successful! 🎉 Please check your email to verify your account. We\'ve also sent an invitation to the therapist.';
          }
        } else if (role === 'therapist') {
          successMessage = 'Registration successful! 🎉 Your therapist account has been created.';
        } else {
          successMessage = 'Registration successful! Please check your email.';
        }
        
        showSuccessToast(successMessage);
        
        setTimeout(() => {
          resetForm();
          handleModeSwitch('signin');
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

const handleForgotPassword = async (e) => {
  e.preventDefault();
  
  // Mark field as touched
  setTouchedFields(prev => ({ ...prev, resetIdentifier: true }));
  
  // Clear previous errors
  setFieldErrors(prev => ({ ...prev, resetIdentifier: null }));
  
  // Validate input
  const identifierError = validateIdentifier(resetIdentifier);
  
  if (identifierError) {
    setFieldErrors(prev => ({ ...prev, resetIdentifier: identifierError }));
    showErrorToast(identifierError);
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${API_BASE_URL}/password/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ identifier: resetIdentifier })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        const errors = data.errors || {};
        const errorMessages = Object.values(errors).flat();
        errorMessages.forEach(msg => showErrorToast(msg));
        
        if (errors.identifier) {
          setFieldErrors(prev => ({ ...prev, resetIdentifier: errors.identifier[0] }));
        }
        throw new Error('Validation failed');
      } else if (response.status === 429) {
        showErrorToast('Too many attempts. Please try again later.');
        throw new Error('Rate limit exceeded');
      } else {
        showErrorToast(data.message || 'Failed to send reset code');
        throw new Error(data.message || 'Failed to send reset code');
      }
    }

    // ALWAYS show this message for security (whether account exists or not)
    const securityMessage = 'If the email is registered, you will receive a password reset link';
    
    if (data.success) {
      setResetToken(data.reset_token);
      setResetIdentifier(data.identifier);
      setIsChildReset(data.is_child || false);
      setResetStep(2);
      setCountdown(60);
      
      if (data.is_child) {
        showSuccessToast('📱 Reset code sent to your parent! Please ask them for the 6-digit code.');
      } else {
        // Show the security message for all successful requests
        showInfoToast(securityMessage);
        
        // You can also show a more specific message if you want
        // showSuccessToast('📧 Reset code sent to your email! Please check your inbox (expires in 15 minutes).');
      }
    } else if (data.message === 'If your account exists, you will receive a password reset code') {
      // This is the backend's security message
      showInfoToast(securityMessage);
      setTimeout(() => {
        handleModeSwitch('signin');
        setResetStep(1);
      }, 3000);
    } else {
      // For any other response, show the security message
      showInfoToast(securityMessage);
      setTimeout(() => {
        handleModeSwitch('signin');
        setResetStep(1);
      }, 3000);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


const handleResendCode = async () => {
  if (countdown > 0) {
    showInfoToast(`Please wait ${countdown} seconds before resending`);
    return;
  }

  setIsLoading(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/password/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ identifier: resetIdentifier })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        showErrorToast('Too many attempts. Please try again later.');
      } else {
        showErrorToast(data.message || 'Failed to resend code');
      }
      return;
    }

    if (data.success) {
      setResetToken(data.reset_token);
      setCountdown(60); // Reset countdown
      
      if (data.is_child) {
        showSuccessToast('📱 New reset code sent to your parent!');
      } else {
        // Show security message for resend too
        showInfoToast('If the email is registered, a new reset link will be sent');
        setTimeout(() => {
          showSuccessToast('📧 New reset code sent to your email!');
        }, 1500);
      }
    }
  } catch (err) {
    showErrorToast('Failed to resend code. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  const handleVerifyCode = async (e) => {
  e.preventDefault();
  
  if (!resetCode || resetCode.length !== 6) {
    showErrorToast('Please enter a valid 6-digit code');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${API_BASE_URL}/password/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        code: resetCode,
        reset_token: resetToken,
        identifier: resetIdentifier // Send identifier instead of email
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        if (data.attempts_remaining) {
          showErrorToast(`Invalid code. ${data.attempts_remaining} attempts remaining.`);
        } else {
          showErrorToast(data.message || 'Invalid or expired code');
        }
      } else {
        showErrorToast(data.message || 'Verification failed');
      }
      throw new Error(data.message || 'Verification failed');
    }

    if (data.success) {
      setResetStep(3);
      showSuccessToast('Code verified! ✅ Now set your new password.');
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleResetPassword = async (e) => {
  e.preventDefault();
  
  // Validate passwords
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    setTouchedFields(prev => ({ ...prev, newPassword: true }));
    setFieldErrors(prev => ({ ...prev, newPassword: passwordError }));
    showErrorToast(passwordError);
    return;
  }
  
  if (newPassword !== confirmNewPassword) {
    setTouchedFields(prev => ({ ...prev, confirmNewPassword: true }));
    setFieldErrors(prev => ({ ...prev, confirmNewPassword: 'Passwords do not match' }));
    showErrorToast("Passwords don't match!");
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const response = await fetch(`${API_BASE_URL}/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        reset_token: resetToken,
        identifier: resetIdentifier, // Send identifier instead of email
        password: newPassword,
        password_confirmation: confirmNewPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        const errors = data.errors || {};
        const errorMessages = Object.values(errors).flat();
        errorMessages.forEach(msg => showErrorToast(msg));
        throw new Error('Validation failed');
      } else {
        showErrorToast(data.message || 'Failed to reset password');
        throw new Error(data.message || 'Failed to reset password');
      }
    }

    if (data.success) {
      showSuccessToast('Password reset successful! 🎉 Please login with your new password.');
      setTimeout(() => {
        handleModeSwitch('signin');
        setResetStep(1);
        setSuccessMessage('');
        // Reset forgot password states
        setResetIdentifier('');
        setResetCode('');
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsChildReset(false);
      }, 2000);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPhoneNumber('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
    setRole('');
    setChildName('');
    setChildUsername('');
    setChildPassword('');
    setChildConfirmPassword('');
    setChildDob('');
    setHasTherapist(null);
    setTherapistEmail('');
    setHasChild(false);
    setFieldErrors({});
    setTouchedFields({});
    setResetIdentifier('');
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsChildReset(false);
    setResetStep(1);
  };

  const renderSignIn = () => (
  <div className="form-container fade-in">
    <div className="signin-logo">
      <img src={logo} alt="NeuroSpark Logo" />
    </div>
    
    <h1 className="welcome-text">WELCOME BACK</h1>
    <p className="subtitle">
      Parents & Therapists: Use your email or username<br/>
      Children: Use your username
    </p>

    {error && <div className="error-message shake">{error}</div>}
    {successMessage && <div className="success-message">{successMessage}</div>}

    <form onSubmit={handleSignInSubmit} className="auth-form">
      <Input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => handleFieldBlur('email')}
        placeholder="Enter username or email"
        label="Username or Email"
        autoComplete="username"
        error={fieldErrors.email}
        touched={touchedFields.email}
        disabled={isLoading}
      />
      {/* Add helper text for username format */}
      {!fieldErrors.email && email && !email.includes('@') && email.length > 0 && (
        <div className="field-helper-text" style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '-10px', 
          marginBottom: '10px',
          paddingLeft: '5px',
          fontStyle: 'italic'
        }}>
          ℹ️ Using username format: letters, numbers, and underscores only
        </div>
      )}

      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => handleFieldBlur('password')}
        placeholder="Enter your password"
        label="Password"
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        error={fieldErrors.password}
        touched={touchedFields.password}
        disabled={isLoading}
        required={true}
        name="signin-password"
      />

      <div className="form-options slide-up" style={{ animationDelay: '0.3s' }}>
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span className="checkbox-custom"></span>
          <span>Remember me</span>
        </label>
        <button 
          type="button" 
          className="forgot-password-link"
          onClick={() => handleModeSwitch('forgot')}
        >
          Forgot Password?
        </button>
      </div>

      <button 
        type="submit" 
        className={`auth-button slide-up ${isLoading ? 'loading' : ''}`}
        style={{ animationDelay: '0.4s' }}
        disabled={isLoading}
      >
        {isLoading ? <span className="spinner"></span> : 'Sign in'}
      </button>
      
      <p className="switch-prompt slide-up" style={{ animationDelay: '0.5s' }}>
        Don't have an account? <span className="switch-link" onClick={() => handleModeSwitch('signup')}>Sign Up</span>
      </p>
    </form>
  </div>
);

  const renderSignUp = () => (
  <div className="form-container fade-in">
    <div className="signup-logo">
      <img src={logo} alt="NeuroSpark Logo" />
    </div>
    
    <h1 className="signup-title">Create your account</h1>
    <p className="signup-subtitle">Let's get you started, it only takes a moment</p>

    <img src={star} alt="Star" className="star-item star-1 float-star" />
    <img src={star} alt="Star" className="star-item star-2 float-star-delayed" />
    <img src={star} alt="Star" className="star-item star-3 float-star" />
    <img src={star} alt="Star" className="star-item star-4 float-star-delayed" />

    {error && <div className="error-message shake">{error}</div>}
    {successMessage && <div className="success-message">{successMessage}</div>}

    <form onSubmit={handleSignUpSubmit} className="auth-form">
      <Input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={() => handleFieldBlur('fullName')}
        placeholder="Enter your full name"
        label="Full Name"
        error={fieldErrors.fullName}
        touched={touchedFields.fullName}
        disabled={isLoading}
      />

      <Input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={() => handleFieldBlur('username')}
        placeholder="Choose a username"
        label="Username"
        autoComplete="username"
        error={fieldErrors.username}
        touched={touchedFields.username}
        disabled={isLoading}
      />

      <PhoneInput
        value={phoneNumber}
        onChange={(v) => setPhoneNumber(v)}
        onBlur={() => handleFieldBlur('phoneNumber')}
        label="Phone Number"
        error={fieldErrors.phoneNumber}
        touched={touchedFields.phoneNumber}
        disabled={isLoading}
      />

      <Input
        type="email"
        value={signUpEmail}
        onChange={(e) => setSignUpEmail(e.target.value)}
        onBlur={() => handleFieldBlur('email')}
        placeholder="Enter your email"
        label="Email"
        error={fieldErrors.email}
        touched={touchedFields.email}
        disabled={isLoading}
      />

      <div className="form-row slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="form-group half">
          <PasswordInput
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            placeholder="Create password"
            label="Password"
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            error={fieldErrors.password}
            touched={touchedFields.password}
            disabled={isLoading}
            required={true}
            name="signup-password"
          />
        </div>
        <div className="form-group half">
          <PasswordInput
            value={signUpConfirmPassword}
            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
            onBlur={() => handleFieldBlur('confirmPassword')}
            placeholder="Confirm password"
            label="Confirm Password"
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            error={fieldErrors.confirmPassword}
            touched={touchedFields.confirmPassword}
            disabled={isLoading}
            required={true}
            name="signup-confirm-password"
          />
        </div>
      </div>

      <div className="role-selection-container slide-up" style={{ animationDelay: '0.35s' }}>
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              <span className="radio-custom"></span>
              Therapist
            </label>
          </div>

          <img src={flower} alt="Flower" className="flower-icon right" />
        </div>
      </div>

      {role === 'parent' && (
        <div className="parent-fields slide-down">
          <h3 className="section-title">Child's Information</h3>
          
          <div className="form-row">
            <div className="form-group half">
              <Input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onBlur={() => handleFieldBlur('childName')}
                placeholder="Enter child's full name"
                label="Child's Full Name"
                error={fieldErrors.childName}
                touched={touchedFields.childName}
                disabled={isLoading}
              />
            </div>
            <DatePicker
              className="half"
              value={childDob}
              onChange={(v) => setChildDob(v)}
              onBlur={() => handleFieldBlur('childDob')}
              label="Child's Date of Birth"
              error={fieldErrors.childDob}
              touched={touchedFields.childDob}
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <Input
                type="text"
                value={childUsername}
                onChange={(e) => setChildUsername(e.target.value)}
                onBlur={() => handleFieldBlur('childUsername')}
                placeholder="Child's username"
                label="Child's Username"
                autoComplete="username"
                error={fieldErrors.childUsername}
                touched={touchedFields.childUsername}
                disabled={isLoading}
              />
            </div>
            <div className="form-group half">
              <PasswordInput
                value={childPassword}
                onChange={(e) => setChildPassword(e.target.value)}
                onBlur={() => handleFieldBlur('childPassword')}
                placeholder="Child's password"
                label="Child's Password"
                showPassword={showChildPassword}
                setShowPassword={setShowChildPassword}
                error={fieldErrors.childPassword}
                touched={touchedFields.childPassword}
                disabled={isLoading}
                required={true}
                isChild={true}
                name="child-password"
              />
            </div>
          </div>

          <div className="form-group">
            <PasswordInput
              value={childConfirmPassword}
              onChange={(e) => setChildConfirmPassword(e.target.value)}
              onBlur={() => handleFieldBlur('childConfirmPassword')}
              placeholder="Confirm child's password"
              label="Confirm Child's Password"
              showPassword={showChildConfirmPassword}
              setShowPassword={setShowChildConfirmPassword}
              error={fieldErrors.childConfirmPassword}
              touched={touchedFields.childConfirmPassword}
              disabled={isLoading}
              required={true}
              isChild={true}
              name="child-confirm-password"
            />
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
                  disabled={isLoading}
                />
                <span className="radio-custom"></span>
                Yes, I have a therapist
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="hasTherapist" 
                  value="no" 
                  checked={hasTherapist === 'no'}
                  onChange={(e) => setHasTherapist(e.target.value)}
                  disabled={isLoading}
                />
                <span className="radio-custom"></span>
                No, I don't have a therapist
              </label>
            </div>
          </div>

          {hasTherapist === 'yes' && (
            <Input
              type="email"
              value={therapistEmail}
              onChange={(e) => setTherapistEmail(e.target.value)}
              onBlur={() => handleFieldBlur('therapistEmail')}
              placeholder="Enter therapist's email"
              label="Therapist Email"
              error={fieldErrors.therapistEmail}
              touched={touchedFields.therapistEmail}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {role === 'therapist' && (
        <div className="therapist-fields slide-down">
          <div className="role-selection-container" style={{ margin: '15px 0' }}>
            <div className="role-header" style={{ backgroundImage: `url(${roleBg})` }}>
              <span>Do you have a child?</span>
            </div>
            <div className="radios vertical-radios">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={hasChild}
                  onChange={(e) => setHasChild(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                Yes, I have a child
              </label>
            </div>
          </div>

          {hasChild && (
            <div className="child-fields-section">
              <h3 className="section-title">Child's Information</h3>
              
              <div className="form-row">
                <div className="form-group half">
                  <Input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    onBlur={() => handleFieldBlur('childName')}
                    placeholder="Enter child's full name"
                    label="Child's Full Name"
                    error={fieldErrors.childName}
                    touched={touchedFields.childName}
                    disabled={isLoading}
                  />
                </div>
                <DatePicker
                  className="half"
                  value={childDob}
                  onChange={(v) => setChildDob(v)}
                  onBlur={() => handleFieldBlur('childDob')}
                  label="Child's Date of Birth"
                  error={fieldErrors.childDob}
                  touched={touchedFields.childDob}
                  disabled={isLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <Input
                    type="text"
                    value={childUsername}
                    onChange={(e) => setChildUsername(e.target.value)}
                    onBlur={() => handleFieldBlur('childUsername')}
                    placeholder="Child's username"
                    label="Child's Username"
                    error={fieldErrors.childUsername}
                    touched={touchedFields.childUsername}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group half">
                  <PasswordInput
                    value={childPassword}
                    onChange={(e) => setChildPassword(e.target.value)}
                    onBlur={() => handleFieldBlur('childPassword')}
                    placeholder="Child's password"
                    label="Child's Password"
                    showPassword={showChildPassword}
                    setShowPassword={setShowChildPassword}
                    error={fieldErrors.childPassword}
                    touched={touchedFields.childPassword}
                    disabled={isLoading}
                    required={true}
                    isChild={true}
                    name="therapist-child-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <PasswordInput
                  value={childConfirmPassword}
                  onChange={(e) => setChildConfirmPassword(e.target.value)}
                  onBlur={() => handleFieldBlur('childConfirmPassword')}
                  placeholder="Confirm child's password"
                  label="Confirm Child's Password"
                  showPassword={showChildConfirmPassword}
                  setShowPassword={setShowChildConfirmPassword}
                  error={fieldErrors.childConfirmPassword}
                  touched={touchedFields.childConfirmPassword}
                  disabled={isLoading}
                  required={true}
                  isChild={true}
                  name="therapist-child-confirm-password"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button 
        type="submit" 
        className={`auth-button slide-up ${isLoading ? 'loading' : ''}`}
        style={{ animationDelay: '0.4s' }}
        disabled={isLoading || !role}
      >
        {isLoading ? <span className="spinner"></span> : 'Create your Account'}
      </button>
      
      <p className="switch-prompt slide-up" style={{ animationDelay: '0.5s' }}>
        Already have an account? <span className="switch-link" onClick={() => handleModeSwitch('signin')}>Sign In here</span>
      </p>
    </form>
  </div>
);

  const renderForgotPassword = () => (
  <div className="forgot-container fade-in">
    <img src={logo} alt="NeuroSpark Logo" className="forgot-logo bounce" />
    
    <h2 className="forgot-title">Reset Password</h2>
    
    {error && <div className="error-message shake">{error}</div>}
    {successMessage && <div className="success-message">{successMessage}</div>}

    {resetStep === 1 && (
  <form onSubmit={handleForgotPassword} className="auth-form">
    <p className="forgot-description">
      👤 Children: Enter your username<br/>
      👨‍👩‍👧 Parents & Therapists: Enter your email
    </p>
    
    <Input
      type="text"
      value={resetIdentifier}
      onChange={(e) => setResetIdentifier(e.target.value)}
      onBlur={() => handleFieldBlur('resetIdentifier')}
      placeholder="Enter username or email"
      label="Username or Email"
      autoComplete="username"
      error={fieldErrors.resetIdentifier}
      touched={touchedFields.resetIdentifier}
      disabled={isLoading}
    />
    
    {/* Add helper text for username format */}
    {!fieldErrors.resetIdentifier && resetIdentifier && !resetIdentifier.includes('@') && resetIdentifier.length > 0 && (
      <div className="field-helper-text" style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '-10px', 
        marginBottom: '15px',
        paddingLeft: '5px',
        fontStyle: 'italic'
      }}>
        ℹ️ Username format: letters, numbers, and underscores only (3-30 characters)
      </div>
    )}
    
    {/* Add helper text for email format */}
    {!fieldErrors.resetIdentifier && resetIdentifier && resetIdentifier.includes('@') && resetIdentifier.length > 0 && (
      <div className="field-helper-text" style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '-10px', 
        marginBottom: '15px',
        paddingLeft: '5px',
        fontStyle: 'italic'
      }}>
        ℹ️ Email should be from a major provider (Gmail, Yahoo, Outlook, etc.)
      </div>
    )}

    <button 
      type="submit" 
      className={`auth-button slide-up ${isLoading ? 'loading' : ''}`}
      style={{ animationDelay: '0.2s' }}
      disabled={isLoading || !resetIdentifier}
    >
      {isLoading ? <span className="spinner"></span> : 'Send Reset Code'}
    </button>
  </form>
)}

    {resetStep === 2 && (
  <form onSubmit={handleVerifyCode} className="auth-form">
    {isChildReset ? (
      <p className="forgot-description">
        📱 A 6-digit code has been sent to your parent.
        Please ask them for the code.
      </p>
    ) : (
      <p className="forgot-description">
        📧 Enter the 6-digit code sent to your email.
      </p>
    )}
    
    <Input
      type="text"
      value={resetCode}
      onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
      onBlur={() => handleFieldBlur('resetCode')}
      placeholder="Enter 6-digit code"
      label="Verification Code"
      error={fieldErrors.resetCode}
      touched={touchedFields.resetCode}
      disabled={isLoading}
      maxLength="6"
    />

    {countdown > 0 ? (
      <p className="resend-timer">Resend code in {countdown}s</p>
    ) : (
      <button 
        type="button" 
        className="forgot-password-link"
        onClick={handleResendCode}
        disabled={isLoading}
        style={{ 
          margin: '10px auto', 
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Resend Code
      </button>
    )}

    <button 
      type="submit" 
      className={`auth-button slide-up ${isLoading ? 'loading' : ''}`}
      style={{ animationDelay: '0.2s' }}
      disabled={isLoading || resetCode.length !== 6}
    >
      {isLoading ? <span className="spinner"></span> : 'Verify Code'}
    </button>

    <button 
      type="button" 
      className="back-to-login"
      onClick={() => {
        setResetStep(1);
        setResetCode('');
      }}
    >
      ← Use different username/email
    </button>
  </form>
)}

    {resetStep === 3 && (
      <form onSubmit={handleResetPassword} className="auth-form">
        <p className="forgot-description">
          Create your new password (min 8 characters with uppercase, lowercase, number & special character).
        </p>
        
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={() => handleFieldBlur('newPassword')}
          placeholder="Enter new password"
          label="New Password"
          showPassword={showNewPassword}
          setShowPassword={setShowNewPassword}
          error={fieldErrors.newPassword}
          touched={touchedFields.newPassword}
          disabled={isLoading}
          required={true}
        />

        <PasswordInput
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          onBlur={() => handleFieldBlur('confirmNewPassword')}
          placeholder="Confirm new password"
          label="Confirm New Password"
          showPassword={showConfirmNewPassword}
          setShowPassword={setShowConfirmNewPassword}
          error={fieldErrors.confirmNewPassword}
          touched={touchedFields.confirmNewPassword}
          disabled={isLoading}
          required={true}
        />

        <button 
          type="submit" 
          className={`auth-button slide-up ${isLoading ? 'loading' : ''}`}
          style={{ animationDelay: '0.2s' }}
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner"></span> : 'Reset Password'}
        </button>
      </form>
    )}

    <button 
      type="button" 
      className="back-to-login"
      onClick={() => handleModeSwitch('signin')}
    >
      ← Back to Sign In
    </button>
  </div>
);

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 10000 }}
      />
      <div className={`auth-modal-container ${transitioning ? 'transitioning' : ''}`}>
        <div className="auth-modal-content">
          {mode !== 'forgot' && (
            <>
              {mode === 'signin' ? (
                // SIGN IN LAYOUT: Video on left, form on right
                <>
                  <div className="modal-side visual-side signin-visual">
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="auth-video" 
                      ref={(video) => {
                        if (video) {
                          video.playbackRate = 0.95;
                        }
                      }}
                    >
                      <source src={duckVideo} type="video/mp4" />
                    </video>
                  </div>

                  <div className="modal-side form-side signin-form-side">
                    {cloudsVisible && (
                      <>
                        <img src={cloud} alt="Cloud" className="cloud-item cloud-left-img cloud-float" />
                        <img src={cloudR} alt="Cloud" className="cloud-item cloud-right-img cloud-float-delayed" />
                      </>
                    )}

                    <div className="form-content-wrapper" ref={formContentRef}>
                      {renderSignIn()}
                    </div>
                  </div>
                </>
              ) : (
                // SIGN UP LAYOUT: Form on left, video on right
                <>
                  <div className="modal-side form-side signup-form-side">
                    <div className={`form-content-wrapper ${showScrollIndicator ? 'scrollable' : ''}`} ref={formContentRef}>
                      {renderSignUp()}
                    </div>
                  </div>

                  <div className="modal-side visual-side signup-visual">
                    <video autoPlay loop muted playsInline className="auth-video">
                      <source src={signupVideo} type="video/mp4" />
                    </video>
                    <div className="video-overlay-text">
                      <h1>EXPLORE.<br/>LEARN. GROW.</h1>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'forgot' && (
            <div className="modal-side form-side forgot-form-side">
              {renderForgotPassword()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;