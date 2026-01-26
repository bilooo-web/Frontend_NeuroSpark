import { BrowserRouter, Routes, Route } from "react-router-dom";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
<<<<<<< HEAD
        <Route path="/challenges/:id" element={<ChallengeDetails />} />
=======
        <Route path="/about" element={<AboutUs2 />} />
>>>>>>> 3c8a74f (Developing About Us page)
      </Routes>
    </BrowserRouter>
  );
}

export default App;
