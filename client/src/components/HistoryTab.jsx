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
  const [wastageLogs, setWastageLogs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  async function load(filters = {}) {
    setLoading(true);
    try {
      const [tallyResult, wastageResult] = await Promise.all([
        api.getHistory(filters),
        api.getWastageHistory(filters)
      ]);
      setLogs(tallyResult);
      setWastageLogs(wastageResult);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalWastageCost = Math.round(wastageLogs.reduce((sum, w) => sum + (w.costImpact || 0), 0) * 100) / 100;

  function requestDeleteWastage(log) {
    setToast({ type: 'confirm-waste', id: log._id, message: `Delete this wastage record (${log.name})? This cannot be undone.` });
  }

  async function deleteWastage() {
    const { id } = toast;
    setToast(null);
    try {
      await api.deleteWastageHistory(id);
      setWastageLogs(wastageLogs.filter(w => w._id !== id));
      setToast({ type: 'success', message: 'Wastage record deleted.' });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

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

  function handleToggle(id) {
    const nextOpenId = openId === id ? null : id;
    setOpenId(nextOpenId);
    if (nextOpenId) {
      setTimeout(() => {
        const el = document.getElementById(`log-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 80);
    }
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
            <div className="history-log" key={log._id} id={`log-${log._id}`}>
              <div className="history-summary">
                <div>
                  <div className="history-date">{formatDate(log.date)}</div>
                  <div className="meta">{log.sold.reduce((sum, line) => sum + line.qty, 0)} items sold &middot; profit <span className="revenue-profit">{log.grossProfit}</span> <span className="meta-card-currency">birr</span></div>
                </div>
                <div className="history-right-col">
                  <div className="history-revenue">
                    <span className="revenue-amount">{log.totalRevenue}</span>
                    <span className="revenue-currency">birr</span>
                  </div>
                  <div className="history-actions">
                    <button className="btn" onClick={() => handleToggle(log._id)}>
                      {isOpen ? 'Hide' : 'View'}
                    </button>
                    {isOpen && <button className="icon-btn danger" onClick={() => requestDelete(log)} aria-label="Delete history record" title="Delete history record"><TrashIcon /></button>}
                  </div>
                </div>
              </div>
              <div className={`history-details-wrapper ${isOpen ? 'open' : ''}`}>
                <div className="history-details">
                  <h3>Sales</h3>
                  {log.sold.map((line, index) => <div className="history-line" key={index}>
                    <span>{line.name}</span><span>{line.qty} × {line.price} = <b>{line.lineTotal} <small className="birr-sm">Birr</small></b></span>
                  </div>)}
                  <div className="history-line history-total">
                    <span>Total</span><span>{log.totalRevenue} <small className="birr-sm">Birr</small></span>
                  </div>
                  <div className="history-line">
                    <span>Ingredient cost</span><span>{log.totalCost} <small className="birr-sm">Birr</small></span>
                  </div>
                  <div className="history-line history-total">
                    <span>Gross profit</span><span className={log.grossProfit < 0 ? 'detail-loss' : 'detail-gain'}>{log.grossProfit} <small className="birr-sm">Birr</small></span>
                  </div>
                  <h3>Ingredients used</h3>
                  {log.usage.map((line, index) => <div className="history-line" key={index}>
                    <span>{line.name}</span><span>{line.before} − {line.used} = {line.after} {line.unit}</span>
                  </div>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>Wastage log</h2>
        {!loading && wastageLogs.length > 0 && (
          <p className="meta" style={{ marginBottom: 10 }}>Total wastage cost for this range: <strong>{totalWastageCost} <small className="birr-sm">Birr</small></strong></p>
        )}
        {loading && <div className="empty-note">Loading wastage...</div>}
        {!loading && wastageLogs.length === 0 && <div className="empty-note">No wastage logged for this date range.</div>}
        {!loading && wastageLogs.map(w => (
          <div className="history-line" key={w._id}>
            <span>
              {formatDate(w.date)} — {w.name} · {w.qty} {w.unit} · {w.reason}
              {w.note ? ` (${w.note})` : ''}
            </span>
            <span className="wastage-right">
              <span className="wastage-cost">{w.costImpact} <small className="birr-sm">Birr</small></span>
              <button className="icon-btn danger" onClick={() => requestDeleteWastage(w)} aria-label="Delete wastage record" title="Delete wastage record"><TrashIcon /></button>
            </span>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`} role={toast.type === 'confirm' || toast.type === 'confirm-waste' ? 'alertdialog' : 'status'}>
          <span>{toast.message}</span>
          {toast.type === 'confirm' ? (
            <div className="toast-actions">
              <button className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button className="btn danger-btn" onClick={deleteLog}>Delete</button>
            </div>
          ) : toast.type === 'confirm-waste' ? (
            <div className="toast-actions">
              <button className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button className="btn danger-btn" onClick={deleteWastage}>Delete</button>
            </div>
          ) : <button className="icon-btn" onClick={() => setToast(null)} aria-label="Dismiss message">&times;</button>}
        </div>
      )}
    </div>
  );
}