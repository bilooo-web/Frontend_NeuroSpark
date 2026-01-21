import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Challenges from "./pages/Challenges";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
