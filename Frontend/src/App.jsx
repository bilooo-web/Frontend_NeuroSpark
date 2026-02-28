import { BrowserRouter, Routes, Route , useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify'; // Add this import

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGames from "./pages/AdminGames";
import AdminVoiceInstructions from "./pages/AdminVoiceInstructions";
import AdminReports from "./pages/AdminReports";
import AdminNotifications from "./pages/AdminNotifications";

import AboutUs2 from "./pages/AboutUs2";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import AuthModal from "./components/auth/AuthModal";
import PathChangeGame from "./games/PathChange/PathChangeGame";
import Customization from "./pages/Customization";
import Reading from "./pages/ReadingPage";
import GameSwitcher from "./games/GameSwitcher";
import StoryBook from "./pages/StoryBook";
import ProtectedRoute from "./components/ProtectedRoute";


const AdminRoute = ({ children }) => {
      const navigate = useNavigate();
      const [isAdmin, setIsAdmin] = useState(false);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const checkAdmin = async () => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const token = localStorage.getItem('token');
          
          if (!token || user.role !== 'admin') {
            navigate('/');
            toast.error('Admin access required');
          } else {
            setIsAdmin(true);
          }
          setLoading(false);
        };

        checkAdmin();
      }, [navigate]);

      if (loading) {
        return (
          <div className="page-center">
            <div className="loading-spinner"></div>
          </div>
        );
      }

      return isAdmin ? children : null;
    };
import Chatbot from "./components/Chatbot/Chatbot";



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

         {/* Public Routes */}
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


        {/* Admin Routes */}
        <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="voice-instructions" element={<AdminVoiceInstructions />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

      </Routes>
      <Chatbot />

    </BrowserRouter>

  );
}

export default App;
