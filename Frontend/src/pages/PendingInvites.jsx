import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Check, X, RefreshCw, Clock, AlertTriangle, Info } from 'lucide-react';
import guardianService from '../services/guardianService';

const PendingInvites = () => {
  const { isTherapist } = useApp();
  const navigate   = useNavigate();
  const [invites,    setInvites]    = useState([]);
  const [hydrating,  setHydrating]  = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  // confirmReplace: invite that needs a confirmation dialog (child already has a therapist)
  const [confirmReplace, setConfirmReplace] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!isTherapist) { navigate('/guardian/dashboard'); return; }
    loadInvites();
    return () => { mounted.current = false; };
  }, [isTherapist]); // eslint-disable-line

  const loadInvites = async () => {
    setError('');
    try {
      const response = await guardianService.getPendingInvites();
      if (!mounted.current) return;
      const raw = response.pending_invites || response.data || [];
      setInvites(deduplicateInvites(raw));
    } catch (err) {
      if (mounted.current) setError('Failed to load invites. Please retry.');
    } finally {
      if (mounted.current) setHydrating(false);
    }
  };

  /**
   * Guards against the same (child, therapist) pair appearing twice
   * due to a race condition or backend inconsistency.
   */
  const deduplicateInvites = (raw) => {
    const seen = new Set();
    return raw.filter(invite => {
      const key = `${invite.child_id ?? invite.child?.id}-${invite.therapist_id ?? invite.therapist?.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  /**
   * Whether this invite's child already has an active therapist assigned
   * (a different one — not "me" because if it were me, it'd be active, not pending).
   * Backend should expose `child.current_therapist_id` or similar.
   */
  const childHasExistingTherapist = (invite) => {
    const currentTherapistId = invite.child?.current_therapist_id
      ?? invite.child?.therapist_id
      ?? null;
    return Boolean(currentTherapistId);
  };

  const handleAcceptClick = (invite) => {
    const childName = invite.child?.user?.full_name || invite.child_name || 'the child';

    // If the child already has an active therapist, show a confirmation dialog first
    if (childHasExistingTherapist(invite)) {
      const currentTherapistName =
        invite.child?.current_therapist?.user?.full_name ||
        invite.child?.current_therapist_name ||
        'another therapist';
      setConfirmReplace({ invite, childName, currentTherapistName });
      return;
    }

    // Normal path — no conflict
    doAccept(invite.id, childName);
  };

  const doAccept = async (inviteId, childName) => {
    setProcessing(inviteId); setError(''); setSuccessMsg('');
    setConfirmReplace(null);

  
    setInvites(prev => prev.filter(i => i.id !== inviteId));

    try {
      await guardianService.acceptInvite(inviteId);
      if (mounted.current) {
        setSuccessMsg(`You are now connected to ${childName || 'the child'}. They will appear in your patients list.`);
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      if (!mounted.current) return;

      const msg = err?.response?.data?.message || err?.data?.message || err?.message || '';

      // Handle specific rejection reasons from the backend
      if (msg.toLowerCase().includes('already has') && msg.toLowerCase().includes('therapist')) {
        setError(`This child already has an active therapist. The invite may be stale — refreshing the list.`);
      } else if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('not found')) {
        setError(`This invite has expired or was already handled. The list has been refreshed.`);
      } else if (msg.toLowerCase().includes('already accepted')) {
        setSuccessMsg(`You are already connected to ${childName}. No action needed.`);
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setError('Failed to accept invite. Please try again.');
      }

      // Always re-fetch to sync real state
      loadInvites();
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  const handleReject = async (inviteId) => {
    setProcessing(inviteId); setError('');

    // Optimistic removal
    setInvites(prev => prev.filter(i => i.id !== inviteId));

    try {
      await guardianService.rejectInvite(inviteId);
      // Success: invite removed — no extra message needed since we already removed it visually
    } catch (err) {
      if (!mounted.current) return;

      const msg = err?.response?.data?.message || err?.data?.message || err?.message || '';

      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('expired')) {
        // Invite was already resolved — silently ignore (already removed optimistically)
      } else {
        setError('Failed to decline invite. Please try again.');
        loadInvites(); // Re-sync
      }
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  if (!isTherapist) return null;

  const fmtDate = d => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return '—'; }
  };

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .pi-page { padding: 28px 28px 56px; max-width: 860px; font-family: 'DM Sans', system-ui, sans-serif; }
        @media (max-width: 768px) { .pi-page { padding: 18px; } }
      `}</style>

      {/* ── Replace confirmation modal ──────────────────────────────────────── */}
      {confirmReplace && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: '36px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', margin: '0 auto 16px',
                background: '#fff7ed', border: '2px solid #fed7aa',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              }}>⚠️</div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 20, color: '#0f172a', marginBottom: 10 }}>
                Replace Existing Therapist?
              </div>
              <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>
                <strong>{confirmReplace.childName}</strong> is currently connected to{' '}
                <strong>{confirmReplace.currentTherapistName}</strong>. Accepting this invite will
                replace their existing therapist. This action cannot be undone from this screen.
              </p>
            </div>

            <div style={{
              background: '#fef3c7', borderRadius: 12, padding: '12px 16px',
              marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10,
              border: '1px solid #fde68a',
            }}>
              <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: '#92400e', lineHeight: 1.6 }}>
                The previous therapist will immediately lose access to this child's progress data.
                Make sure this is intentional before proceeding.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmReplace(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#374151', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => doAccept(confirmReplace.invite.id, confirmReplace.childName)}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #92400e, #d97706)',
                  color: 'white', border: 'none',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Check size={14} /> Yes, Accept & Replace
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pi-page">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
          animation: 'fadeSlideUp 0.4s ease both',
        }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 24, color: '#0f172a', marginBottom: 5 }}>
              Pending Invites
            </div>
            <div style={{ fontSize: 13.5, color: '#64748b' }}>
              Invitations from parents to connect with their children
            </div>
          </div>
          <button
            onClick={loadInvites}
            disabled={hydrating}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'white', border: '1.5px solid #e2e8f0',
              borderRadius: 12, padding: '9px 16px',
              fontSize: 13, fontWeight: 600, color: '#475569',
              cursor: hydrating ? 'default' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => !hydrating && (e.currentTarget.style.borderColor = '#059669')}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <RefreshCw size={14} style={{ animation: hydrating ? 'spin 1s linear infinite' : 'none' }} />
            {hydrating ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* ── Info banner ─────────────────────────────────────────────────── */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderLeft: '4px solid #3b82f6',
          borderRadius: 14, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#1e40af',
        }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Each child can only have <strong>one active therapist</strong>. If a child already has a therapist
            and you accept their invite, their previous therapist will be disconnected.
            Invites for children already connected to you are not shown.
          </span>
        </div>

        {/* ── Success ───────────────────────────────────────────────────────── */}
        {successMsg && (
          <div style={{
            background: '#ecfdf5', color: '#065f46',
            border: '1px solid #a7f3d0', borderLeft: '4px solid #059669',
            borderRadius: 14, padding: '14px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 500,
            animation: 'fadeSlideUp 0.3s ease',
          }}>
            <Check size={16} color="#059669" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: '#fef2f2', color: '#991b1b',
            border: '1px solid #fecaca', borderLeft: '4px solid #dc2626',
            borderRadius: 14, padding: '12px 18px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 13.5,
          }}>
            <span>⚠️ {error}</span>
            <button onClick={loadInvites} style={{
              background: 'none', border: 'none', color: '#dc2626',
              fontWeight: 700, cursor: 'pointer', fontSize: 13,
              textDecoration: 'underline', fontFamily: 'inherit',
            }}>Retry</button>
          </div>
        )}

        {/* ── Skeleton ─────────────────────────────────────────────────────── */}
        {hydrating && invites.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, background: '#f1f5f9', borderRadius: 6, width: '38%', marginBottom: 9 }} />
                  <div style={{ height: 11, background: '#f1f5f9', borderRadius: 6, width: '60%' }} />
                </div>
                <div style={{ width: 170, height: 36, background: '#f1f5f9', borderRadius: 10 }} />
              </div>
            ))}
          </div>

        ) : invites.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <div style={{
            background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
            padding: '64px 24px', textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            animation: 'fadeSlideUp 0.4s ease 0.1s both',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={28} color="#cbd5e1" />
            </div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 20, color: '#0f172a', marginBottom: 8 }}>
              No pending invites
            </div>
            <p style={{ color: '#64748b', fontSize: 13.5, maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
              When a parent invites you to support their child, it will appear here for you to review.
            </p>
          </div>

        ) : (
          /* ── Invite list ──────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeSlideUp 0.4s ease 0.1s both' }}>
            {invites.map(invite => {
              const childName  = invite.child?.user?.full_name || invite.child_name || 'Unknown Child';
              const parentName = invite.guardian?.user?.full_name || invite.parent_name || 'Unknown Parent';
              const isProcessing    = processing === invite.id;
              const hasOtherTherapist = childHasExistingTherapist(invite);
              const currentTherapistName =
                invite.child?.current_therapist?.user?.full_name ||
                invite.child?.current_therapist_name ||
                null;

              return (
                <div key={invite.id} style={{
                  background: 'white', borderRadius: 16,
                  border: `1px solid ${hasOtherTherapist ? '#fde68a' : '#f1f5f9'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                >
                  {/* Top accent for "child already has therapist" */}
                  {hasOtherTherapist && (
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: hasOtherTherapist
                        ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
                        : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      border: `2px solid ${hasOtherTherapist ? '#fde68a' : '#bfdbfe'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Mail size={18} color={hasOtherTherapist ? '#d97706' : '#3b82f6'} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3 }}>
                        {parentName}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>Child:</span>
                        <span style={{
                          background: '#f0fdf4', color: '#059669',
                          border: '1px solid #a7f3d0',
                          borderRadius: 99, padding: '1px 9px',
                          fontSize: 12, fontWeight: 700,
                        }}>{childName}</span>
                        {invite.created_at && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8', fontSize: 11.5 }}>
                            <Clock size={11} /> {fmtDate(invite.created_at)}
                          </span>
                        )}
                      </div>

                      {/* Warning: child already has a therapist */}
                      {hasOtherTherapist && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          marginTop: 6, fontSize: 12, color: '#92400e',
                          background: '#fef3c7', borderRadius: 8,
                          padding: '4px 10px', width: 'fit-content',
                        }}>
                          <AlertTriangle size={12} />
                          Already assigned to {currentTherapistName ? <strong style={{ marginLeft: 3 }}>{currentTherapistName}</strong> : 'another therapist'} — accepting will replace them
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleAcceptClick(invite)}
                        disabled={isProcessing}
                        style={{
                          padding: '9px 18px', borderRadius: 10, border: 'none',
                          background: isProcessing
                            ? '#f1f5f9'
                            : hasOtherTherapist
                            ? 'linear-gradient(135deg, #92400e, #d97706)'
                            : 'linear-gradient(135deg, #065f46, #059669)',
                          color: isProcessing ? '#94a3b8' : 'white',
                          fontWeight: 700, fontSize: 13, cursor: isProcessing ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: 'inherit', transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => !isProcessing && (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <Check size={14} />
                        {isProcessing ? '…' : hasOtherTherapist ? 'Accept (Replace)' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(invite.id)}
                        disabled={isProcessing}
                        style={{
                          padding: '9px 16px', borderRadius: 10,
                          border: '1.5px solid #e2e8f0', background: 'white',
                          color: '#64748b', fontWeight: 700, fontSize: 13,
                          cursor: isProcessing ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => !isProcessing && (e.currentTarget.style.borderColor = '#fca5a5', e.currentTarget.style.color = '#dc2626')}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                      >
                        <X size={14} />
                        {isProcessing ? '…' : 'Decline'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PendingInvites;