import React, { useState } from 'react';
import { api } from '../api.js';

export default function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <input id="login-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder=" 09..." required />
      <label htmlFor="login-password">Password</label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input 
          id="login-password" 
          type={showPassword ? "text" : "password"} 
          autoComplete="current-password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-dim, #666)'
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          )}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn primary auth-submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
    </form>
  </main>;
}
