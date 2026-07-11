import React, { useState } from 'react';
import { api } from '../api.js';

export default function SettingsTab({ user, onUserUpdated, onLogout }) {
  const [phone, setPhone] = useState(user.phone);
  const [profilePassword, setProfilePassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function updatePhone(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updatedUser } = await api.updateProfile(phone.trim(), profilePassword);
      onUserUpdated(updatedUser);
      setProfilePassword('');
      setProfileMessage({ text: 'Mobile phone updated successfully.', error: false });
    } catch (e) { setProfileMessage({ text: e.message, error: true }); }
    finally { setSavingProfile(false); }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordMessage({ text: 'New passwords do not match.', error: true }); return; }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordMessage({ text: 'Password changed successfully.', error: false });
    } catch (e) { setPasswordMessage({ text: e.message, error: true }); }
    finally { setSavingPassword(false); }
  }

  return (
    <div className="settings-page">
      <div className="card settings-intro">
        <p className="settings-eyebrow">ACCOUNT SETTINGS</p>
        <h2>Owner account</h2>
        <p>Manage your sign-in details and account security.</p>
        <span className="role-badge">{user.role}</span>
      </div>

      <form className="card settings-form" onSubmit={updatePhone}>
        <h2>Mobile phone</h2>
        <p className="settings-help">Your mobile phone is used to sign in.</p>
        <label htmlFor="settings-phone">Mobile phone</label>
        <input id="settings-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
        <label htmlFor="settings-profile-password">Current password</label>
        <input id="settings-profile-password" type="password" autoComplete="current-password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} required />
        {profileMessage && <p className={`settings-message ${profileMessage.error ? 'error' : ''}`}>{profileMessage.text}</p>}
        <button className="btn primary" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save phone number'}</button>
      </form>

      <form className="card settings-form" onSubmit={updatePassword}>
        <h2>Password</h2>
        <p className="settings-help">Choose a strong password with at least 8 characters.</p>
        <label htmlFor="settings-current-password">Current password</label>
        <input id="settings-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        <label htmlFor="settings-new-password">New password</label>
        <input id="settings-new-password" type="password" autoComplete="new-password" minLength="8" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        <label htmlFor="settings-confirm-password">Confirm new password</label>
        <input id="settings-confirm-password" type="password" autoComplete="new-password" minLength="8" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        {passwordMessage && <p className={`settings-message ${passwordMessage.error ? 'error' : ''}`}>{passwordMessage.text}</p>}
        <button className="btn primary" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change password'}</button>
      </form>

      <div className="card settings-form">
        <h2>Session</h2>
        <p className="settings-help">End this session on the current device.</p>
        <button className="btn danger-btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}
