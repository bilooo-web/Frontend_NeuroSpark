import { BrowserRouter, Routes, Route , useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';

import { AppProvider } from './context/AppContext';

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminGames from "./pages/AdminGames";
import AdminVoiceInstructions from "./pages/AdminVoiceInstructions";
import AdminReports from "./pages/AdminReports";
import AdminNotifications from "./pages/AdminNotifications";
import FeedbackDashboard from './components/admin/FeedbackDashboard';

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
import StoryIntro from "./pages/StoryIntro";
import ProtectedRoute from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot/Chatbot";
import GuardianRouter from "./pages/GuardianRouter";
import ParentDashboard from "./pages/ParentDashboard";
import Children from "./pages/Children";
import ChildDetail from "./pages/ChildDetail";
import PendingInvites from "./pages/PendingInvites";
import Anomalies from "./pages/Anomalies";
import Feedbacks from "./pages/Feedbacks";
import Settings from "./pages/Settings";
import ChildDashboard from "./pages/ChildDashboard";
import AdminFeedback from "./pages/AdminFeedback";
import './styles/dashboard.css'; 
import './components/common/Loader.css';

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

    const handleLogout = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('open-auth', handleOpenAuth);
    window.addEventListener('close-auth', handleCloseAuth);
    window.addEventListener('login-success', handleLoginSuccess);
    window.addEventListener('logout', handleLogout);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-auth', handleOpenAuth);
      window.removeEventListener('close-auth', handleCloseAuth);
      window.removeEventListener('login-success', handleLoginSuccess);
      window.removeEventListener('logout', handleLogout);
    };
  }, [showAuth , isAuthenticated]);

  return (
    <AppProvider>
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
        <Route path="/story/:id/intro" element={<StoryIntro />} />
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
          <Route path="/admin/feedback" element={<AdminFeedback />} />
        </Route>

        {/* Child Routes */}
        <Route 
          path="/child-dashboard" 
          element={
            <ProtectedRoute requiredRole="child">
              <ChildDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Guardian Routes */}
        <Route 
            path="/guardian/*" 
            element={
              <ProtectedRoute requiredRole="guardian">
                <GuardianRouter />
              </ProtectedRoute>
            } 
        />

      </Routes>
      <Chatbot />

    </BrowserRouter>
    </AppProvider>

  );
}

export default App;
