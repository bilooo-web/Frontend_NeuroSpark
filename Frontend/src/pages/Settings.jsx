import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { User, Shield, Bell, Lock, Camera, Check, AlertTriangle, Stethoscope, Plus, X } from 'lucide-react';
import api from '../services/api';

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'success' ? '#059669' : '#ef4444',
    color: '#fff', padding: '12px 20px', borderRadius: 12,
    fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'center', gap: 8,
    animation: 'slideUp 0.3s ease',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  }}>
    {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
    {msg}
    <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>
);

// ── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <button type="button" onClick={() => onChange(!value)} style={{
    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: value ? '#059669' : '#d1d5db',
    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
  }}>
    <span style={{
      position: 'absolute', top: 2, left: value ? 22 : 2,
      width: 20, height: 20, borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }} />
  </button>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon, title, children, danger, accent }) => (
  <div style={{
    background: 'white', borderRadius: 16,
    border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : accent ? '#a7f3d0' : '#f1f5f9'}`,
    padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{
      fontFamily: "'DM Serif Display', Georgia, serif",
      fontWeight: 700, fontSize: 16,
      color: danger ? '#ef4444' : accent ? '#065f46' : '#0f172a',
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
    }}>
      {icon} {title}
    </div>
    {children}
  </div>
);

// ── Row ───────────────────────────────────────────────────────────────────────
const Row = ({ label, desc, action }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f8fafc',
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a' }}>{label}</div>
      {desc && <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{desc}</div>}
    </div>
    {action}
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const Settings = () => {
  const { user, setUser, isTherapist } = useApp();

  const fullName   = user?.full_name  || '';
  const email      = user?.guardian?.email || user?.email || '';
  const phone      = user?.guardian?.phone_number || '';
  const notifPrefs = user?.guardian?.notification_preferences || { email: true, push: true };
  const initials   = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';

  // ── Profile photo ──────────────────────────────────────────────────────────
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setProfilePhoto(dataUrl);
      localStorage.setItem('profilePhoto', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // ── Profile form ───────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ phone_number: phone });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Therapist professional profile ─────────────────────────────────────────
  const [therapistForm, setTherapistForm] = useState({
    bio:              user?.guardian?.bio              || '',
    years_experience: user?.guardian?.years_experience || '',
    sessions_count:   user?.guardian?.sessions_count   || '',
    specialties:      user?.guardian?.specialties       || [],
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [savingTherapist, setSavingTherapist] = useState(false);

  // Sync when user loads
  useEffect(() => {
    setProfileForm({ phone_number: user?.guardian?.phone_number || '' });
    setEmailNotifs(user?.guardian?.notification_preferences?.email ?? true);
    setPushNotifs(user?.guardian?.notification_preferences?.push  ?? true);
    if (isTherapist) {
      setTherapistForm({
        bio:              user?.guardian?.bio              || '',
        years_experience: user?.guardian?.years_experience || '',
        sessions_count:   user?.guardian?.sessions_count   || '',
        specialties:      user?.guardian?.specialties       || [],
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/guardian/profile', { phone_number: profileForm.phone_number });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveTherapistProfile = async () => {
    setSavingTherapist(true);
    try {
      await api.put('/guardian/profile', {
        bio:              therapistForm.bio              || null,
        years_experience: therapistForm.years_experience ? parseInt(therapistForm.years_experience) : null,
        sessions_count:   therapistForm.sessions_count   ? parseInt(therapistForm.sessions_count)   : null,
        specialties:      therapistForm.specialties,
      });
      showToast('Professional profile saved!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to save professional profile', 'error');
    } finally {
      setSavingTherapist(false);
    }
  };

  const addSpecialty = () => {
    const s = newSpecialty.trim();
    if (!s || therapistForm.specialties.includes(s)) return;
    setTherapistForm(f => ({ ...f, specialties: [...f.specialties, s] }));
    setNewSpecialty('');
  };

  const removeSpecialty = s => {
    setTherapistForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }));
  };

  // ── Password form ──────────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSavePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass) { showToast('Please fill in all password fields', 'error'); return; }
    if (passwordForm.newPass !== passwordForm.confirm)   { showToast('New passwords do not match', 'error'); return; }
    if (passwordForm.newPass.length < 8)                 { showToast('Password must be at least 8 characters', 'error'); return; }
    setSavingPassword(true);
    try {
      await api.put('/profile', {
        current_password:      passwordForm.current,
        password:              passwordForm.newPass,
        password_confirmation: passwordForm.confirm,
      });
      showToast('Password changed successfully!', 'success');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err) {
      showToast(err.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Notification preferences ───────────────────────────────────────────────
  const [emailNotifs,   setEmailNotifs]   = useState(notifPrefs.email ?? true);
  const [pushNotifs,    setPushNotifs]    = useState(notifPrefs.push  ?? true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [weeklyReport,  setWeeklyReport]  = useState(false);
  const [savingNotifs,  setSavingNotifs]  = useState(false);

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await api.put('/guardian/profile', {
        notification_preferences: JSON.stringify({ email: emailNotifs, push: pushNotifs }),
      });
      showToast('Notification preferences saved!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setSavingNotifs(false);
    }
  };

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
    background: 'white', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  const disabledInputStyle = { ...inputStyle, opacity: 0.55, cursor: 'not-allowed', background: '#f8fafc' };

  const labelStyle = {
    display: 'block', fontWeight: 700, fontSize: 12.5, color: '#374151',
    marginBottom: 6, letterSpacing: '0.02em',
  };

  const btnPrimary = {
    background: 'linear-gradient(135deg, #065f46, #059669)', color: 'white',
    border: 'none', borderRadius: 10, padding: '10px 22px',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity 0.15s',
  };

  const btnOutline = {
    background: 'white', color: '#374151',
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 16px',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  };

  const roleLabel = isTherapist ? '🩺 Therapist' : '👨‍👩‍👧 Parent';

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .st-page { padding: 28px 28px 56px; max-width: 960px; font-family: 'DM Sans', system-ui, sans-serif; }
        .st-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; }
        @media (max-width: 768px) { .st-page { padding: 18px; } .st-grid { grid-template-columns: 1fr; } }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="st-page">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, animation: 'fadeSlideUp 0.4s ease both' }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 24, color: '#0f172a', marginBottom: 5 }}>
            Settings
          </div>
          <div style={{ fontSize: 13.5, color: '#64748b' }}>
            Manage your profile, security, and preferences
          </div>
        </div>

        {/* ── Profile card ────────────────────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #f1f5f9',
          padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          animation: 'fadeSlideUp 0.4s ease 0.05s both',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
                background: profilePhoto ? 'transparent' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                border: '2px solid #a7f3d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontWeight: 700, fontSize: 24, color: '#065f46',
                overflow: 'hidden',
              }}
              title="Click to change photo"
            >
              {profilePhoto
                ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: '#059669', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}
            >
              <Camera size={12} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: 20, color: '#0f172a' }}>
              {fullName || 'User'}
            </div>
            <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 3 }}>{roleLabel}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{email}</div>
          </div>

          {profilePhoto && (
            <button
              onClick={() => { setProfilePhoto(null); localStorage.removeItem('profilePhoto'); }}
              style={{ ...btnOutline, fontSize: 12, color: '#dc2626', borderColor: '#fecaca' }}
            >
              Remove Photo
            </button>
          )}
        </div>

        <div className="st-grid">

          {/* ── Profile Information ──────────────────────────────────────── */}
          <Section icon={<User size={16} />} title="Profile Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={disabledInputStyle} value={fullName} disabled />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Managed by your account administrator</div>
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={disabledInputStyle} value={email} disabled />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={disabledInputStyle} value={user?.username || ''} disabled />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  style={inputStyle}
                  value={profileForm.phone_number}
                  onChange={e => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label style={labelStyle}>Account Type</label>
                <input style={disabledInputStyle} value={user?.guardian?.guardian_type || ''} disabled />
              </div>
              <button
                style={btnPrimary}
                onClick={handleSaveProfile}
                disabled={savingProfile}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </Section>

          {/* ── Therapist Professional Profile (therapist only) ──────────── */}
          {isTherapist && (
            <Section icon={<Stethoscope size={16} />} title="Professional Profile" accent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Years of Experience</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0" max="50"
                      value={therapistForm.years_experience}
                      onChange={e => setTherapistForm(f => ({ ...f, years_experience: e.target.value }))}
                      placeholder="e.g. 5"
                      onFocus={e => e.target.style.borderColor = '#059669'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Total Sessions</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      value={therapistForm.sessions_count}
                      onChange={e => setTherapistForm(f => ({ ...f, sessions_count: e.target.value }))}
                      placeholder="e.g. 120"
                      onFocus={e => e.target.style.borderColor = '#059669'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                    value={therapistForm.bio}
                    onChange={e => setTherapistForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Describe your expertise, approach, and what you specialise in…"
                    onFocus={e => e.target.style.borderColor = '#059669'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Specialties</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={newSpecialty}
                      onChange={e => setNewSpecialty(e.target.value)}
                      placeholder="e.g. Speech Therapy"
                      onKeyDown={e => e.key === 'Enter' && addSpecialty()}
                      onFocus={e => e.target.style.borderColor = '#059669'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button
                      onClick={addSpecialty}
                      style={{
                        ...btnPrimary, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {therapistForm.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {therapistForm.specialties.map(s => (
                        <span key={s} style={{
                          background: '#ecfdf5', color: '#065f46',
                          border: '1px solid #a7f3d0',
                          borderRadius: 99, padding: '4px 12px',
                          fontSize: 12, fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          {s}
                          <button
                            onClick={() => removeSpecialty(s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: 0, display: 'flex' }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                    These appear on your profile in the parent's therapist directory
                  </div>
                </div>

                <button
                  style={btnPrimary}
                  onClick={handleSaveTherapistProfile}
                  disabled={savingTherapist}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {savingTherapist ? 'Saving…' : 'Save Professional Profile'}
                </button>
              </div>
            </Section>
          )}

          {/* ── Security ─────────────────────────────────────────────────── */}
          <Section icon={<Shield size={16} />} title="Security">
            <Row
              label="Change Password"
              desc="Update your account password"
              action={
                <button style={btnOutline} onClick={() => setShowPasswordForm(v => !v)}>
                  {showPasswordForm ? 'Cancel' : 'Change'}
                </button>
              }
            />
            {showPasswordForm && (
              <div style={{
                background: '#f8fafc', borderRadius: 12, padding: 16,
                marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {['current', 'newPass', 'confirm'].map((field, i) => (
                  <input
                    key={field}
                    style={inputStyle}
                    type="password"
                    placeholder={['Current password', 'New password (min 8 chars)', 'Confirm new password'][i]}
                    value={passwordForm[field]}
                    onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#059669'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                ))}
                <button
                  style={{ ...btnPrimary, alignSelf: 'flex-start' }}
                  onClick={handleSavePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            )}
            <Row
              label="Account Status"
              desc={`Your account is ${user?.status || 'active'}`}
              action={
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: user?.status === 'active' ? '#d1fae5' : '#fee2e2',
                  color: user?.status === 'active' ? '#065f46' : '#991b1b',
                }}>
                  {user?.status || 'active'}
                </span>
              }
            />
            <Row
              label="Member Since"
              desc={user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—'}
              action={null}
            />
          </Section>

          {/* ── Notifications ────────────────────────────────────────────── */}
          <Section icon={<Bell size={16} />} title="Alerts & Notifications">
            <Row label="Email Notifications" desc="Receive daily summaries via email" action={<Toggle value={emailNotifs} onChange={setEmailNotifs} />} />
            <Row label="Push Notifications"  desc="Get notified about new sessions"   action={<Toggle value={pushNotifs}  onChange={setPushNotifs}  />} />
            {isTherapist && (
              <>
                <Row label="Anomaly Alerts"       desc="Instant alert for unusual session data"      action={<Toggle value={anomalyAlerts} onChange={setAnomalyAlerts} />} />
                <Row label="Weekly Progress Report" desc="Summary of all patients' progress"         action={<Toggle value={weeklyReport}  onChange={setWeeklyReport}  />} />
              </>
            )}
            <div style={{ marginTop: 14 }}>
              <button style={btnPrimary} onClick={handleSaveNotifs} disabled={savingNotifs}>
                {savingNotifs ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </Section>

          {/* ── Account Info ─────────────────────────────────────────────── */}
          <Section icon={<Lock size={16} />} title="Account Info">
            <Row label="User ID"      desc={`#${user?.id || '—'}`}                 action={null} />
            <Row label="Role"         desc={user?.role || 'guardian'}              action={null} />
            <Row label="Guardian ID"  desc={`#${user?.guardian?.id || '—'}`}       action={null} />
            <Row
              label="Last Updated"
              desc={user?.updated_at
                ? new Date(user.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—'}
              action={null}
            />
          </Section>

          {/* ── Danger Zone ──────────────────────────────────────────────── */}
          <Section icon={<Shield size={16} />} title="Danger Zone" danger>
            <Row
              label="Delete Account"
              desc="Permanently remove your data and access"
              action={
                <button
                  style={{ ...btnOutline, color: '#dc2626', borderColor: '#fecaca', fontSize: 13 }}
                  onClick={() => {
                    if (window.confirm('Are you sure? This cannot be undone.')) {
                      showToast('Please contact your administrator to delete your account', 'error');
                    }
                  }}
                >
                  Delete
                </button>
              }
            />
          </Section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;