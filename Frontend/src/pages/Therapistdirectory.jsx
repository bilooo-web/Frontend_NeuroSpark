import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, CheckCircle, Star, Award, Users, Mic, Brain } from 'lucide-react';
import guardianService from '../services/guardianService';

// ─── Therapist specialty badge colors ────────────────────────────────────────
const specialtyColor = (s) => {
  const map = {
    'speech': { bg: '#eff6ff', color: '#2563eb' },
    'language': { bg: '#f0fdf4', color: '#16a34a' },
    'cognitive': { bg: '#faf5ff', color: '#7c3aed' },
    'behavioral': { bg: '#fff7ed', color: '#ea580c' },
    'child': { bg: '#fdf2f8', color: '#be185d' },
  };
  const key = Object.keys(map).find(k => s?.toLowerCase().includes(k));
  return map[key] || { bg: '#f3f4f6', color: '#374151' };
};

// ─── Star Rating Display ──────────────────────────────────────────────────────
const StarRating = ({ rating = 0, count = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={13}
        fill={s <= Math.round(rating) ? '#fbbf24' : 'none'}
        color={s <= Math.round(rating) ? '#fbbf24' : '#d1d5db'}
      />
    ))}
    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>
      {rating > 0 ? `${rating.toFixed(1)} (${count})` : 'New therapist'}
    </span>
  </div>
);

