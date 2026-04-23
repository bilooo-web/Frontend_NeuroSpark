import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TherapistDashboard from '../pages/TherapistDashboard';
import ParentDashboard from '../pages/ParentDashboard';
import Children from '../pages/Children';
import ParentChildren from '../pages/ParentChildren';
import ChildDetail from '../pages/ChildDetail';
import Settings from '../pages/Settings';
import Feedbacks from './Feedbacks';
import Anomalies from '../pages/Anomalies';
import PendingInvites from '../pages/PendingInvites';
import TherapistDirectory from '../pages/TherapistDirectory';

const GuardianRouter = ({ guardianType: guardianTypeProp }) => {
  const { user } = useApp();
  const [guardianType, setGuardianType] = useState(null);

  useEffect(() => {
    const gType = guardianTypeProp
      || user?.guardian?.guardian_type
      || user?.guardian_type
      || localStorage.getItem('guardian_type');

    setGuardianType(gType);
  }, [user, guardianTypeProp]);

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
      {/* Dynamic dashboard */}
      <Route
        path="/dashboard"
        element={
          guardianType === 'therapist'
            ? <TherapistDashboard />
            : <ParentDashboard />
        }
      />

      {/* Therapist-only routes */}
      {guardianType === 'therapist' && (
        <>
          <Route path="/children"  element={<Children />} />
          <Route path="/children/:id" element={<ChildDetail />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/invites"   element={<PendingInvites />} />
        </>
      )}

      {/* Parent-only routes */}
      {guardianType === 'parent' && (
        <>
          <Route path="/children"        element={<ParentChildren />} />
          <Route path="/children/:id"    element={<ChildDetail />} />
          <Route path="/therapists"      element={<TherapistDirectory />} />
        </>
      )}

      {/* Common routes */}
      <Route path="/settings"  element={<Settings />} />
      <Route path="/feedbacks" element={<Feedbacks />} />

      <Route path="*" element={<Navigate to="/guardian/dashboard" replace />} />
    </Routes>
  );
};

export default GuardianRouter;