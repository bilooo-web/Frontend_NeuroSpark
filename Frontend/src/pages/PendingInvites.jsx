import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Check, X } from 'lucide-react';
import guardianService from '../services/guardianService';

const PendingInvites = () => {
  const { isTherapist } = useApp();
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  
  
  useEffect(() => {
    if (!isTherapist) {
      navigate('/guardian/dashboard');
      return;
    }
    
    loadInvites();
  }, [isTherapist]);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const response = await guardianService.getPendingInvites();
      console.log('Invites:', JSON.stringify(response));
      // api.js unwraps HTTP body, so response IS { pending_invites: [...] } directly
      setInvites(response.pending_invites || response.data || []);
    } catch (err) {
      setError('Failed to load invites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId) => {
    setProcessing(inviteId);
    setError('');
    try {
      await guardianService.acceptInvite(inviteId);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      setError('Failed to accept invite');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (inviteId) => {
    setProcessing(inviteId);
    setError('');
    try {
      await guardianService.rejectInvite(inviteId);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      setError('Failed to reject invite');
    } finally {
      setProcessing(null);
    }
  };

  if (!isTherapist) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="nt-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Pending Invites</div>
          <div className="nt-page-subtitle">Invitations from parents to connect with their children</div>
        </div>
      </div>

      {error && (
        <div className="nt-error-message" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {invites.length === 0 ? (
        <div className="nt-card nt-empty-state">No pending invites.</div>
      ) : (
        <div className="nt-space-y-4">
          {invites.map(invite => (
            <div key={invite.id} className="nt-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="nt-stat-icon pink"><Mail /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--nt-text-primary)' }}>
                  {invite.guardian?.user?.full_name || invite.parent_name || 'Unknown Parent'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--nt-text-secondary)' }}>
                  Wants to connect child: <strong>{invite.child?.user?.full_name || invite.child_name}</strong> · 
                  Sent {new Date(invite.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="nt-btn nt-btn-primary" 
                  style={{ padding: '8px 16px' }}
                  onClick={() => handleAccept(invite.id)}
                  disabled={processing === invite.id}
                >
                  <Check /> {processing === invite.id ? 'Accepting...' : 'Accept'}
                </button>
                <button 
                  className="nt-btn nt-btn-outline" 
                  style={{ padding: '8px 16px' }}
                  onClick={() => handleReject(invite.id)}
                  disabled={processing === invite.id}
                >
                  <X /> {processing === invite.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PendingInvites;