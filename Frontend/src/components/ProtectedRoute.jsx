import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        
        // Fast path: Check if local storage user already satisfies the role
        if (requiredRole && user.role !== requiredRole) {
          // If local storage says no, we can double check or just fail
          // For now, let's just fail if local role doesn't match
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // If we have a token and the local role looks good, proceed immediately
        setIsAuthorized(true);
        setLoading(false);

        // Verify with server in the background
        api.get('/me').then(response => {
          if (response.success && response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            if (requiredRole && response.user.role !== requiredRole) {
              setIsAuthorized(false);
            }
          }
        }).catch(err => {
          console.error('Background auth verification failed:', err);
          // 401s are handled by api.js redirecting
        });

      } catch (error) {
        console.error('Auth check initialization failed:', error);
        setIsAuthorized(false);
        setLoading(false);
      } finally {
        // Only set loading false if it hasn't been set yet
        setLoading(prev => prev ? false : false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;