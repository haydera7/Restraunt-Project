import React, { useState } from 'react';
import { api } from '../api.js';
import SearchableSelect from './SearchableSelect.jsx';

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

function TrashCanWasteIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9 9v6m6-6v6M4 6h16M8 6V4h8v2m-1 0-.6 13.4a2 2 0 0 1-2 1.9H9.6a2 2 0 0 1-2-1.9L7 6" /></svg>;
}

const CONVERSIONS = {
  volume: { base: 'ml', units: ['ml', 'l'], labels: { ml: 'ml', l: 'L' }, ml: 1, l: 1000 },
  weight: { base: 'g', units: ['g', 'kg'], labels: { g: 'g', kg: 'kg' }, g: 1, kg: 1000 },
  count: { base: 'pcs', units: ['pcs'], labels: { pcs: 'pcs' }, pcs: 1 }
};

const WASTAGE_REASONS = ['Spoiled / expired', 'Spilled / dropped', 'Over-prepared', 'Mistake / wrong order', 'Staff meal', 'Other'];

export default function StockTab({ ingredients, menuItems, reload }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('weight');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState('g');
  const [threshold, setThreshold] = useState('');
  const [thresholdUnit, setThresholdUnit] = useState('g');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [restockUnit, setRestockUnit] = useState('g');
  const [restockPaid, setRestockPaid] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('weight');
  const [editStock, setEditStock] = useState('');
  const [editStockUnit, setEditStockUnit] = useState('g');
  const [editThreshold, setEditThreshold] = useState('');
  const [editThresholdUnit, setEditThresholdUnit] = useState('g');
  const [editCost, setEditCost] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteUnit, setWasteUnit] = useState('g');
  const [wasteReason, setWasteReason] = useState(WASTAGE_REASONS[0]);
  const [wasteNote, setWasteNote] = useState('');

  function costPerDisplayUnit(ing) {
    const factor = CONVERSIONS[ing.category]?.[ing.unit] || 1;
    return Math.round(ing.costPerUnit * factor * 100) / 100;
  }

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
        thresholdUnit,
        cost: Number(cost) || 0
      });
      setName(''); setStock(''); setThreshold(''); setCost(''); setError('');
      const defUnit = CONVERSIONS[category].units[0];
      setStockUnit(defUnit);
      setThresholdUnit(defUnit);
      reload();
    } catch (e) { setError(e.message); }
  }

  function requestRestock(id, name, currentStock, ingredientUnit, category) {
    setRestockAmount('');
    setRestockUnit(ingredientUnit);
    setRestockPaid('');
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
      await api.restockIngredient(id, amount, restockUnit, restockPaid !== '' ? Number(restockPaid) : undefined);
      reload();
      const label = CONVERSIONS[toast.category]?.labels[restockUnit] || restockUnit;
      const costNote = restockPaid !== '' ? ' Cost per unit updated.' : '';
      setToast({ type: 'success', message: `${amount} ${label} added to ${name}.${costNote}` });
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
    setEditCost(costPerDisplayUnit(ing));
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
        thresholdUnit: editThresholdUnit,
        cost: Number(editCost) || 0
      });
      reload();
      setToast({ type: 'success', message: `Ingredient updated successfully.` });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  function requestWaste(ing) {
    setWasteAmount('');
    setWasteUnit(ing.unit);
    setWasteReason(WASTAGE_REASONS[0]);
    setWasteNote('');
    setToast({ type: 'waste', id: ing._id, name: ing.name, currentStock: ing.stock, unit: ing.unit, category: ing.category });
  }

  async function logWaste() {
    const amount = Number(wasteAmount);
    if (!wasteAmount || Number.isNaN(amount) || amount <= 0) {
      setToast({ type: 'error', message: 'Enter a positive amount to log as waste.' });
      return;
    }
    const { id, name } = toast;
    setToast(null);
    try {
      const result = await api.logWastage({
        ingredientId: id,
        amount,
        amountUnit: wasteUnit,
        reason: wasteReason,
        note: wasteNote
      });
      reload();
      const costNote = result.log.costImpact > 0 ? ` (cost impact: ${result.log.costImpact})` : '';
      setToast({ type: 'success', message: `Logged waste for ${name}: ${wasteReason}${costNote}.` });
    } catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  return (
    <div>
      <div className="card">
        <h2>Add an ingredient</h2>
        {/* Ingredient Name & Category Row */}
        <div className="row field-gap">
          <div>
            <label htmlFor="add-name">Ingredient name</label>
            <input id="add-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Egg" />
          </div>
          <div style={{ flex: 0.6 }}>
            <label htmlFor="add-category">Category</label>
            <SearchableSelect
              value={category}
              onChange={handleCategoryChange}
              options={[
                { value: 'volume', label: 'Volume' },
                { value: 'weight', label: 'Weight' },
                { value: 'count', label: 'Count' }
              ]}
              placeholder="Select category"
              showSearch={false}
            />
          </div>
        </div>

        {/* Quantities & Cost Row */}
        <div className="row field-gap">
          <div>
            <label htmlFor="add-stock">Starting stock</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input id="add-stock" type="number" min="0" step="0.1" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={{ flex: 1, minWidth: 0 }} />
              <select value={stockUnit} onChange={e => setStockUnit(e.target.value)} style={{ width: 'auto', flex: 'none', minWidth: 'fit-content' }}>
                {CONVERSIONS[category].units.map(u => (
                  <option key={u} value={u}>{CONVERSIONS[category].labels[u]}</option>
                ))}
              </select>
            </div>
            <div className="field-hint" style={{ fontSize: '11px', color: 'var(--ink-dim)', marginTop: '3px', height: '15px' }}>
              {getConvertedPreview(stock, stockUnit, category) || ' '}
            </div>
          </div>

          <div>
            <label htmlFor="add-threshold">Min threshold</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input id="add-threshold" type="number" min="0" step="0.1" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="0" style={{ flex: 1, minWidth: 0 }} />
              <select value={thresholdUnit} onChange={e => setThresholdUnit(e.target.value)} style={{ width: 'auto', flex: 'none', minWidth: 'fit-content' }}>
                {CONVERSIONS[category].units.map(u => (
                  <option key={u} value={u}>{CONVERSIONS[category].labels[u]}</option>
                ))}
              </select>
            </div>
            <div className="field-hint" style={{ fontSize: '11px', color: 'var(--ink-dim)', marginTop: '3px', height: '15px' }}>
              {getConvertedPreview(threshold, thresholdUnit, category) || ' '}
            </div>
          </div>

          <div>
            <label htmlFor="add-cost">Cost per {CONVERSIONS[category].labels[stockUnit]}</label>
            <input id="add-cost" type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            <div className="field-hint" style={{ fontSize: '11px', color: 'var(--ink-dim)', marginTop: '3px', height: '15px' }}> </div>
          </div>
        </div>

        <div className="divider"></div>
        <button className="btn primary" onClick={addIngredient}>Add ingredient</button>

        {error && <p style={{ color: 'var(--clay)', fontSize: 13 }}>{error}</p>}
      </div>

      <div className="card">
        <h2>Current stock</h2>
        {ingredients.length === 0 && <div className="empty-note">No ingredients yet. Add one above.</div>}
        {ingredients.map(ing => {
          const isLow = ing.stock <= ing.threshold;
          return (
            <div className={`ing-card ${isLow ? 'low-stock' : 'normal-stock'}`} key={ing._id}>
              <div className="ing-card-header">
                <div className="ing-info">
                  <span className="ing-name">
                    {ing.name}
                    {isLow && <span className="low-badge-tag">Low Stock</span>}
                  </span>
                  <div className="ing-meta">
                    <span>{ing.unit}</span>
                    <span>Min: {ing.threshold}</span>
                    <span>Cost: {costPerDisplayUnit(ing)}/{CONVERSIONS[ing.category]?.labels[ing.unit] || ing.unit}</span>
                  </div>
                </div>
                <span className={`ing-stock-badge ${isLow ? 'low' : 'ok'}`}>
                  <span className="stock-val">{Math.round(ing.stock * 100) / 100}</span>
                  <span className="stock-unit">{ing.unit}</span>
                </span>
              </div>
              <div className="ing-card-actions">
                <button className="icon-btn" onClick={() => requestEdit(ing)} aria-label={`Edit ${ing.name}`} title="Edit"><EditIcon /></button>
                <button className="icon-btn" onClick={() => requestRestock(ing._id, ing.name, ing.stock, ing.unit, ing.category)} aria-label={`Restock ${ing.name}`} title="Restock"><PlusIcon /></button>
                <button className="icon-btn danger" onClick={() => requestWaste(ing)} aria-label={`Log waste for ${ing.name}`} title="Log waste"><TrashCanWasteIcon /></button>
                <button className="icon-btn danger" onClick={() => requestDelete(ing._id, ing.name)} aria-label={`Delete ${ing.name}`} title="Delete ingredient"><TrashIcon /></button>
              </div>
            </div>
          );
        })}
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

            <div className="field-gap">
              <label htmlFor="restock-paid">Total paid for this delivery (optional)</label>
              <input id="restock-paid" type="number" min="0" step="0.01" placeholder="0.00" value={restockPaid} onChange={e => setRestockPaid(e.target.value)} />
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                If given, cost per unit is recalculated as a weighted average with what's already in stock.
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
              <SearchableSelect
                value={editCategory}
                onChange={handleEditCategoryChange}
                options={[
                  { value: 'volume', label: 'Volume' },
                  { value: 'weight', label: 'Weight' },
                  { value: 'count', label: 'Count' }
                ]}
                placeholder="Select category"
                showSearch={false}
              />
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

            <div className="field-gap">
              <label htmlFor="edit-cost">Cost per {CONVERSIONS[editCategory]?.labels[editStockUnit]}</label>
              <input id="edit-cost" type="number" min="0" step="0.01" value={editCost} onChange={e => setEditCost(e.target.value)} />
            </div>

            <div className="stock-modal-actions">
              <button type="button" className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save changes</button>
            </div>
          </form>
        </div>
      )}
      {toast?.type === 'waste' && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setToast(null)}>
          <form className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="waste-title" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); logWaste(); }}>
            <p className="stock-modal-eyebrow">LOG WASTE</p>
            <h2 id="waste-title">Log waste for {toast.name}</h2>
            <p className="stock-modal-current">Current stock: <strong>{Math.round(toast.currentStock * 100) / 100} {CONVERSIONS[toast.category]?.labels[toast.unit] || toast.unit}</strong></p>

            <div className="field-gap">
              <label htmlFor="waste-amount">Amount lost</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="waste-amount" autoFocus type="number" min="0" step="0.1" placeholder="0" value={wasteAmount} onChange={e => setWasteAmount(e.target.value)} style={{ flex: 1 }} />
                <select value={wasteUnit} onChange={e => setWasteUnit(e.target.value)} style={{ width: 'auto', flex: 'none' }}>
                  {CONVERSIONS[toast.category]?.units.map(u => (
                    <option key={u} value={u}>{CONVERSIONS[toast.category]?.labels[u]}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                {getConvertedPreview(wasteAmount, wasteUnit, toast.category)}
              </div>
            </div>

            <div className="field-gap">
              <label htmlFor="waste-reason">Reason</label>
              <SearchableSelect
                value={wasteReason}
                onChange={setWasteReason}
                options={WASTAGE_REASONS.map(r => ({ value: r, label: r }))}
                placeholder="Select reason"
                showSearch={false}
              />
            </div>

            <div className="field-gap">
              <label htmlFor="waste-note">Note (optional)</label>
              <input id="waste-note" type="text" value={wasteNote} onChange={e => setWasteNote(e.target.value)} placeholder="e.g. left out overnight" />
            </div>

            <div className="stock-modal-actions">
              <button type="button" className="btn" onClick={() => setToast(null)}>Cancel</button>
              <button type="submit" className="btn danger-btn"><TrashCanWasteIcon /> Log waste</button>
            </div>
          </form>
        </div>
      )}
      {toast && toast.type !== 'restock' && toast.type !== 'waste' && (
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