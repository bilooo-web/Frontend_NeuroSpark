import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Check, X, RefreshCw } from 'lucide-react';
import guardianService from '../services/guardianService';

const PendingInvites = () => {
  const { isTherapist } = useApp();
  const navigate  = useNavigate();
  const [invites,    setInvites]    = useState([]);
  const [hydrating,  setHydrating]  = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error,      setError]      = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!isTherapist) { navigate('/guardian/dashboard'); return; }
    loadInvites();
    return () => { mounted.current = false; };
  }, [isTherapist]);

  const loadInvites = async () => {
    setError('');
    try {
      const response = await guardianService.getPendingInvites();
      if (!mounted.current) return;
      setInvites(response.pending_invites || response.data || []);
    } catch (err) {
      if (mounted.current) setError('Failed to load invites. Please retry.');
    } finally {
      if (mounted.current) setHydrating(false);
    }
  };

  const handleAccept = async (inviteId) => {
    setProcessing(inviteId); setError('');
    // Optimistic remove
    setInvites(prev => prev.filter(i => i.id !== inviteId));
    try {
      await guardianService.acceptInvite(inviteId);
    } catch {
      setError('Failed to accept invite');
      loadInvites(); // re-fetch to restore
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  const handleReject = async (inviteId) => {
    setProcessing(inviteId); setError('');
    setInvites(prev => prev.filter(i => i.id !== inviteId));
    try {
      await guardianService.rejectInvite(inviteId);
    } catch {
      setError('Failed to reject invite');
      loadInvites();
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  if (!isTherapist) return null;

  return (
    <DashboardLayout>
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Pending Invites</div>
          <div className="ptd-page-subtitle">Invitations from parents to connect with their children</div>
        </div>
        <button className="ptd-btn ptd-btn-outline" onClick={loadInvites} disabled={hydrating}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={15} className={hydrating ? 'ptd-spin' : ''} />
          {hydrating ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', color:'#991B1B', padding:'12px 16px', borderRadius:8, marginBottom:16, display:'flex', justifyContent:'space-between' }}>
          <span>⚠️ {error}</span>
          <button onClick={loadInvites} style={{ background:'none', border:'none', color:'#991B1B', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>Retry</button>
        </div>
      )}

      {hydrating && invites.length === 0 ? (
        /* Skeleton while loading */
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background:'white', borderRadius:12, border:'1px solid #E8EAF0', padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#F3F4F6' }} />
              <div style={{ flex:1 }}>
                <div style={{ height:13, background:'#F3F4F6', borderRadius:6, width:'40%', marginBottom:8 }} />
                <div style={{ height:11, background:'#F3F4F6', borderRadius:6, width:'65%' }} />
              </div>
              <div style={{ width:160, height:34, background:'#F3F4F6', borderRadius:8 }} />
            </div>
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="ptd-card ptd-empty-state">
          <Mail size={40} style={{ opacity:.3, marginBottom:12 }} />
          <p>No pending invites. Parents can invite you from their Children page.</p>
        </div>
      ) : (
        <div className="ptd-space-y-4">
          {invites.map(invite => (
            <div key={invite.id} className="ptd-card" style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div className="ptd-stat-icon pink"><Mail /></div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--ptd-text-primary)' }}>
                  {invite.guardian?.user?.full_name || invite.parent_name || 'Unknown Parent'}
                </div>
                <div style={{ fontSize:13, color:'var(--ptd-text-secondary)' }}>
                  Wants to connect child: <strong>{invite.child?.user?.full_name || invite.child_name || '—'}</strong>
                  {invite.created_at && ` · Sent ${new Date(invite.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="ptd-btn ptd-btn-primary" style={{ padding:'8px 16px', display:'flex', alignItems:'center', gap:5 }}
                  onClick={() => handleAccept(invite.id)} disabled={processing === invite.id}>
                  <Check size={15}/> {processing === invite.id ? '…' : 'Accept'}
                </button>
                <button className="ptd-btn ptd-btn-outline" style={{ padding:'8px 16px', display:'flex', alignItems:'center', gap:5 }}
                  onClick={() => handleReject(invite.id)} disabled={processing === invite.id}>
                  <X size={15}/> {processing === invite.id ? '…' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}} .ptd-spin{animation:spin 1s linear infinite;}`}</style>
    </DashboardLayout>
  );
};

export default PendingInvites;