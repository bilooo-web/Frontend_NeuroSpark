import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserPlus, CheckCircle, Star, Award,
  Users, Brain, X, RefreshCw, AlertCircle,
  ChevronRight, Filter, Lock,
} from 'lucide-react';
import guardianService from '../services/guardianService';

// ─── Specialty config ─────────────────────────────────────────────────────────
const SPECIALTY_MAP = {
  speech:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  language:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  cognitive:  { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  behavioral: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  child:      { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  autism:     { bg: '#ecfeff', color: '#0891b2', border: '#a5f3fc' },
  reading:    { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
};

const specialtyStyle = s => {
  const key = Object.keys(SPECIALTY_MAP).find(k => s?.toLowerCase().includes(k));
  return SPECIALTY_MAP[key] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
};

// ─── Star rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, count = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s} size={12}
        fill={s <= Math.round(rating) ? '#fbbf24' : 'none'}
        color={s <= Math.round(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ))}
    <span style={{ fontSize: 11.5, color: '#94a3b8', marginLeft: 4, fontWeight: 500 }}>
      {rating > 0 ? `${Number(rating).toFixed(1)} (${count})` : 'New'}
    </span>
  </div>
);

// ─── Invite modal ─────────────────────────────────────────────────────────────
/**
 * therapistStatus: { [childId]: { [therapistId]: 'active'|'pending'|null } }
 * childTherapistMap: { [childId]: therapistId|null }  — the ONE assigned therapist per child
 */
const InviteModal = ({ therapist, children, onSend, onClose, therapistStatus = {}, childTherapistMap = {} }) => {
  const [selectedChild, setSelectedChild] = useState('');
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState('');

  const name = therapist.user?.full_name || therapist.full_name || therapist.name || 'Unknown';

  // Pre-select the only eligible child automatically
  useEffect(() => {
    const eligible = children.filter(c => getChildSelectState(c) === 'eligible');
    if (eligible.length === 1) setSelectedChild(String(eligible[0].id));
  }, []); // eslint-disable-line

  /**
   * Returns the state of each child option in the dropdown:
   *   'eligible'         — can invite this therapist for this child
   *   'active'           — this therapist already connected to this child
   *   'pending'          — invite already sent to this therapist for this child
   *   'has_therapist'    — child already has a DIFFERENT active therapist
   *   'has_pending'      — child already has a DIFFERENT pending invite
   */
  const getChildSelectState = (child) => {
    const statusForThisTherapist = therapistStatus[child.id]?.[therapist.id];
    if (statusForThisTherapist === 'active')  return 'active';
    if (statusForThisTherapist === 'pending') return 'pending';

    // Check if this child already has any OTHER active therapist
    const assignedTherapistId = childTherapistMap[child.id];
    if (assignedTherapistId && assignedTherapistId !== therapist.id) return 'has_therapist';

    // Check if this child has a pending invite to a different therapist
    const statuses = therapistStatus[child.id] || {};
    const hasDifferentPending = Object.entries(statuses).some(
      ([tid, st]) => parseInt(tid) !== therapist.id && st === 'pending'
    );
    if (hasDifferentPending) return 'has_pending';

    return 'eligible';
  };

  const handleSend = async () => {
    if (!selectedChild) { setError('Please select a child first.'); return; }
    const child = children.find(c => c.id === parseInt(selectedChild));
    const state = child ? getChildSelectState(child) : null;

    if (state === 'active')        { setError('This therapist is already connected to this child.'); return; }
    if (state === 'pending')       { setError('An invite is already pending. Wait for the therapist to respond.'); return; }
    if (state === 'has_therapist') { setError('This child already has an active therapist. You must disconnect them first before inviting another.'); return; }
    if (state === 'has_pending')   { setError('This child already has a pending invite to another therapist. Wait for that to be resolved first.'); return; }

    setSending(true); setError('');
    try {
      await onSend(selectedChild, therapist.id);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || err?.message || '';
      // Surface backend-specific errors clearly
      if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('therapist')) {
        setError('This child already has an assigned therapist. Please disconnect them first.');
      } else if (msg.toLowerCase().includes('pending')) {
        setError('An invite is already pending for this child with this therapist.');
      } else {
        setError(msg || 'Failed to send invite. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const suffixLabel = {
    active:       ' ✓ Already connected',
    pending:      ' ⏳ Invite pending (this therapist)',
    has_therapist:' 🔒 Has another therapist',
    has_pending:  ' ⏳ Pending invite (another therapist)',
    eligible:     '',
  };

  const eligibleCount = children.filter(c => getChildSelectState(c) === 'eligible').length;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'fadeIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '36px',
        width: '100%', maxWidth: 460, position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        animation: 'slideUp 0.2s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, right: 18,
          background: '#f8fafc', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#64748b',
        }}>
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            border: '2px solid #a7f3d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>🩺</div>
          <h3 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px',
          }}>
            Invite Dr. {name}
          </h3>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>
            Each child can only have <strong>one active therapist</strong>. Select an eligible child below.
          </p>
        </div>

        {/* No eligible children warning */}
        {eligibleCount === 0 && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fde68a',
            borderLeft: '4px solid #f59e0b',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
          }}>
            <span style={{ flexShrink: 0, fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 3 }}>No eligible children</div>
              <div style={{ color: '#b45309' }}>
                All your children either already have a therapist or have a pending invite. Disconnect an existing therapist first to invite a new one.
              </div>
            </div>
          </div>
        )}

        {/* Child selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontWeight: 700, fontSize: 12.5, color: '#374151',
            display: 'block', marginBottom: 8, letterSpacing: '0.03em',
          }}>
            Select Child
          </label>
          <select
            value={selectedChild}
            onChange={e => { setSelectedChild(e.target.value); setError(''); }}
            disabled={eligibleCount === 0}
            style={{
              width: '100%', padding: '12px 16px',
              border: `1.5px solid ${error && !selectedChild ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 12, fontSize: 14, color: '#0f172a',
              background: eligibleCount === 0 ? '#f8fafc' : 'white',
              cursor: eligibleCount === 0 ? 'not-allowed' : 'pointer',
              outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
            onFocus={e => { if (eligibleCount > 0) e.target.style.borderColor = '#059669'; }}
            onBlur={e => e.target.style.borderColor = (error && !selectedChild) ? '#fca5a5' : '#e2e8f0'}
          >
            <option value="">— Choose a child —</option>
            {children.map(c => {
              const state = getChildSelectState(c);
              const nm    = c.name || c.user?.full_name || `Child ${c.id}`;
              return (
                <option key={c.id} value={c.id} disabled={state !== 'eligible'}>
                  {nm}{suffixLabel[state]}
                </option>
              );
            })}
          </select>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            marginBottom: 20, borderLeft: '3px solid #fca5a5',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', background: 'white',
            color: '#374151', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedChild || eligibleCount === 0}
            style={{
              flex: 2, padding: '12px', borderRadius: 12,
              background: (!selectedChild || eligibleCount === 0)
                ? '#f1f5f9'
                : 'linear-gradient(135deg, #065f46, #059669)',
              color: (!selectedChild || eligibleCount === 0) ? '#94a3b8' : 'white',
              border: 'none', fontWeight: 700, fontSize: 14,
              cursor: (!selectedChild || sending || eligibleCount === 0) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (selectedChild && !sending && eligibleCount > 0) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {sending
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
              : <><UserPlus size={15} /> Send Invite</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Therapist card ───────────────────────────────────────────────────────────
/**
 * therapistStatus:  { [childId]: { [therapistId]: 'active'|'pending'|null } }
 * childTherapistMap:{ [childId]: therapistId|null }
 */
const TherapistCard = ({ therapist, children, onInvite, therapistStatus = {}, childTherapistMap = {}, index = 0 }) => {
  const [showModal, setShowModal] = useState(false);

  const name          = therapist.user?.full_name || therapist.full_name || therapist.name || 'Unknown';
  const initials      = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const bio           = therapist.bio || therapist.description || 'Dedicated to helping children achieve their communication and learning goals.';
  const experience    = therapist.years_experience || therapist.experience_years || null;
  const rating        = parseFloat(therapist.rating || therapist.avg_rating || 0);
  const ratingCount   = therapist.rating_count || therapist.total_ratings || 0;
  const patientsCount = therapist.patients_count || therapist.total_patients || 0;
  const sessionsCount = therapist.sessions_count || therapist.total_sessions || 0;
  const specialties   = Array.isArray(therapist.specialties)
    ? therapist.specialties
    : therapist.specialty ? [therapist.specialty] : [];

  /**
   * Determine per-child status for this therapist:
   *   'active'        — connected to this therapist
   *   'pending'       — invite pending to this therapist
   *   'has_therapist' — has a different active therapist
   *   'has_pending'   — has a pending invite to a different therapist
   *   'eligible'      — free to invite
   */
  const getChildStatus = (child) => {
    const st = therapistStatus[child.id]?.[therapist.id];
    if (st === 'active')  return 'active';
    if (st === 'pending') return 'pending';
    const assignedId = childTherapistMap[child.id];
    if (assignedId && assignedId !== therapist.id) return 'has_therapist';
    const others = therapistStatus[child.id] || {};
    const diffPending = Object.entries(others).some(([tid, s]) => parseInt(tid) !== therapist.id && s === 'pending');
    if (diffPending) return 'has_pending';
    return 'eligible';
  };

  const statuses     = children.map(getChildStatus);
  const anyActive    = statuses.includes('active');
  const anyPending   = statuses.includes('pending');
  const eligibleCount = statuses.filter(s => s === 'eligible').length;
  // All children are blocked if none are eligible
  const allBlocked   = children.length > 0 && eligibleCount === 0;

  const accents = [
    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
    { bg: '#fdf4ff', border: '#d8b4fe', text: '#7c3aed' },
    { bg: '#ecfdf5', border: '#6ee7b7', text: '#065f46' },
    { bg: '#fff7ed', border: '#fdba74', text: '#c2410c' },
  ];
  const accent = accents[index % accents.length];

  // Build a contextual status message
  const buildStatusMsg = () => {
    if (anyActive && anyPending)
      return `Some children are connected, others have a pending invite with Dr. ${name}.`;
    if (anyActive) {
      const activeNames = children
        .filter(c => getChildStatus(c) === 'active')
        .map(c => c.name || c.user?.full_name || 'your child')
        .join(', ');
      return `${activeNames} ${children.filter(c => getChildStatus(c) === 'active').length === 1 ? 'is' : 'are'} already connected to Dr. ${name}.`;
    }
    if (anyPending)
      return `An invite is pending for Dr. ${name}. They'll appear in your child's profile once accepted.`;
    if (allBlocked)
      return `All children are either already assigned to another therapist or have a pending invite. Resolve those first.`;
    return null;
  };

  const statusMsg  = buildStatusMsg();
  const statusIcon = anyActive ? '✅' : allBlocked ? '🔒' : '⏳';
  const statusBg   = anyActive ? '#ecfdf5' : allBlocked ? '#f8fafc' : '#fffbeb';
  const statusBorder = anyActive ? '#a7f3d0' : allBlocked ? '#e2e8f0' : '#fde68a';
  const statusColor  = anyActive ? '#065f46' : allBlocked ? '#64748b' : '#92400e';

  // CTA button appearance
  const ctaBg    = anyActive ? 'linear-gradient(135deg, #065f46, #059669)'
                 : allBlocked || children.length === 0 ? '#f8fafc'
                 : anyPending ? '#fffbeb'
                 : 'linear-gradient(135deg, #065f46, #059669)';
  const ctaColor = anyActive ? 'white'
                 : allBlocked || children.length === 0 ? '#94a3b8'
                 : anyPending ? '#d97706'
                 : 'white';
  const ctaLabel = anyActive
    ? <><CheckCircle size={14} /> Connected</>
    : anyPending && eligibleCount === 0
    ? <>⏳ Invite Pending</>
    : allBlocked
    ? <><Lock size={14} /> All Children Assigned</>
    : <><UserPlus size={14} /> Invite as Therapist</>;

  const ctaDisabled = (allBlocked && !anyPending) || children.length === 0;

  return (
    <>
      <div style={{
        background: 'white', borderRadius: 20,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)';
        }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, ${accent.text}, ${accent.border})`, opacity: 0.7 }} />

        <div style={{ padding: '22px 22px 16px', flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
              background: accent.bg, border: `2px solid ${accent.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 700, fontSize: 18, color: accent.text,
            }}>{initials}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                <span style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontWeight: 700, fontSize: 15.5, color: '#0f172a',
                }}>Dr. {name}</span>
                {anyActive && (
                  <span style={{
                    background: '#ecfdf5', color: '#059669', fontSize: 10.5,
                    fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                    display: 'flex', alignItems: 'center', gap: 4,
                    border: '1px solid #a7f3d0',
                  }}>
                    <CheckCircle size={10} /> Connected
                  </span>
                )}
                {!anyActive && anyPending && (
                  <span style={{
                    background: '#fffbeb', color: '#d97706', fontSize: 10.5,
                    fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                    display: 'flex', alignItems: 'center', gap: 4,
                    border: '1px solid #fde68a',
                  }}>
                    ⏳ Invite Pending
                  </span>
                )}
              </div>
              <StarRating rating={rating} count={ratingCount} />
              {experience && (
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                  {experience} years of experience
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {specialties.map((s, i) => {
                const st = specialtyStyle(s);
                return (
                  <span key={i} style={{
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    letterSpacing: '0.02em',
                  }}>{s}</span>
                );
              })}
            </div>
          )}

          {/* Bio */}
          <p style={{
            fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 18,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{bio}</p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 4 }}>
            {[
              { icon: <Users size={13} />, val: patientsCount || '—', label: 'Patients' },
              { icon: <Brain size={13} />, val: sessionsCount || '—', label: 'Sessions' },
              { icon: <Award size={13} />, val: experience ? `${experience}yr` : '—', label: 'Experience' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#f8fafc', borderRadius: 10, padding: '10px 6px', textAlign: 'center',
              }}>
                <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  {stat.icon}
                </div>
                <div style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontWeight: 700, fontSize: 16, color: '#0f172a', lineHeight: 1,
                }}>{stat.val}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div style={{
            padding: '10px 16px',
            background: statusBg,
            borderTop: `1px solid ${statusBorder}`,
            fontSize: 12, fontWeight: 500,
            color: statusColor,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ flexShrink: 0, fontSize: 14 }}>{statusIcon}</span>
            <span>{statusMsg}</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => !ctaDisabled && setShowModal(true)}
          disabled={ctaDisabled}
          style={{
            width: '100%', padding: '13px 20px',
            background: ctaBg,
            color: ctaColor,
            border: 'none',
            borderTop: statusMsg ? 'none' : '1px solid #f1f5f9',
            cursor: ctaDisabled ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            transition: 'opacity 0.15s', letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!ctaDisabled) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {ctaLabel}
        </button>
      </div>

      {showModal && (
        <InviteModal
          therapist={therapist}
          children={children}
          onSend={onInvite}
          onClose={() => setShowModal(false)}
          therapistStatus={therapistStatus}
          childTherapistMap={childTherapistMap}
        />
      )}
    </>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{ height: 4, background: '#f1f5f9' }} />
    <div style={{ padding: 22 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, width: '60%', marginBottom: 8 }} />
          <div style={{ height: 11, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {[60, 80, 70].map((w, i) => <div key={i} style={{ height: 22, background: '#f1f5f9', borderRadius: 99, width: w }} />)}
      </div>
      <div style={{ height: 52, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 60, background: '#f8fafc', borderRadius: 10 }} />)}
      </div>
      <div style={{ height: 44, background: '#f1f5f9', borderRadius: 12 }} />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const TherapistDirectory = () => {
  const { isParent } = useApp();
  const navigate = useNavigate();

  const [therapists,        setTherapists]        = useState([]);
  const [children,          setChildren]          = useState([]);
  // therapistStatus[childId][therapistId] = 'active'|'pending'|null
  const [therapistStatus,   setTherapistStatus]   = useState({});
  // childTherapistMap[childId] = therapistId of the ONE assigned therapist (or null)
  const [childTherapistMap, setChildTherapistMap] = useState({});
  // 'idle' | 'loading' | 'error' | 'done'
  const [loadState,         setLoadState]         = useState('idle');
  const [errorMsg,          setErrorMsg]          = useState('');
  const [search,            setSearch]            = useState('');
  const [successMsg,        setSuccessMsg]        = useState('');
  const [activeFilter,      setActiveFilter]      = useState('all');

  useEffect(() => {
    if (!isParent) { navigate('/guardian/dashboard'); return; }
    loadData();
  }, [isParent]); // eslint-disable-line

  const loadData = async () => {
    setLoadState('loading'); setErrorMsg('');
    try {
      // Run the two required calls together; status call is optional and must never crash the page
      const [therapistsData, childrenRes] = await Promise.all([
        guardianService.getTherapists(),
        guardianService.getChildren(),
      ]);

      const therapistList = Array.isArray(therapistsData)
        ? therapistsData
        : therapistsData.therapists || therapistsData.data || [];

      const childList =
        childrenRes.children ||
        childrenRes.data?.children ||
        (Array.isArray(childrenRes) ? childrenRes : []);

      setTherapists(therapistList);
      setChildren(childList);

      // --- Build status maps ---
      // Option A: backend has a dedicated statuses endpoint
      let statusResolved = false;
      if (typeof guardianService.getTherapistStatuses === 'function') {
        try {
          const statusRes = await guardianService.getTherapistStatuses();
          if (statusRes) {
            const rawStatus      = statusRes.therapist_status || statusRes.statuses || statusRes || {};
            const rawAssignments = statusRes.child_therapist_map || statusRes.assignments || {};
            // Only use if they look like real objects (not empty arrays etc.)
            if (typeof rawStatus === 'object' && !Array.isArray(rawStatus)) {
              setTherapistStatus(rawStatus);
              setChildTherapistMap(rawAssignments);
              statusResolved = true;
            }
          }
        } catch (_) {
          // silently fall through to Option B
        }
      }

      // Option B: derive from child objects (child.therapist_id / child.therapist?.id)
      if (!statusResolved) {
        const assignmentMap = {};
        const statusMap     = {};
        childList.forEach(child => {
          const assignedId = child.therapist_id || child.therapist?.id || null;
          assignmentMap[child.id] = assignedId || null;
          if (assignedId) {
            statusMap[child.id] = statusMap[child.id] || {};
            statusMap[child.id][assignedId] = 'active';
          }
        });
        setChildTherapistMap(assignmentMap);
        setTherapistStatus(statusMap);
      }

      setLoadState('done');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      setErrorMsg(msg || 'Failed to load therapists. Please check your connection and try again.');
      setLoadState('error');
    }
  };

  const handleInvite = async (childId, therapistId) => {
    // Optimistic update: mark as pending immediately to prevent duplicate clicks
    setTherapistStatus(prev => ({
      ...prev,
      [childId]: { ...(prev[childId] || {}), [therapistId]: 'pending' },
    }));

    try {
      const res = await guardianService.inviteTherapist(childId, therapistId);
      const therapist = therapists.find(t => t.id === therapistId);
      const child     = children.find(c => c.id === parseInt(childId));
      const tName     = therapist?.user?.full_name || therapist?.name || 'the therapist';
      const cName     = child?.name || child?.user?.full_name || 'your child';

      if (res?.already_linked) {
        setTherapistStatus(prev => ({
          ...prev,
          [childId]: { ...(prev[childId] || {}), [therapistId]: 'active' },
        }));
        setChildTherapistMap(prev => ({ ...prev, [childId]: therapistId }));
        setSuccessMsg(`Dr. ${tName} is already connected to ${cName}.`);
      } else {
        setSuccessMsg(`Invite sent to Dr. ${tName} for ${cName}. They'll review it shortly.`);
      }
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      // Rollback optimistic update on failure
      setTherapistStatus(prev => {
        const next = { ...prev };
        if (next[childId]) delete next[childId][therapistId];
        return next;
      });
      throw err; // Re-throw so InviteModal can display the error
    }
  };

  // Collect all unique specialties for filter pills
  const allSpecialties = [...new Set(
    therapists.flatMap(t =>
      Array.isArray(t.specialties) ? t.specialties : t.specialty ? [t.specialty] : []
    )
  )].slice(0, 6);

  const filtered = therapists.filter(t => {
    const q     = search.toLowerCase().trim();
    const name  = (t.user?.full_name || t.full_name || t.name || '').toLowerCase();
    const bio   = (t.bio || t.description || '').toLowerCase();
    const specs = (Array.isArray(t.specialties) ? t.specialties.join(' ') : t.specialty || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || bio.includes(q) || specs.includes(q);
    const matchesFilter = activeFilter === 'all' || specs.includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  // Count children that are fully free (no therapist at all) for a banner warning
  const freeChildren = children.filter(c => !childTherapistMap[c.id]);

  if (!isParent) return null;

  const isLoading = loadState === 'idle' || loadState === 'loading';
  const isError   = loadState === 'error';
  const isDone    = loadState === 'done';

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .td-page { padding: 28px 28px 56px; max-width: 1280px; font-family: 'DM Sans', system-ui, sans-serif; }
        @media (max-width: 768px) { .td-page { padding: 18px; } }
      `}</style>

      <div className="td-page">

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
          borderRadius: 22, padding: '28px 36px', marginBottom: 28, color: 'white',
          boxShadow: '0 8px 32px rgba(15,23,42,0.18)',
          display: 'flex', alignItems: 'center', gap: 20,
          flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
          animation: 'fadeSlideUp 0.5s ease both',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 100, bottom: -50, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          <div style={{
            width: 60, height: 60, borderRadius: 18, flexShrink: 0,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🩺</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Therapist Directory
            </div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
              Find the Right Specialist
            </div>
            <div style={{ fontSize: 13.5, opacity: 0.7, lineHeight: 1.6 }}>
              Browse verified speech and language therapists. Each child can have <strong>one active therapist</strong> at a time.
            </div>
          </div>

          {isDone && children.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 14,
              padding: '14px 20px', flexShrink: 0, textAlign: 'center',
            }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 700 }}>
                {freeChildren.length}/{children.length}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: '0.05em' }}>
                CHILDREN NEED THERAPIST
              </div>
            </div>
          )}
        </div>

        {/* ── Success toast ────────────────────────────────────────────────── */}
        {successMsg && (
          <div style={{
            background: '#ecfdf5', color: '#065f46',
            border: '1px solid #a7f3d0', borderLeft: '4px solid #059669',
            borderRadius: 14, padding: '14px 20px', marginBottom: 24,
            fontWeight: 600, fontSize: 13.5,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeSlideUp 0.3s ease',
          }}>
            <CheckCircle size={18} color="#059669" />
            <span style={{ flex: 1 }}>🎉 {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', padding: 2,
            }}><X size={15} /></button>
          </div>
        )}

        {/* ── Error — only when load failed entirely ───────────────────────── */}
        {isError && (
          <div style={{
            background: '#fef2f2', color: '#991b1b',
            border: '1px solid #fecaca', borderLeft: '4px solid #dc2626',
            borderRadius: 14, padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ flex: 1, fontSize: 13.5 }}>{errorMsg}</span>
            <button onClick={loadData} style={{
              background: '#dc2626', color: 'white', border: 'none',
              borderRadius: 8, padding: '7px 14px', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* ── Everything below only renders once data is loaded ────────────── */}
        {isDone && (
          <>
            {/* ── No children linked warning ─────────────────────────────── */}
            {children.length === 0 && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 14, padding: '16px 20px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#92400e', marginBottom: 3 }}>
                    No children linked yet
                  </div>
                  <div style={{ fontSize: 12.5, color: '#b45309' }}>
                    You'll need to link a child to your account before you can invite a therapist.
                  </div>
                </div>
                <button onClick={() => navigate('/guardian/children')} style={{
                  background: '#f59e0b', color: 'white', border: 'none',
                  borderRadius: 10, padding: '8px 16px', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  Link a Child <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* ── All children already have therapists ───────────────────── */}
            {children.length > 0 && freeChildren.length === 0 && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #a7f3d0',
                borderLeft: '4px solid #059669',
                borderRadius: 14, padding: '16px 20px', marginBottom: 24,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#065f46', marginBottom: 3 }}>
                    All children have an assigned therapist
                  </div>
                  <div style={{ fontSize: 12.5, color: '#047857' }}>
                    You can browse below, but inviting requires disconnecting your child's current therapist first.
                  </div>
                </div>
              </div>
            )}

            {/* ── Search + specialty filter ───────────────────────────────── */}
            <div style={{ marginBottom: 20, animation: 'fadeSlideUp 0.5s ease 0.1s both' }}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
                }} />
                <input
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, specialty, or keyword…"
                  style={{
                    width: '100%', padding: '13px 44px 13px 44px',
                    border: '1.5px solid #e2e8f0', borderRadius: 14,
                    fontSize: 14, color: '#0f172a', background: 'white',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                    width: 26, height: 26, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
                  }}><X size={13} /></button>
                )}
              </div>

              {allSpecialties.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Filter size={12} /> Filter:
                  </span>
                  {['all', ...allSpecialties].map(sp => (
                    <button key={sp} onClick={() => setActiveFilter(sp)} style={{
                      padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      border: '1.5px solid',
                      borderColor: activeFilter === sp ? '#059669' : '#e2e8f0',
                      background: activeFilter === sp ? '#059669' : 'white',
                      color: activeFilter === sp ? 'white' : '#64748b',
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}>
                      {sp === 'all' ? 'All' : sp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Result count + refresh ──────────────────────────────────── */}
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                {filtered.length === 0
                  ? 'No results found'
                  : `${filtered.length} therapist${filtered.length !== 1 ? 's' : ''} available`}
              </span>
              <button onClick={loadData} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
              }}>
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>

            {/* ── Therapist grid ──────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div style={{
                background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
                padding: '64px 24px', textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>{search ? '🔍' : '🩺'}</div>
                <div style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontWeight: 700, fontSize: 20, color: '#0f172a', marginBottom: 10,
                }}>
                  {search ? `No results for "${search}"` : 'No therapists available right now'}
                </div>
                <p style={{ color: '#64748b', maxWidth: 360, margin: '0 auto 20px', fontSize: 14, lineHeight: 1.6 }}>
                  {search
                    ? 'Try a different name or specialty keyword.'
                    : 'Check back soon — new specialists are joining regularly.'}
                </p>
                {(search || activeFilter !== 'all') && (
                  <button onClick={() => { setSearch(''); setActiveFilter('all'); }} style={{
                    background: '#059669', color: 'white', border: 'none',
                    borderRadius: 12, padding: '10px 22px', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
                gap: 20,
                animation: 'fadeSlideUp 0.5s ease 0.15s both',
              }}>
                {filtered.map((therapist, i) => (
                  <TherapistCard
                    key={therapist.id}
                    therapist={therapist}
                    children={children}
                    onInvite={handleInvite}
                    therapistStatus={therapistStatus}
                    childTherapistMap={childTherapistMap}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default TherapistDirectory;