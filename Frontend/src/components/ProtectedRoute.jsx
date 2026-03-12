import React from 'react'; 
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardianType, setGuardianType] = useState(null);

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
        
        // Verify token by making a request to /me
        const response = await api.get('/me');
        
        if (response.success && response.user) {
          const currentUser = response.user;
          
          // Check if role matches required role
          if (requiredRole && currentUser.role !== requiredRole) {
            setIsAuthorized(false);
          } else {
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(currentUser));

            if (currentUser.role === 'guardian' && currentUser.guardian_type) {
              localStorage.setItem('guardian_type', currentUser.guardian_type);
              setGuardianType(currentUser.guardian_type);
            }
            setIsAuthorized(true);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('guardian_type');
        setIsAuthorized(false);
      } finally {
        setLoading(false);
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

  return React.cloneElement(children, { guardianType });
};

export default ProtectedRoute;