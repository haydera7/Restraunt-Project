import React, { useState } from 'react';
import { api } from '../api.js';
import SearchableSelect from './SearchableSelect.jsx';

export default function TallyTab({ ingredients, menuItems, reload }) {
  const [selectedId, setSelectedId] = useState(menuItems[0]?._id || '');
  const [qty, setQty] = useState('');
  const [entries, setEntries] = useState([]);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    if (!selectedId && menuItems.length) setSelectedId(menuItems[0]._id);
  }, [menuItems]);

  function addEntry() {
    const n = Number(qty);
    if (!selectedId || !n || n <= 0) return;
    if (hasShortage) return;
    const existing = entries.find(e => e.menuItemId === selectedId);
    if (existing) {
      setEntries(entries.map(e => e.menuItemId === selectedId ? { ...e, qty: e.qty + n } : e));
    } else {
      const item = menuItems.find(m => m._id === selectedId);
      setEntries([...entries, { menuItemId: selectedId, name: item.name, price: item.price, qty: n }]);
    }
    setQty('');
  }

  const runningTotal = entries.reduce((sum, e) => sum + e.price * e.qty, 0);
  const selectedItem = menuItems.find(m => m._id === selectedId);
  const enteredQty = Number(qty);
  const pendingLineTotal = selectedItem && enteredQty > 0
    ? Math.round(selectedItem.price * enteredQty * 100) / 100
    : null;
  const pendingCostTotal = selectedItem && enteredQty > 0
    ? Math.round((selectedItem.costToMake || 0) * enteredQty * 100) / 100
    : null;

  const pendingIngredientCalculations = selectedItem && enteredQty > 0
    ? selectedItem.recipe.map(line => {
      const ingredient = line.ingredient;
      const perItem = Number(line.qty || 0);
      const total = Math.round(perItem * enteredQty * 100) / 100;
      return {
        id: ingredient?._id || ingredient,
        name: ingredient?.name || 'Unknown ingredient',
        unit: ingredient?.unit || '',
        perItem,
        total
      };
    })
    : [];

  // The current typed quantity is included before it is added, so this stays live.
  const entriesWithPending = enteredQty > 0 && selectedId
    ? (() => {
      const existing = entries.find(entry => entry.menuItemId === selectedId);
      return existing
        ? entries.map(entry => entry.menuItemId === selectedId ? { ...entry, qty: entry.qty + enteredQty } : entry)
        : [...entries, { menuItemId: selectedId, qty: enteredQty }];
    })()
    : entries;

  const ingredientUsage = entriesWithPending.reduce((usage, entry) => {
    const menuItem = menuItems.find(item => item._id === entry.menuItemId);
    menuItem?.recipe?.forEach(line => {
      const ingredientId = line.ingredient?._id || line.ingredient;
      if (!ingredientId) return;
      usage.set(ingredientId, (usage.get(ingredientId) || 0) + Number(line.qty || 0) * entry.qty);
    });
    return usage;
  }, new Map());

  const ingredientCalculations = [...ingredientUsage.entries()].map(([ingredientId, amount]) => {
    const ingredient = ingredients.find(item => item._id === ingredientId);
    const stock = Number(ingredient?.stock || 0);
    const used = Math.round(amount * 100) / 100;
    return {
      id: ingredientId,
      name: ingredient?.name || 'Unknown ingredient',
      unit: ingredient?.unit || '',
      stock,
      used,
      remaining: Math.round((stock - used) * 100) / 100
    };
  });
  const shortages = ingredientCalculations.filter(item => item.remaining < 0);
  const hasShortage = shortages.length > 0;

  function removeEntry(idx) {
    setEntries(entries.filter((_, i) => i !== idx));
  }

  async function process() {
    if (entries.length === 0) return;
    if (hasShortage) return;
    setProcessing(true);
    const startedAt = Date.now();
    try {
      const log = await api.processTally(entries.map(e => ({ menuItemId: e.menuItemId, qty: e.qty })));
      const remainingDelay = Math.max(0, 1400 - (Date.now() - startedAt));
      if (remainingDelay) await new Promise(resolve => setTimeout(resolve, remainingDelay));
      setResult(log);
      setEntries([]);
      await reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="card tally-add">
        <h2>Add a sold item</h2>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label>Menu item</label>
            <SearchableSelect
              value={selectedId}
              onChange={setSelectedId}
              options={menuItems.map(m => ({ value: m._id, label: m.name }))}
              placeholder="🔍 Search menu item..."
            />
          </div>
          <div style={{ flex: 0.6 }}>
            <label>Quantity sold</label>
            <input type="number" min="0" step="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
          </div>
          <div>
            <button className="btn primary" onClick={addEntry} disabled={hasShortage}>Add</button>
          </div>
        </div>
        {pendingLineTotal !== null && (
          <div className="tally-calculation" aria-live="polite">
            <span>{enteredQty} × {selectedItem.price} = <strong>{pendingLineTotal}</strong><small className="birr-xs">birr</small> sales</span>
            {pendingCostTotal !== null && (
              <>
                <span className="tally-calc-divider">&middot;</span>
                <span>cost <strong>{pendingCostTotal}</strong><small className="birr-xs">birr</small></span>
                <span className="tally-calc-divider">&middot;</span>
                <span>profit <strong className={(pendingLineTotal - pendingCostTotal) < 0 ? 'loss' : 'gain'}>{Math.round((pendingLineTotal - pendingCostTotal) * 100) / 100}</strong><small className="birr-xs">birr</small></span>
              </>
            )}
          </div>
        )}
        {pendingIngredientCalculations.length > 0 && (
          <div className="tally-ingredient-lines" aria-live="polite">
            {pendingIngredientCalculations.map(item => (
              <div key={item.id}>
                {item.name}: {item.perItem} {item.unit} × {enteredQty} = <strong>{item.total} {item.unit}</strong>
              </div>
            ))}
          </div>
        )}
        {hasShortage && (
          <div className="stock-alert" role="alert">
            Not enough stock: {shortages.map(item => `${item.name} is short by ${Math.abs(item.remaining)} ${item.unit}`).join(', ')}. Reduce the quantity to continue.
          </div>
        )}
      </div>

      <div className="card">
        <h2>Tonight's list</h2>
        <div className="receipt">
          {entries.length === 0 && <div className="receipt-empty">Nothing added yet</div>}
          {entries.map((e, idx) => (
            <div className="receipt-line" key={idx}>
              <span className="name">{e.name}</span>
              <span className="qty">x{e.qty}</span>
              <span className="calculation">{e.qty} × {e.price} = <b>{Math.round(e.price * e.qty * 100) / 100} <small className="birr-sm">Birr</small></b></span>
              <button className="btn ghost" onClick={() => removeEntry(idx)} aria-label="Remove item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
          {entries.length > 0 && (
            <div className="receipt-line" style={{ borderTop: '1px solid var(--board-line)', borderBottom: 'none', fontWeight: 600 }}>
              <span className="name">Total</span>
              <span className="qty">{Math.round(runningTotal * 100) / 100} <small className="birr-sm">Birr</small></span>
            </div>
          )}
        </div>
      </div>

      <button className="btn primary" style={{ width: '100%', padding: 12, fontSize: 14 }}
        disabled={entries.length === 0 || processing || hasShortage} onClick={process}>
        {processing ? 'Processing...' : "Process tonight's tally"}
      </button>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Tally Summary</h2>
          <div className="tally-stats-grid">
            <div className="tally-stat-card revenue">
              <div className="tally-stat-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="tally-stat-info">
                <span className="tally-stat-label">Revenue</span>
                <span className="tally-stat-value">{result.totalRevenue} Birr</span>
              </div>
            </div>

            <div className="tally-stat-card cost">
              <div className="tally-stat-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="8" x2="18" y2="8"></line>
                  <line x1="12" y1="12" x2="18" y2="12"></line>
                  <line x1="8" y1="16" x2="18" y2="16"></line>
                </svg>
              </div>
              <div className="tally-stat-info">
                <span className="tally-stat-label">Cost</span>
                <span className="tally-stat-value">{result.totalCost} Birr</span>
              </div>
            </div>

            <div className="tally-stat-card profit">
              <div className="tally-stat-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div className="tally-stat-info">
                <span className="tally-stat-label">Gross Profit</span>
                <span className={`tally-stat-value ${result.grossProfit < 0 ? 'loss' : 'gain'}`}>
                  {result.grossProfit} Birr
                </span>
              </div>
            </div>
          </div>
          <h2>Ingredients used tonight</h2>
          <table className="result-table ingredient-results">
            <thead>
              <tr><th>Ingredient</th><th>Used</th><th>Stock calculation</th><th>Remaining</th></tr>
            </thead>
            <tbody>
              {result.usage.map((r, i) => {
                let tag = null;
                if (r.after < 0) tag = <span className="tag low">short by {Math.abs(r.after)} {r.unit}</span>;
                else if (r.before > 0 && r.after / r.before < 0.15) tag = <span className="tag low">running low</span>;
                return (
                  <tr key={i}>
                    <td data-label="Ingredient">{r.name}</td>
                    <td data-label="Used">{r.used} {r.unit}</td>
                    <td data-label="Stock calculation">{r.before} − {r.used} = {r.after} {r.unit}</td>
                    <td data-label="Remaining">{r.after} {r.unit} {tag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {processing && (
        <div className="processing-overlay" role="status" aria-live="polite" aria-label="Processing tonight's tally">
          <div className="processing-panel">
            <div className="processing-spinner" aria-hidden="true"></div>
            <p className="processing-eyebrow">PLEASE WAIT</p>
            <h2>Processing your tally</h2>
            <p>Updating sales and ingredient stock.</p>
            <div className="processing-progress" aria-hidden="true"><span></span></div>
          </div>
        </div>
      )}
    </div>
  );
}