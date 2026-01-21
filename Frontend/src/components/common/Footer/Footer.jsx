import './Footer.css';

import logo from '../../../assets/logo_s.png';
import facebook from '../../../assets/facebook.png';
import instagram from '../../../assets/instagram.png';
import twitter from '../../../assets/twitter.png';

function Footer() {
  return (
    <footer className="footer">
      
      {/* 🌊 TOP WAVE */}
      <div className="footer-wave">
        <svg className="footer-wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,0 C150,80 350,20 600,80 S850,20 1200,80 L1200,120 L0,120 Z"
            fill="#EAFBF7"
          >
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="
                M0,0 C150,80 350,20 600,80 S850,20 1200,80 L1200,120 L0,120 Z;
                M0,0 C150,20 350,80 600,20 S850,80 1200,20 L1200,120 L0,120 Z;
                M0,0 C150,80 350,20 600,80 S850,20 1200,80 L1200,120 L0,120 Z
              "
            />
          </path>
        </svg>
      </div>

      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">
          <img src={logo} alt="NeuroSpark" className="footer-logo" />
          <p className="footer-tagline">
            Transforming learning into engaging play experiences that build focus, 
            confidence, and real-life skills through neuroscience-backed games.
          </p>
          
        </div>

        {/* LINKS */}
        <div className="footer-links-grid">
          
          <div className="footer-links-section">
            <h4 className="footer-section-title">LEARNING </h4>
            <a href="/challenges" className="footer-link">Game Challenges</a>
            <a href="/roadmap" className="footer-link">Virtual City</a>
            <a href="/reading" className="footer-link">Reading & Grammar</a>
          </div>

          <div className="footer-links-section">
            <h4 className="footer-section-title">DASHBOARD</h4>
            <a href="/dashboard" className="footer-link">Therapist Portal</a>
            <a href="/progress" className="footer-link">Progress Analytics</a>
            <a href="/points" className="footer-link">Points & Rewards</a>
            <a href="/customization" className="footer-link">Game Customization</a>
          </div>

          <div className="footer-links-section">
            <h4 className="footer-section-title">RESOURCES</h4>
            <a href="/blog" className="footer-link">Learning Blog</a>
            <a href="/research" className="footer-link">Science Behind</a>
            <a href="/guides" className="footer-link">Parent Guides</a>
            <a href="/faq" className="footer-link">FAQ & Support</a>
          </div>

          <div className="footer-links-section">
            <h4 className="footer-section-title">COMPANY</h4>
            <a href="/about" className="footer-link">Our Mission</a>
            <a href="/team" className="footer-link">Our Team</a>
            <a href="/contact" className="footer-link">Contact Us</a>
            <a href="/privacy" className="footer-link">Privacy Policy</a>
          </div>

        </div>

      </div>

      {/* SOCIAL & BOTTOM */}
      <div className="footer-bottom-section">
        <div className="footer-social-container">
          <h4 className="social-title">Connect With Our Community</h4>
          <p className="social-subtitle">Join thousands of therapists, educators, and parents</p>
          <div className="social-icons-container">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              <img src={facebook} alt="Facebook" className="social-icon" />
              <span>Facebook</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              <img src={instagram} alt="Instagram" className="social-icon" />
              <span>Instagram</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-link">
              <img src={twitter} alt="Twitter" className="social-icon" />
              <span>Twitter</span>
            </a>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-copyright">
          <div className="copyright-text">
            © {new Date().getFullYear()} NeuroSpark Learning Platform. All rights reserved.
          </div>
          <div className="footer-extra-links">
            <a href="/terms">Terms of Service</a>
            <span className="divider">•</span>
            <a href="/privacy">Privacy Policy</a>
            <span className="divider">•</span>
            <a href="/cookies">Cookie Policy</a>
          </div>
        </div>
      </div>

    </footer>
  );
}

export default Footer;