import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import TallyTab from './components/TallyTab.jsx';
import RecipesTab from './components/RecipesTab.jsx';
import StockTab from './components/StockTab.jsx';
import HistoryTab from './components/HistoryTab.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import SettingsTab from './components/SettingsTab.jsx';

function SunIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.5 3.1-5.3 7-5.3s6.2 1.8 7 5.3" /></svg>;
}

function ChevronIcon({ open }) {
  return <svg className={`chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>;
}

// Tab icons
function TallyIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 5h18M3 10h14M3 15h10M3 20h6" strokeLinecap="round" />
    </svg>
  );
}
function RecipesIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C9.5 2 7 4.5 7 7c0 1.8.9 3.4 2.2 4.4L10 20h4l.8-8.6A5 5 0 0 0 17 7c0-2.5-2.5-5-5-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12v8M15 12v8" strokeLinecap="round" />
    </svg>
  );
}
function StockIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
      <path d="M12 12v4M10 14h4" strokeLinecap="round" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9Z" strokeLinecap="round" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('tally');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    try {
      const [ing, items] = await Promise.all([api.getIngredients(), api.getMenuItems()]);
      setIngredients(ing);
      setMenuItems(items);
      setLoadError('');
    } catch (e) {
      setLoadError('Could not reach the server. Is it running on port 4000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getMe()
      .then(({ user: authenticatedUser }) => setUser(authenticatedUser))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => { if (user) reload(); }, [user, reload]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  async function logout() {
    try { await api.logout(); } catch { /* Clear the client session even if the server is unavailable. */ }
    setUser(null);
    setIngredients([]);
    setMenuItems([]);
    setLoading(true);
  }

  if (authLoading) return <main className="auth-page"><p className="auth-loading">Checking your session...</p></main>;
  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="wrap">
      <header>
        <div className="header-controls">
          <div className="header-actions">
            <button className="theme-toggle theme-icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="user-menu">
              <button className="theme-toggle user-menu-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen}>
                <span className="user-avatar"><UserIcon /></span>
                Owner <ChevronIcon open={userMenuOpen} />
              </button>
              {userMenuOpen && (
                <div className="user-menu-list">
                  <button onClick={() => { setTab('settings'); setUserMenuOpen(false); }}>Settings</button>
                  <button className="logout-item" onClick={logout}>Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="header-copy">
          <div className="logo-area">
            <span className="logo-icon" aria-hidden="true">
              <svg className="logo-svg" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="url(#logoGrad)" />
                {/* Fork */}
                <line x1="9" y1="7" x2="9" y2="12" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="9" y1="15" x2="9" y2="21" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M7 7v4a2 2 0 0 0 4 0V7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* Knife */}
                <path d="M19 7c0 0 2 2 2 5s-2 3-2 3v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F59E0B"/>
                    <stop offset="1" stopColor="#EA580C"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="logo-brand">Restaurant Manager</span>
          </div>
          <h1 className="header-title">Tonight's tally</h1>
          <p className="header-subtitle">Enter what sold, track ingredients used, and monitor stock in real time.</p>
        </div>
      </header>

      <nav aria-label="Main navigation">
        <button className={`tab-btn ${tab === 'tally' ? 'active' : ''}`} onClick={() => setTab('tally')}>
          <TallyIcon /><span className="tab-label">Tally</span>
        </button>
        <button className={`tab-btn ${tab === 'recipes' ? 'active' : ''}`} onClick={() => setTab('recipes')}>
          <RecipesIcon /><span className="tab-label">Recipes</span>
        </button>
        <button className={`tab-btn ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>
          <StockIcon /><span className="tab-label">Stock</span>
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <HistoryIcon /><span className="tab-label">History</span>
        </button>
      </nav>

      {loadError && <p style={{ color: 'var(--clay)' }}>{loadError}</p>}
      {loading ? (
        <p style={{ color: 'var(--ink-dim)' }}>Loading...</p>
      ) : (
        <>
          <div hidden={tab !== 'tally'}>
            <TallyTab ingredients={ingredients} menuItems={menuItems} reload={reload} />
          </div>
          <div hidden={tab !== 'recipes'}>
            <RecipesTab ingredients={ingredients} menuItems={menuItems} reload={reload} />
          </div>
          <div hidden={tab !== 'stock'}>
            <StockTab ingredients={ingredients} menuItems={menuItems} reload={reload} />
          </div>
          <div hidden={tab !== 'history'}>
            <HistoryTab />
          </div>
          <div hidden={tab !== 'settings'}>
            <SettingsTab user={user} onUserUpdated={setUser} onLogout={logout} />
          </div>
        </>
      )}

      <p className="foot-note">Developed by Zskeleton Solution</p>
    </div>
  );
}