// ─── Therapist Card ───────────────────────────────────────────────────────────
const TherapistCard = ({ therapist, children, onInvite, invitedFor }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const name = therapist.user?.full_name || therapist.full_name || therapist.name || 'Unknown';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const specialties = therapist.specialties || therapist.specialty
    ? (Array.isArray(therapist.specialties) ? therapist.specialties : [therapist.specialty || therapist.specialties]).filter(Boolean)
    : [];
  const bio = therapist.bio || therapist.description || 'Dedicated to helping children achieve their communication goals.';
  const experience = therapist.years_experience || therapist.experience_years || null;
  const rating = therapist.rating || therapist.avg_rating || 0;
  const ratingCount = therapist.rating_count || therapist.total_ratings || 0;
  const patientsCount = therapist.patients_count || therapist.total_patients || 0;
  const sessionsCount = therapist.sessions_count || therapist.total_sessions || 0;

  const handleSendInvite = async () => {
    if (!selectedChild) { setError('Please select a child'); return; }
    setSending(true);
    setError('');
    try {
      await onInvite(selectedChild, therapist.id);
      setShowInviteModal(false);
      setSelectedChild('');
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const alreadyInvited = invitedFor?.includes(therapist.id);

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0f3d3a, #22c55e)' }} />

        {/* Header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14, paddingTop: 4 }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #0f3d3a22, #22c55e33)',
            border: '2px solid #0f3d3a22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, color: '#0f3d3a',
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>Dr. {name}</div>
              {alreadyInvited && (
                <span style={{
                  background: '#f0fdf4', color: '#16a34a', fontSize: 11,
                  fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle size={11} /> Invited
                </span>
              )}
            </div>
            <StarRating rating={rating} count={ratingCount} />
            {experience && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {experience} years of experience
              </div>
            )}
          </div>
        </div>

        {/* Specialties */}
        {specialties.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {specialties.map((s, i) => {
              const sc = specialtyColor(s);
              return (
                <span key={i} style={{
                  background: sc.bg, color: sc.color,
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 99,
                }}>{s}</span>
              );
            })}
          </div>
        )}

        {/* Bio */}
        <p style={{
          fontSize: 13, color: '#6b7280', lineHeight: 1.6,
          marginBottom: 16, display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{bio}</p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16,
        }}>
          {[
            { icon: <Users size={14} />, val: patientsCount, label: 'Patients' },
            { icon: <Brain size={14} />, val: sessionsCount, label: 'Sessions' },
            { icon: <Award size={14} />, val: experience ? `${experience}yr` : '—', label: 'Experience' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#f9fafb', borderRadius: 10, padding: '8px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#0f3d3a', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>{stat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{stat.val || '—'}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action */}
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={alreadyInvited}
          style={{
            background: alreadyInvited ? '#f3f4f6' : 'linear-gradient(135deg, #0f3d3a, #1a5c57)',
            color: alreadyInvited ? '#9ca3af' : 'white',
            border: 'none', borderRadius: 12, padding: '12px',
            fontWeight: 700, fontSize: 14, cursor: alreadyInvited ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
            width: '100%',
          }}
          onMouseEnter={e => { if (!alreadyInvited) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {alreadyInvited
            ? <><CheckCircle size={16} /> Invite Sent</>
            : <><UserPlus size={16} /> Invite as Therapist</>}
        </button>
      </div>

      {/* ── Invite Modal ────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setShowInviteModal(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>🩺</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: '#111827', textAlign: 'center', margin: '0 0 4px' }}>
              Invite Dr. {name}
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', margin: '0 0 24px' }}>
              Select which child you'd like them to work with. They'll receive a notification to accept.
            </p>

            <label style={{ fontWeight: 700, fontSize: 13, color: '#374151', display: 'block', marginBottom: 8 }}>
              Select Child
            </label>
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827',
                background: 'white', marginBottom: 16, cursor: 'pointer',
                outline: 'none', fontFamily: 'inherit',
              }}
            >
              <option value="">— Choose a child —</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name || c.user?.full_name || `Child ${c.id}`}
                </option>
              ))}
            </select>

            {error && (
              <div style={{
                background: '#fef2f2', color: '#dc2626',
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
                marginBottom: 16, borderLeft: '3px solid #dc2626',
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1.5px solid #e5e7eb', background: 'white',
                  color: '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sending || !selectedChild}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10,
                  background: !selectedChild ? '#f3f4f6' : 'linear-gradient(135deg, #0f3d3a, #1a5c57)',
                  color: !selectedChild ? '#9ca3af' : 'white',
                  border: 'none', fontWeight: 700, fontSize: 14,
                  cursor: !selectedChild ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {sending ? 'Sending...' : <><UserPlus size={16} /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TherapistDirectory = () => {
  const { isParent } = useApp();
  const navigate = useNavigate();

  const [therapists, setTherapists] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [invitedFor, setInvitedFor] = useState([]); // therapist IDs already invited
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isParent) {
      navigate('/guardian/dashboard');
      return;
    }
    loadData();
  }, [isParent]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
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
    } catch (err) {
      setError('Failed to load therapists. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (childId, therapistId) => {
    await guardianService.inviteTherapist(childId, therapistId);
    setInvitedFor(prev => [...prev, therapistId]);
    const therapist = therapists.find(t => t.id === therapistId);
    const child = children.find(c => c.id === parseInt(childId));
    const tName = therapist?.user?.full_name || therapist?.name || 'the therapist';
    const cName = child?.name || child?.user?.full_name || 'your child';
    setSuccessMsg(`✅ Invite sent to Dr. ${tName} for ${cName}! They'll review it shortly.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const filtered = therapists.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (t.user?.full_name || t.full_name || t.name || '').toLowerCase();
    const bio = (t.bio || t.description || '').toLowerCase();
    const specs = (Array.isArray(t.specialties) ? t.specialties.join(' ') : t.specialty || '').toLowerCase();
    return name.includes(q) || bio.includes(q) || specs.includes(q);
  });

  if (!isParent) return null;

  return (
    <DashboardLayout>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="ptd-page-header">
        <div>
          <div className="ptd-page-title">Find a Therapist</div>
          <div className="ptd-page-subtitle">
            Browse verified specialists and invite them to support your child's journey
          </div>
        </div>
      </div>

      {/* ── Success message ──────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{
          background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🎉</span> {successMsg}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="ptd-error-message" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={loadData} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 13 }}>
            Retry
          </button>
        </div>
      )}

      {/* ── No children warning ──────────────────────────────────────────── */}
      {!loading && children.length === 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          fontSize: 13, color: '#92400e', fontWeight: 600,
        }}>
          ⚠️ You need to link a child first before sending an invite.{' '}
          <button
            onClick={() => navigate('/guardian/children')}
            style={{ color: '#d97706', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
          >
            Link a child →
          </button>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', marginBottom: 24, maxWidth: 480,
      }}>
        <Search size={16} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: '#9ca3af',
        }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, specialty, or keyword..."
          style={{
            width: '100%', padding: '12px 14px 12px 40px',
            border: '1.5px solid #e5e7eb', borderRadius: 12,
            fontSize: 14, color: '#111827', background: 'white',
            outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#0f3d3a'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
        />
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div className="ptd-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ptd-card ptd-empty-state">
          {search ? `No therapists found matching "${search}"` : 'No therapists available at the moment.'}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
            {filtered.length} therapist{filtered.length !== 1 ? 's' : ''} available
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {filtered.map(therapist => (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                children={children}
                onInvite={handleInvite}
                invitedFor={invitedFor}
              />
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default TherapistDirectory;