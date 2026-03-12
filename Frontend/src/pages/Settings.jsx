import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useApp } from '../context/AppContext';
import { User, Shield, Bell, Palette, Lock } from 'lucide-react';

const Settings = () => {
  const { user } = useApp();
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'TH';

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <DashboardLayout>
      <div className="nt-page-header">
        <div>
          <div className="nt-page-title">Settings</div>
          <div className="nt-page-subtitle">Manage your profile, security, and preferences</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="nt-profile-card">
        <div className="nt-profile-avatar-lg">{initials}</div>
        <div>
          <div className="nt-profile-name">{user?.name || 'Therapist'}</div>
          <div className="nt-profile-role">🩺 Therapist</div>
          <div className="nt-profile-email">{user?.email || 'therapist@example.com'}</div>
        </div>
      </div>

      <div className="nt-settings-grid">
        {/* Profile Section */}
        <div className="nt-settings-section">
          <div className="nt-settings-section-title"><User /> Profile Information</div>
          <div className="nt-space-y-4">
            <div>
              <label className="nt-label">Full Name</label>
              <input className="nt-input" defaultValue={user?.name || 'Dr. Sarah Mitchell'} />
            </div>
            <div>
              <label className="nt-label">Email Address</label>
              <input className="nt-input" defaultValue={user?.email || 'sarah@example.com'} />
            </div>
            <div>
              <label className="nt-label">Phone Number</label>
              <input className="nt-input" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="nt-label">Specialization</label>
              <input className="nt-input" defaultValue="Child Behavioral Therapy" />
            </div>
            <div>
              <label className="nt-label">Bio</label>
              <textarea className="nt-textarea" placeholder="Tell parents about yourself..." style={{ minHeight: 80 }} />
            </div>
            <button className="nt-btn nt-btn-primary">Save Profile</button>
          </div>
        </div>

        {/* Security Section */}
        <div className="nt-settings-section">
          <div className="nt-settings-section-title"><Shield /> Security</div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Change Password</div>
              <div className="nt-settings-row-desc">Update your account password</div>
            </div>
            <button className="nt-btn nt-btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>Change</button>
          </div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Two-Factor Authentication</div>
              <div className="nt-settings-row-desc">Add extra security to your account</div>
            </div>
            <button className={`nt-toggle ${twoFactor ? 'active' : ''}`} onClick={() => setTwoFactor(!twoFactor)} />
          </div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Active Sessions</div>
              <div className="nt-settings-row-desc">You're logged in from 1 device</div>
            </div>
            <button className="nt-btn nt-btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
              <Lock /> View
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="nt-settings-section">
          <div className="nt-settings-section-title"><Bell /> Alerts & Notifications</div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Email Notifications</div>
              <div className="nt-settings-row-desc">Receive daily summaries via email</div>
            </div>
            <button className={`nt-toggle ${emailNotifs ? 'active' : ''}`} onClick={() => setEmailNotifs(!emailNotifs)} />
          </div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Push Notifications</div>
              <div className="nt-settings-row-desc">Get notified about new sessions</div>
            </div>
            <button className={`nt-toggle ${pushNotifs ? 'active' : ''}`} onClick={() => setPushNotifs(!pushNotifs)} />
          </div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Anomaly Alerts</div>
              <div className="nt-settings-row-desc">Instant alert for unusual session data</div>
            </div>
            <button className={`nt-toggle ${anomalyAlerts ? 'active' : ''}`} onClick={() => setAnomalyAlerts(!anomalyAlerts)} />
          </div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Weekly Progress Report</div>
              <div className="nt-settings-row-desc">Get a summary of all patients' progress</div>
            </div>
            <button className={`nt-toggle ${weeklyReport ? 'active' : ''}`} onClick={() => setWeeklyReport(!weeklyReport)} />
          </div>
        </div>

        {/* Appearance */}
        <div className="nt-settings-section">
          <div className="nt-settings-section-title"><Palette /> Appearance</div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Language</div>
              <div className="nt-settings-row-desc">Currently set to English</div>
            </div>
            <button className="nt-btn nt-btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>Change</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="nt-settings-section" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="nt-settings-section-title" style={{ color: '#EF4444' }}><Shield /> Danger Zone</div>
          <div className="nt-settings-row">
            <div>
              <div className="nt-settings-row-label">Delete Account</div>
              <div className="nt-settings-row-desc">Permanently remove your data and access</div>
            </div>
            <button className="nt-btn nt-btn-danger" style={{ padding: '6px 14px', fontSize: 13 }}>Delete</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;