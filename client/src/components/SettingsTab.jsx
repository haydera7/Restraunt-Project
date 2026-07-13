import React, { useState } from 'react';
import { api } from '../api.js';

function PasswordInput({ id, value, onChange, label, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input 
          id={id} 
          type={show ? "text" : "password"} 
          autoComplete={autoComplete} 
          minLength={minLength}
          value={value} 
          onChange={onChange} 
          required 
          style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          )}
        </button>
      </div>
    </>
  );
}

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
        <PasswordInput id="settings-profile-password" label="Current password" autoComplete="current-password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} />
        {profileMessage && <p className={`settings-message ${profileMessage.error ? 'error' : ''}`}>{profileMessage.text}</p>}
        <button className="btn primary" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save phone number'}</button>
      </form>

      <form className="card settings-form" onSubmit={updatePassword}>
        <h2>Password</h2>
        <p className="settings-help">Choose a strong password with at least 8 characters.</p>
        <PasswordInput id="settings-current-password" label="Current password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <PasswordInput id="settings-new-password" label="New password" autoComplete="new-password" minLength="8" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <PasswordInput id="settings-confirm-password" label="Confirm new password" autoComplete="new-password" minLength="8" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        {passwordMessage && <p className={`settings-message ${passwordMessage.error ? 'error' : ''}`}>{passwordMessage.text}</p>}
        <button className="btn primary" disabled={savingPassword}>{savingPassword ? 'Updating...' : 'Change password'}</button>
      </form>

      <div className="card settings-form">
        <h2>Session</h2>
        <p className="settings-help">End this session on the current device.</p>
        <button type="button" className="btn danger-btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}
