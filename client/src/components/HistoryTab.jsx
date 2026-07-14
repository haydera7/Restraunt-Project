import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(value));
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

function RevenueStatIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
}
function CostStatIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="16" y1="8" x2="18" y2="8"></line><line x1="12" y1="12" x2="18" y2="12"></line><line x1="8" y1="16" x2="18" y2="16"></line></svg>;
}
function ProfitStatIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
}
function WasteStatIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

export default function HistoryTab() {
  const [period, setPeriod] = useState('all');
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

  function rangeForPeriod(p) {
    const today = new Date();
    if (p === 'today') {
      const d = isoDate(today);
      return { from: d, to: d };
    }
    if (p === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { from: isoDate(start), to: isoDate(today) };
    }
    if (p === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: isoDate(start), to: isoDate(today) };
    }
    return { from: '', to: '' }; // 'all' — 'specific' is handled separately via handleRangeChange
  }

  function handlePeriodChange(newPeriod) {
    setPeriod(newPeriod);
    setError('');
    if (newPeriod === 'specific') {
      // Wait for the person to pick both From and To before loading anything.
      setFrom(''); setTo('');
      return;
    }
    const { from: f, to: t } = rangeForPeriod(newPeriod);
    setFrom(f); setTo(t);
    load({ from: f, to: t });
  }

  function handleRangeChange(newFrom, newTo) {
    setFrom(newFrom);
    setTo(newTo);
    setError('');
    if (newFrom && newTo) {
      if (newFrom > newTo) {
        setError('The From date must be before the To date.');
        return;
      }
      load({ from: newFrom, to: newTo });
    }
  }

  const summary = useMemo(() => {
    const totalRevenue = logs.reduce((sum, l) => sum + (l.totalRevenue || 0), 0);
    const totalCost = logs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
    const totalWastage = wastageLogs.reduce((sum, w) => sum + (w.costImpact || 0), 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalWastage;
    const itemsSold = logs.reduce((sum, l) => sum + l.sold.reduce((s, line) => s + line.qty, 0), 0);
    const round = n => Math.round(n * 100) / 100;
    return {
      totalRevenue: round(totalRevenue),
      totalCost: round(totalCost),
      totalWastage: round(totalWastage),
      grossProfit: round(grossProfit),
      netProfit: round(netProfit),
      nights: logs.length,
      itemsSold
    };
  }, [logs, wastageLogs]);

  const rangeLabel = period === 'today' ? 'Today'
    : period === 'week' ? 'Last 7 days'
      : period === 'month' ? 'This month'
        : period === 'specific' ? (from && to ? `${from} – ${to}` : 'Pick a range')
          : 'All time';

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
        <div className="period-select-row">
          <div className="period-select-wrap">
            <label htmlFor="history-period">Period</label>
            <select id="history-period" value={period} onChange={e => handlePeriodChange(e.target.value)} disabled={loading}>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
              <option value="specific">Custom range…</option>
            </select>
          </div>
          {period === 'specific' && (
            <>
              <div className="period-select-wrap">
                <label htmlFor="history-from">From</label>
                <input
                  id="history-from"
                  type="date"
                  value={from}
                  onChange={e => handleRangeChange(e.target.value, to)}
                  disabled={loading}
                />
              </div>
              <div className="period-select-wrap">
                <label htmlFor="history-to">To</label>
                <input
                  id="history-to"
                  type="date"
                  value={to}
                  onChange={e => handleRangeChange(from, e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}
        </div>
        {period === 'specific' && !(from && to) && (
          <p className="history-error" style={{ color: 'var(--ink-faint)' }}>Pick a From and To date above to see history for that range.</p>
        )}
        {error && <p className="history-error">{error}</p>}
      </div>

      <div className="card">
        <h2>Summary — {rangeLabel}</h2>
        {!loading && (
          <p className="meta" style={{ marginTop: -6, marginBottom: 4 }}>
            {summary.nights} {summary.nights === 1 ? 'night' : 'nights'} tallied &middot; {summary.itemsSold} items sold
          </p>
        )}
        <div className="tally-stats-grid history-stats-grid">
          <div className="tally-stat-card revenue">
            <div className="tally-stat-icon"><RevenueStatIcon /></div>
            <div className="tally-stat-info">
              <span className="tally-stat-label">Revenue</span>
              <span className="tally-stat-value">{summary.totalRevenue} Birr</span>
            </div>
          </div>
          <div className="tally-stat-card cost">
            <div className="tally-stat-icon"><CostStatIcon /></div>
            <div className="tally-stat-info">
              <span className="tally-stat-label">Ingredient cost</span>
              <span className="tally-stat-value">{summary.totalCost} Birr</span>
            </div>
          </div>
          <div className="tally-stat-card cost">
            <div className="tally-stat-icon"><WasteStatIcon /></div>
            <div className="tally-stat-info">
              <span className="tally-stat-label">Wastage cost</span>
              <span className="tally-stat-value">{summary.totalWastage} Birr</span>
            </div>
          </div>
          <div className="tally-stat-card profit">
            <div className="tally-stat-icon"><ProfitStatIcon /></div>
            <div className="tally-stat-info">
              <span className="tally-stat-label">Gross profit</span>
              <span className={`tally-stat-value ${summary.grossProfit < 0 ? 'loss' : 'gain'}`}>{summary.grossProfit} Birr</span>
            </div>
          </div>
          <div className="tally-stat-card profit">
            <div className="tally-stat-icon"><ProfitStatIcon /></div>
            <div className="tally-stat-info">
              <span className="tally-stat-label">Net profit (after wastage)</span>
              <span className={`tally-stat-value ${summary.netProfit < 0 ? 'loss' : 'gain'}`}>{summary.netProfit} Birr</span>
            </div>
          </div>
        </div>
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