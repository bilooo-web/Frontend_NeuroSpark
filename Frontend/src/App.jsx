import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import SignInModal from "./components/auth/SignInModal/SignInModal";
import PathChangeGame from "./games/PathChange/PathChangeGame";
import Customization from "./pages/Customization";


function App() {
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignIn(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        <Route path="/challenges/:id/play" element={<PathChangeGame />} />
        <Route path="/about" element={<AboutUs2 />} />
        <Route path="/customization" element={<Customization />} />
        <Route path="/path-change-game" element={<PathChangeGame />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
