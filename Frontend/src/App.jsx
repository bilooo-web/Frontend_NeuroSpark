import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import SignInModal from "./components/auth/SignInModal/SignInModal";


function App() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <BrowserRouter>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        <Route path="/about" element={<AboutUs2 />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
