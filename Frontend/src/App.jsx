import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import Customization from "./pages/Customization";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
        <Route path="/customization" element={<Customization />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
