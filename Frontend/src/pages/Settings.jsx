import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { User, Shield, Bell, Palette, Lock, Camera, Check, AlertTriangle } from 'lucide-react';
import api from '../services/api';

// ── small helpers ────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'success' ? '#10b981' : '#ef4444',
    color: '#fff', padding: '12px 20px', borderRadius: 12,
    fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'center', gap: 8,
    animation: 'slideUp 0.3s ease',
  }}>
    {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
    {msg}
    <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: value ? '#7c3aed' : '#d1d5db',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: value ? 22 : 2,
      width: 20, height: 20, borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    }} />
  </button>
);

// ── component ────────────────────────────────────────────────────────────────
const Settings = () => {
  const { user, setUser } = useApp();

  // ── real user fields from your backend ──
  // user = { id, full_name, username, status, role, guardian: { id, email, guardian_type, phone_number, notification_preferences } }
  const fullName    = user?.full_name  || '';
  const email       = user?.guardian?.email || '';
  const phone       = user?.guardian?.phone_number || '';
  const notifPrefs  = user?.guardian?.notification_preferences || { email: true, push: true };
  const initials    = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TH';

  // ── profile photo ──
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePhoto(dataUrl);
      localStorage.setItem('profilePhoto', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // ── profile form ──
  const [profileForm, setProfileForm] = useState({
    phone_number: phone,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // sync if user loads late
  useEffect(() => {
    setProfileForm({ phone_number: user?.guardian?.phone_number || '' });
    setEmailNotifs(user?.guardian?.notification_preferences?.email ?? true);
    setPushNotifs(user?.guardian?.notification_preferences?.push ?? true);
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/guardian/profile', {
        phone_number: profileForm.phone_number,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── password form ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSavePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass) {
      showToast('Please fill in all password fields', 'error'); return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      showToast('New passwords do not match', 'error'); return;
    }
    if (passwordForm.newPass.length < 8) {
      showToast('Password must be at least 8 characters', 'error'); return;
    }
    setSavingPassword(true);
    try {
      await api.put('/profile', {
        current_password: passwordForm.current,
        password: passwordForm.newPass,
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

  // ── notification preferences ──
  const [emailNotifs, setEmailNotifs]   = useState(notifPrefs.email ?? true);
  const [pushNotifs, setPushNotifs]     = useState(notifPrefs.push  ?? true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport]   = useState(false);
  const [savingNotifs, setSavingNotifs]   = useState(false);

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await api.put('/guardian/profile', {
        notification_preferences: JSON.stringify({
          email: emailNotifs,
          push:  pushNotifs,
        }),
      });
      showToast('Notification preferences saved!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setSavingNotifs(false);
    }
  };

  // ── toast ──
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── section helper ──
  const Section = ({ icon, title, children, danger }) => (
    <div className="nt-settings-section" style={danger ? { borderColor: 'rgba(239,68,68,0.2)' } : {}}>
      <div className="nt-settings-section-title" style={danger ? { color: '#ef4444' } : {}}>
        {icon} {title}
      </div>
      {children}
    </div>
  );

  const Row = ({ label, desc, action }) => (
    <div className="nt-settings-row">
      <div>
        <div className="nt-settings-row-label">{label}</div>
        {desc && <div className="nt-settings-row-desc">{desc}</div>}
      </div>
      {action}
    </div>
  );

  return (
    <DashboardLayout>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Settings</div>
          <div className="nt-page-subtitle">Manage your profile, security, and preferences</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="nt-profile-card">
        {/* Avatar with upload */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            className="nt-profile-avatar-lg"
            style={{
              overflow: 'hidden',
              background: profilePhoto ? 'transparent' : undefined,
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to change photo"
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              initials
            )}
          </div>
          {/* Camera overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: '#7c3aed', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
            title="Upload photo"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        <div>
          <div className="nt-profile-name">{fullName || 'Therapist'}</div>
          <div className="nt-profile-role">🩺 Therapist</div>
          <div className="nt-profile-email">{email}</div>
          {profilePhoto && (
            <button
              onClick={() => { setProfilePhoto(null); localStorage.removeItem('profilePhoto'); }}
              style={{
                marginTop: 6, background: 'none', border: 'none',
                color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0,
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="nt-settings-grid">

        {/* ── Profile ── */}
        <Section icon={<User />} title="Profile Information">
          <div className="nt-space-y-4">
            <div>
              <label className="nt-label">Full Name</label>
              <input
                className="nt-input"
                value={fullName}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="Name is managed by your account"
              />
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                Name is managed by your account administrator
              </div>
            </div>
            <div>
              <label className="nt-label">Email Address</label>
              <input
                className="nt-input"
                value={email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label className="nt-label">Username</label>
              <input
                className="nt-input"
                value={user?.username || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label className="nt-label">Phone Number</label>
              <input
                className="nt-input"
                value={profileForm.phone_number}
                onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="nt-label">Guardian Type</label>
              <input
                className="nt-input"
                value={user?.guardian?.guardian_type || 'therapist'}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'capitalize' }}
              />
            </div>
            <button
              className="nt-btn nt-btn-primary"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Section>

        {/* ── Security ── */}
        <Section icon={<Shield />} title="Security">
          <Row
            label="Change Password"
            desc="Update your account password"
            action={
              <button
                className="nt-btn nt-btn-outline"
                style={{ padding: '6px 14px', fontSize: 13 }}
                onClick={() => setShowPasswordForm((v) => !v)}
              >
                {showPasswordForm ? 'Cancel' : 'Change'}
              </button>
            }
          />

          {showPasswordForm && (
            <div style={{
              background: 'rgba(124,58,237,0.05)', borderRadius: 10,
              padding: '16px', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <input
                className="nt-input"
                type="password"
                placeholder="Current password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
              <input
                className="nt-input"
                type="password"
                placeholder="New password (min 8 chars)"
                value={passwordForm.newPass}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              />
              <input
                className="nt-input"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
              <button
                className="nt-btn nt-btn-primary"
                onClick={handleSavePassword}
                disabled={savingPassword}
                style={{ alignSelf: 'flex-start' }}
              >
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          )}

          <Row
            label="Account Status"
            desc={`Your account is ${user?.status || 'active'}`}
            action={
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
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

        {/* ── Notifications ── */}
        <Section icon={<Bell />} title="Alerts & Notifications">
          <Row
            label="Email Notifications"
            desc="Receive daily summaries via email"
            action={<Toggle value={emailNotifs} onChange={setEmailNotifs} />}
          />
          <Row
            label="Push Notifications"
            desc="Get notified about new sessions"
            action={<Toggle value={pushNotifs} onChange={setPushNotifs} />}
          />
          <Row
            label="Anomaly Alerts"
            desc="Instant alert for unusual session data"
            action={<Toggle value={anomalyAlerts} onChange={setAnomalyAlerts} />}
          />
          <Row
            label="Weekly Progress Report"
            desc="Get a summary of all patients' progress"
            action={<Toggle value={weeklyReport} onChange={setWeeklyReport} />}
          />
          <div style={{ marginTop: 12 }}>
            <button
              className="nt-btn nt-btn-primary"
              onClick={handleSaveNotifs}
              disabled={savingNotifs}
            >
              {savingNotifs ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </Section>

        {/* ── Account Info ── */}
        <Section icon={<Lock />} title="Account Info">
          <Row label="User ID"       desc={`#${user?.id || '—'}`}         action={null} />
          <Row label="Role"          desc={user?.role || 'guardian'}       action={null} />
          <Row label="Guardian ID"   desc={`#${user?.guardian?.id || '—'}`} action={null} />
          <Row
            label="Last Updated"
            desc={user?.updated_at
              ? new Date(user.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : '—'}
            action={null}
          />
        </Section>

        {/* ── Danger Zone ── */}
        <Section icon={<Shield />} title="Danger Zone" danger>
          <Row
            label="Delete Account"
            desc="Permanently remove your data and access"
            action={
              <button
                className="nt-btn nt-btn-danger"
                style={{ padding: '6px 14px', fontSize: 13 }}
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
    </DashboardLayout>
  );
};

export default Settings;