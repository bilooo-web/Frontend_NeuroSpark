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
        // Quick local check first
        const localUser = JSON.parse(userStr);

        // If role doesn't match locally, no need to call server
        if (requiredRole && localUser.role !== requiredRole) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // Verify token with server (single call, not two)
        const response = await api.get('/me');

        if (response.success && response.user) {
          const currentUser = response.user;

          // Check if role matches required role
          if (requiredRole && currentUser.role !== requiredRole) {
            setIsAuthorized(false);
            setLoading(false);
            return;
          }

          // Update stored user data with fresh server data
          localStorage.setItem('user', JSON.stringify(currentUser));

          // Extract guardian_type from nested guardian object or flat field
          if (currentUser.role === 'guardian') {
            const gType = currentUser.guardian?.guardian_type 
                       || currentUser.guardian_type 
                       || localStorage.getItem('guardian_type');
            if (gType) {
              localStorage.setItem('guardian_type', gType);
              setGuardianType(gType);
            }
          }

          setIsAuthorized(true);
        } else {
          // Server didn't return valid user
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('guardian_type');
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Don't clear tokens on network errors - only on 401s
        // (401s are already handled by api.js which redirects)
        if (error.message === 'Unauthorized') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('guardian_type');
        }
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