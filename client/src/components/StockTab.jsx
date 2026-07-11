import React, { useState } from 'react';
import { api } from '../api.js';

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

export default function StockTab({ ingredients, menuItems, reload }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('g');
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');

  async function addIngredient() {
    if (!name.trim()) return;
    try {
      await api.addIngredient({ name: name.trim(), unit, stock: Number(stock) || 0 });
      setName(''); setStock(''); setError('');
      reload();
    } catch (e) { setError(e.message); }
  }

  function requestRestock(id, name, currentStock, ingredientUnit) {
    setRestockAmount('');
    setToast({ type: 'restock', id, name, currentStock, unit: ingredientUnit });
  }

  async function restock() {
    const amount = Number(restockAmount);
    if (!restockAmount || Number.isNaN(amount) || amount <= 0) {
      setToast({ type: 'error', message: 'Enter a positive restock amount.' });
      return;
    }
    const { id, name } = toast;
    setToast(null);
    try {
      await api.restockIngredient(id, amount);
      reload();
      setToast({ type: 'success', message: `${amount} added to ${name}.` });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  function requestDelete(id, name) {
    setToast({ type: 'confirm', id, name, message: `Delete "${name}"? This cannot be undone.` });
  }

  async function remove() {
    const { id } = toast;
    setToast(null);
    try { await api.deleteIngredient(id); reload(); }
    catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  return (
    <div>
      <div className="card">
        <h2>Add an ingredient</h2>
        <div className="row">
          <div>
            <label>Ingredient name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Egg" />
          </div>
          <div style={{ flex: 0.6 }}>
            <label>Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="pcs">pcs</option>
            </select>
          </div>
          <div style={{ flex: 0.6 }}>
            <label>Starting stock</label>
            <input type="number" min="0" step="0.1" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
          </div>
          <div>
            <button className="btn primary" onClick={addIngredient}>Add</button>
          </div>
        </div>
        {error && <p style={{ color: 'var(--clay)', fontSize: 13 }}>{error}</p>}
      </div>

      <div className="card">
        <h2>Current stock</h2>
        {ingredients.length === 0 && <div className="empty-note">No ingredients yet. Add one above.</div>}
        {ingredients.map(ing => (
          <div className="ing-row" key={ing._id}>
            <div>
              <div>{ing.name}</div>
              <div className="meta">{ing.unit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="stock-num">{Math.round(ing.stock * 100) / 100} {ing.unit}</span>
              <button className="icon-btn" onClick={() => requestRestock(ing._id, ing.name, ing.stock, ing.unit)} aria-label={`Restock ${ing.name}`} title="Restock"><PlusIcon /></button>
              <button className="icon-btn danger" onClick={() => requestDelete(ing._id, ing.name)} aria-label={`Delete ${ing.name}`} title="Delete ingredient"><TrashIcon /></button>
            </div>
          </div>
        ))}
      </div>
      {toast?.type === 'restock' && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setToast(null)}>
          <form className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="restock-title" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); restock(); }}>
            <p className="stock-modal-eyebrow">RESTOCK INGREDIENT</p>
            <h2 id="restock-title">Add stock for {toast.name}</h2>
            <p className="stock-modal-current">Current stock: <strong>{Math.round(toast.currentStock * 100) / 100} {toast.unit}</strong></p>
            <label htmlFor="restock-amount">Amount to add ({toast.unit})</label>
            <input id="restock-amount" autoFocus type="number" min="0" step="0.1" placeholder="0" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} />
            <div className="stock-modal-actions">
              <button type="button" className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button type="submit" className="btn primary"><PlusIcon /> Add stock</button>
            </div>
          </form>
        </div>
      )}
      {toast && toast.type !== 'restock' && (
        <div className={`toast ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`} role={toast.type === 'confirm' || toast.type === 'restock' ? 'alertdialog' : 'status'}>
          <span>{toast.message}</span>
          {toast.type === 'confirm' ? (
            <div className="toast-actions">
              <button className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button className="btn danger-btn" onClick={remove}>Delete</button>
            </div>
          ) : <button className="icon-btn" onClick={() => setToast(null)} aria-label="Dismiss message">&times;</button>}
        </div>
      )}
    </div>
  );
}
