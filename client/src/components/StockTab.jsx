import React, { useState } from 'react';
import { api } from '../api.js';

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const CONVERSIONS = {
  volume: { base: 'ml', units: ['ml', 'l'], labels: { ml: 'ml', l: 'L' }, ml: 1, l: 1000 },
  weight: { base: 'g', units: ['g', 'kg'], labels: { g: 'g', kg: 'kg' }, g: 1, kg: 1000 },
  count: { base: 'pcs', units: ['pcs'], labels: { pcs: 'pcs' }, pcs: 1 }
};

export default function StockTab({ ingredients, menuItems, reload }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('weight');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState('g');
  const [threshold, setThreshold] = useState('');
  const [thresholdUnit, setThresholdUnit] = useState('g');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockUnit, setRestockUnit] = useState('g');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('weight');
  const [editStock, setEditStock] = useState('');
  const [editStockUnit, setEditStockUnit] = useState('g');
  const [editThreshold, setEditThreshold] = useState('');
  const [editThresholdUnit, setEditThresholdUnit] = useState('g');

  function handleCategoryChange(cat) {
    setCategory(cat);
    const defUnit = CONVERSIONS[cat].units[0];
    setStockUnit(defUnit);
    setThresholdUnit(defUnit);
  }

  function handleEditCategoryChange(cat) {
    setEditCategory(cat);
    const defUnit = CONVERSIONS[cat].units[0];
    setEditStockUnit(defUnit);
    setEditThresholdUnit(defUnit);
  }

  function getConvertedPreview(qty, unit, cat) {
    const q = Number(qty);
    if (!qty || isNaN(q) || q < 0) return '';
    const factor = CONVERSIONS[cat]?.[unit];
    if (!factor) return '';
    const base = CONVERSIONS[cat].base;
    return `(= ${(q * factor).toLocaleString()} ${base})`;
  }

  async function addIngredient() {
    if (!name.trim()) return;
    try {
      await api.addIngredient({
        name: name.trim(),
        category,
        stock: Number(stock) || 0,
        stockUnit,
        threshold: Number(threshold) || 0,
        thresholdUnit
      });
      setName(''); setStock(''); setThreshold(''); setError('');
      const defUnit = CONVERSIONS[category].units[0];
      setStockUnit(defUnit);
      setThresholdUnit(defUnit);
      reload();
    } catch (e) { setError(e.message); }
  }

  function requestRestock(id, name, currentStock, ingredientUnit, category) {
    setRestockAmount('');
    setRestockUnit(ingredientUnit);
    setToast({ type: 'restock', id, name, currentStock, unit: ingredientUnit, category });
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
      await api.restockIngredient(id, amount, restockUnit);
      reload();
      const label = CONVERSIONS[toast.category]?.labels[restockUnit] || restockUnit;
      setToast({ type: 'success', message: `${amount} ${label} added to ${name}.` });
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

  function requestEdit(ing) {
    setEditName(ing.name);
    setEditCategory(ing.category || 'weight');
    setEditStock(ing.stock);
    setEditStockUnit(ing.unit);
    setEditThreshold(ing.threshold || 0);
    setEditThresholdUnit(ing.unit);
    setToast({ type: 'edit', id: ing._id, name: ing.name });
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    const { id } = toast;
    setToast(null);
    try {
      await api.updateIngredient(id, {
        name: editName.trim(),
        category: editCategory,
        stock: Number(editStock) || 0,
        stockUnit: editStockUnit,
        threshold: Number(editThreshold) || 0,
        thresholdUnit: editThresholdUnit
      });
      reload();
      setToast({ type: 'success', message: `Ingredient updated successfully.` });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  return (
    <div>
      <div className="card">
        <h2>Add an ingredient</h2>
        <div className="add-form">
          {/* Ingredient name */}
          <div className="field-group">
            <label htmlFor="add-name">Ingredient name</label>
            <input id="add-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Egg" />
            <div className="field-hint" />
          </div>

          {/* Category */}
          <div className="field-group">
            <label htmlFor="add-category">Category</label>
            <select id="add-category" value={category} onChange={e => handleCategoryChange(e.target.value)}>
              <option value="volume">Volume</option>
              <option value="weight">Weight</option>
              <option value="count">Count</option>
            </select>
            <div className="field-hint" />
          </div>

          {/* Starting stock */}
          <div className="field-group">
            <label htmlFor="add-stock">Starting stock</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input id="add-stock" type="number" min="0" step="0.1" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={{ flex: 1 }} />
              <select value={stockUnit} onChange={e => setStockUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                {CONVERSIONS[category].units.map(u => (
                  <option key={u} value={u}>{CONVERSIONS[category].labels[u]}</option>
                ))}
              </select>
            </div>
            <div className="field-hint">{getConvertedPreview(stock, stockUnit, category)}</div>
          </div>

          {/* Min threshold */}
          <div className="field-group">
            <label htmlFor="add-threshold">Min threshold</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input id="add-threshold" type="number" min="0" step="0.1" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="0" style={{ flex: 1 }} />
              <select value={thresholdUnit} onChange={e => setThresholdUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                {CONVERSIONS[category].units.map(u => (
                  <option key={u} value={u}>{CONVERSIONS[category].labels[u]}</option>
                ))}
              </select>
            </div>
            <div className="field-hint">{getConvertedPreview(threshold, thresholdUnit, category)}</div>
          </div>

          {/* Add button — invisible label + hint spacer keeps it row-aligned */}
          <div className="btn-wrap">
            <label aria-hidden="true">‎</label>
            <button className="btn primary" onClick={addIngredient}>Add</button>
            <div className="hint-gap" />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ing.name}
                {ing.stock <= ing.threshold && (
                  <span style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#b91c1c', 
                    fontSize: '11px', 
                    padding: '2px 6px', 
                    borderRadius: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>Low Stock</span>
                )}
              </div>
              <div className="meta">{ing.unit} (Min: {ing.threshold})</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="stock-num">{Math.round(ing.stock * 100) / 100} {ing.unit}</span>
              <button className="icon-btn" onClick={() => requestEdit(ing)} aria-label={`Edit ${ing.name}`} title="Edit"><EditIcon /></button>
              <button className="icon-btn" onClick={() => requestRestock(ing._id, ing.name, ing.stock, ing.unit, ing.category)} aria-label={`Restock ${ing.name}`} title="Restock"><PlusIcon /></button>
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
            <p className="stock-modal-current">Current stock: <strong>{Math.round(toast.currentStock * 100) / 100} {CONVERSIONS[toast.category]?.labels[toast.unit] || toast.unit}</strong></p>
            
            <div className="field-gap">
              <label htmlFor="restock-amount">Amount to add</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="restock-amount" autoFocus type="number" min="0" step="0.1" placeholder="0" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} style={{ flex: 1 }} />
                <select value={restockUnit} onChange={e => setRestockUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                  {CONVERSIONS[toast.category]?.units.map(u => (
                    <option key={u} value={u}>{CONVERSIONS[toast.category]?.labels[u]}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                {getConvertedPreview(restockAmount, restockUnit, toast.category)}
              </div>
            </div>

            <div className="stock-modal-actions">
              <button type="button" className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button type="submit" className="btn primary"><PlusIcon /> Add stock</button>
            </div>
          </form>
        </div>
      )}
      {toast?.type === 'edit' && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setToast(null)}>
          <form className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); saveEdit(); }}>
            <p className="stock-modal-eyebrow">EDIT INGREDIENT</p>
            <h2 id="edit-title">Edit {toast.name}</h2>
            
            <div className="field-gap">
              <label htmlFor="edit-name">Ingredient name</label>
              <input id="edit-name" autoFocus type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>

            <div className="field-gap">
              <label htmlFor="edit-category">Category</label>
              <select id="edit-category" value={editCategory} onChange={e => handleEditCategoryChange(e.target.value)}>
                <option value="volume">Volume</option>
                <option value="weight">Weight</option>
                <option value="count">Count</option>
              </select>
            </div>

            <div className="field-gap">
              <label htmlFor="edit-stock">Current stock</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="edit-stock" type="number" min="0" step="0.1" value={editStock} onChange={e => setEditStock(e.target.value)} required style={{ flex: 1 }} />
                <select value={editStockUnit} onChange={e => setEditStockUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                  {CONVERSIONS[editCategory]?.units.map(u => (
                    <option key={u} value={u}>{CONVERSIONS[editCategory]?.labels[u]}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                {getConvertedPreview(editStock, editStockUnit, editCategory)}
              </div>
            </div>

            <div className="field-gap">
              <label htmlFor="edit-threshold">Min threshold</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="edit-threshold" type="number" min="0" step="0.1" value={editThreshold} onChange={e => setEditThreshold(e.target.value)} required style={{ flex: 1 }} />
                <select value={editThresholdUnit} onChange={e => setEditThresholdUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                  {CONVERSIONS[editCategory]?.units.map(u => (
                    <option key={u} value={u}>{CONVERSIONS[editCategory]?.labels[u]}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                {getConvertedPreview(editThreshold, editThresholdUnit, editCategory)}
              </div>
            </div>

            <div className="stock-modal-actions">
              <button type="button" className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save changes</button>
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
