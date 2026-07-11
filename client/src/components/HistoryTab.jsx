import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(value));
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

export default function HistoryTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [logs, setLogs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  async function load(filters = {}) {
    setLoading(true);
    try {
      setLogs(await api.getHistory(filters));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilters() {
    if (from && to && from > to) {
      setError('The From date must be before the To date.');
      return;
    }
    load({ from, to });
  }

  function clearFilters() {
    setFrom('');
    setTo('');
    load();
  }

  function requestDelete(log) {
    setToast({ type: 'confirm', id: log._id, message: `Delete the tally from ${formatDate(log.date)}? This only removes the history record.` });
  }

  async function deleteLog() {
    const { id } = toast;
    setToast(null);
    try {
      await api.deleteHistory(id);
      setLogs(logs.filter(log => log._id !== id));
      setOpenId(null);
      setToast({ type: 'success', message: 'History record deleted.' });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  return (
    <div>
      <div className="card">
        <h2>Tally history</h2>
        <div className="row history-filters">
          <div>
            <label htmlFor="history-from">From</label>
            <input id="history-from" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="history-to">To</label>
            <input id="history-to" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn primary" onClick={applyFilters} disabled={loading}>Apply</button>
          {(from || to) && <button className="btn" onClick={clearFilters} disabled={loading}>Clear</button>}
        </div>
        {error && <p className="history-error">{error}</p>}
      </div>

      <div className="card">
        {loading && <div className="empty-note">Loading history...</div>}
        {!loading && logs.length === 0 && <div className="empty-note">No tallies found for this date range.</div>}
        {!loading && logs.map(log => {
          const isOpen = openId === log._id;
          return (
            <div className="history-log" key={log._id}>
              <div className="history-summary">
                <div>
                  <div className="history-date">{formatDate(log.date)}</div>
                  <div className="meta">{log.sold.reduce((sum, line) => sum + line.qty, 0)} items sold</div>
                </div>
                <div className="history-revenue">{log.totalRevenue}</div>
                <div className="history-actions">
                  <button className="btn" onClick={() => setOpenId(isOpen ? null : log._id)}>
                    {isOpen ? 'Hide' : 'View'}
                  </button>
                  {isOpen && <button className="icon-btn danger" onClick={() => requestDelete(log)} aria-label="Delete history record" title="Delete history record"><TrashIcon /></button>}
                </div>
              </div>
              {isOpen && (
                <div className="history-details">
                  <h3>Sales</h3>
                  {log.sold.map((line, index) => <div className="history-line" key={index}>
                    <span>{line.name}</span><span>{line.qty} × {line.price} = {line.lineTotal}</span>
                  </div>)}
                  <div className="history-line history-total">
                    <span>Total</span><span>{log.totalRevenue}</span>
                  </div>
                  <h3>Ingredients used</h3>
                  {log.usage.map((line, index) => <div className="history-line" key={index}>
                    <span>{line.name}</span><span>{line.before} − {line.used} = {line.after} {line.unit}</span>
                  </div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`} role={toast.type === 'confirm' ? 'alertdialog' : 'status'}>
          <span>{toast.message}</span>
          {toast.type === 'confirm' ? (
            <div className="toast-actions">
              <button className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button className="btn danger-btn" onClick={deleteLog}>Delete</button>
            </div>
          ) : <button className="icon-btn" onClick={() => setToast(null)} aria-label="Dismiss message">&times;</button>}
        </div>
      )}
    </div>
  );
}
