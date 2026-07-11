import React, { useState } from 'react';
import { api } from '../api.js';

export default function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.login(phone.trim(), password);
      onLogin(user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <p className="auth-eyebrow">RESTAURANT INVENTORY</p>
      <h1>Welcome back</h1>
      <p className="auth-copy">Log in to manage tonight’s tally and stock.</p>
      <label htmlFor="login-phone">Mobile phone</label>
      <input id="login-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +251 9..." required />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <p className="form-error">{error}</p>}
      <button className="btn primary auth-submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
    </form>
  </main>;
}
