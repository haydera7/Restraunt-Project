import React, { useState } from 'react';
import { api } from '../api.js';

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
        <div className="row">
          <div>
            <label>Menu item</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {menuItems.length === 0
                ? <option value="">Add a menu item first</option>
                : menuItems.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
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
            {enteredQty} × {selectedItem.price} = <strong>{pendingLineTotal}</strong> sales
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
              <span className="calculation">{e.qty} × {e.price} = {Math.round(e.price * e.qty * 100) / 100}</span>
              <button className="btn ghost" onClick={() => removeEntry(idx)} aria-label="Remove">&times;</button>
            </div>
          ))}
          {entries.length > 0 && (
            <div className="receipt-line" style={{ borderTop: '1px solid var(--board-line)', borderBottom: 'none', fontWeight: 600 }}>
              <span className="name">Total</span>
              <span className="qty">{Math.round(runningTotal * 100) / 100} sales</span>
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
          <h2>Tonight's revenue: {result.totalRevenue}</h2>
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
