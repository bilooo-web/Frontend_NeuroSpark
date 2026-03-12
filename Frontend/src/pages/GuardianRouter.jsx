import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TherapistDashboard from '../pages/TherapistDashboard';
import ParentDashboard from '../pages/ParentDashboard'; // Make sure this exists
import Children from '../pages/Children';
import ChildDetail from '../pages/ChildDetail';
import Settings from '../pages/Settings';
import Feedbacks from './Feedbacks';
import Anomalies from '../pages/Anomalies';
import PendingInvites from '../pages/PendingInvites';

const GuardianRouter = () => {
  const { user } = useApp();
  console.log('FULL USER OBJECT:', JSON.stringify(user)); 
  const guardianType = user?.guardian?.guardian_type;

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