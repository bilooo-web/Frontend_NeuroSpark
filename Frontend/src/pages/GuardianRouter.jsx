import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TherapistDashboard from '../pages/TherapistDashboard';
import ParentDashboard from '../pages/ParentDashboard';
import Children from '../pages/Children';
import ChildDetail from '../pages/ChildDetail';
import Settings from '../pages/Settings';
import Feedbacks from './Feedbacks';
import Anomalies from '../pages/Anomalies';
import PendingInvites from '../pages/PendingInvites';

const GuardianRouter = ({ guardianType: guardianTypeProp }) => {
  const { user } = useApp();
  const [guardianType, setGuardianType] = useState(null);

  useEffect(() => {
    // Determine guardian_type from multiple sources (in priority order):
    // 1. Prop passed from ProtectedRoute
    // 2. Nested guardian object from /me endpoint (user.guardian.guardian_type)
    // 3. Flat field from login response (user.guardian_type)
    // 4. localStorage fallback
    const gType = guardianTypeProp
      || user?.guardian?.guardian_type
      || user?.guardian_type
      || localStorage.getItem('guardian_type');

    console.log('GuardianRouter - resolved guardian_type:', gType, {
      prop: guardianTypeProp,
      nested: user?.guardian?.guardian_type,
      flat: user?.guardian_type,
      localStorage: localStorage.getItem('guardian_type'),
    });

    setGuardianType(gType);
  }, [user, guardianTypeProp]);

  // Show loading while guardian type is being determined
  if (!guardianType) {
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

  return (
    <Routes>
      {/* Dynamic dashboard based on guardian type */}
      <Route 
        path="/dashboard" 
        element={
          guardianType === 'therapist' 
            ? <TherapistDashboard /> 
            : <ParentDashboard />
        } 
      />
      
      {/* Common routes for both */}
      <Route path="/children" element={<Children />} />
      <Route path="/children/:id" element={<ChildDetail />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/feedbacks" element={<Feedbacks />} />
      
      {/* Therapist-only routes */}
      {guardianType === 'therapist' && (
        <>
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/invites" element={<PendingInvites />} />
        </>
      )}
      
      {/* Parent-only routes (if any) */}
      {guardianType === 'parent' && (
        <>
          {/* Add parent-specific routes here */}
        </>
      )}
      
      <Route path="*" element={<Navigate to="/guardian/dashboard" replace />} />
    </Routes>
  );
};

export default GuardianRouter;