import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import AuthModal from "./components/auth/AuthModal";
import PathChangeGame from "./games/PathChange/PathChangeGame";
import Customization from "./pages/Customization";
import Reading from "./pages/ReadingPage";

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const autoPopupFired = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showAuth && !autoPopupFired.current && !isAuthenticated) {
        setShowAuth(true);
        setAuthMode('signin');
        autoPopupFired.current = true;
      }
    }, 5000);

    const handleOpenAuth = (e) => {
      clearTimeout(timer);
      autoPopupFired.current = true;
      setAuthMode(e.detail || 'signin');
      setShowAuth(true);
    };

    const handleCloseAuth = () => {
      setShowAuth(false);
    };

     const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      setShowAuth(false);
    };

    window.addEventListener('open-auth', handleOpenAuth);
    window.addEventListener('close-auth', handleCloseAuth);
    window.addEventListener('login-success', handleLoginSuccess);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-auth', handleOpenAuth);
      window.removeEventListener('close-auth', handleCloseAuth);
      window.removeEventListener('login-success', handleLoginSuccess);
    };
  }, [showAuth , isAuthenticated]);

  return (
    <BrowserRouter>
      {showAuth && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          initialMode={authMode}
        />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        <Route path="/challenges/:id/play" element={<PathChangeGame />} />
        <Route path="/about" element={<AboutUs2 />} />
        <Route path="/customization" element={<Customization />} />
        <Route path="/ReadingPage" element={<Reading />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
