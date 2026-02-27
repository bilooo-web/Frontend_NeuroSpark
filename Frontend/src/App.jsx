import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import SignInModal from "./components/auth/SignInModal/SignInModal";
import SignUp from "./components/auth/SignUp/SignUp";
import PathChangeGame from "./games/PathChange/PathChangeGame";
import Customization from "./pages/Customization";
import Reading from "./pages/ReadingPage";
import GameSwitcher from "./games/GameSwitcher";
import StoryBook from "./pages/StoryBook";
import ChatbotButton from "./components/Chatbot/ChatbotButton";




function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const autoPopupFired = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showSignIn && !showSignUp && !autoPopupFired.current) {
        setShowSignIn(true);
        autoPopupFired.current = true;
      }
    }, 5000);

    const handleOpenAuth = (e) => {
      clearTimeout(timer);
      autoPopupFired.current = true;
      if (e.detail === 'signup') {
        setShowSignIn(false);
        setShowSignUp(true);
      } else {
        setShowSignUp(false);
        setShowSignIn(true);
      }
    };

    const handleCloseAuth = () => {
      setShowSignIn(false);
      setShowSignUp(false);
    };

    window.addEventListener('open-auth', handleOpenAuth);
    window.addEventListener('close-auth', handleCloseAuth);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-auth', handleOpenAuth);
      window.removeEventListener('close-auth', handleCloseAuth);
    };
  }, [showSignIn, showSignUp]);

  return (
    <BrowserRouter>
      {showSignIn && (
        <SignInModal 
          onClose={() => setShowSignIn(false)} 
          onSwitch={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}
      {showSignUp && (
        <SignUp 
          onClose={() => setShowSignUp(false)} 
          onSwitch={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        <Route 
          path="/challenges/:id/play" 
          element={
            <GameSwitcher />
          } 
        />
        <Route path="/about" element={<AboutUs2 />} />
        <Route path="/customization" element={<Customization />} />
        <Route path="/ReadingPage" element={<Reading />} />
        <Route path="/story/:id" element={<StoryBook />} />
      </Routes>
      <ChatbotButton />
    </BrowserRouter>

  );
}

export default App;
