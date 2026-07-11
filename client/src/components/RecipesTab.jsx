import React, { useState } from 'react';
import { api } from '../api.js';

function PencilIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export default function RecipesTab({ ingredients, menuItems, reload }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editRows, setEditRows] = useState([]);
  const [editError, setEditError] = useState('');
  const [toast, setToast] = useState(null);

  function addRow() {
    if (ingredients.length === 0) { setToast({ type: 'error', message: 'Add at least one ingredient in the Stock tab first.' }); return; }
    setRows([...rows, { ingredientId: ingredients[0]._id, qty: '' }]);
  }
  function updateRow(idx, field, value) {
    const next = [...rows];
    next[idx][field] = value;
    setRows(next);
  }
  function removeRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  async function save() {
    const recipe = rows
      .filter(r => r.ingredientId && Number(r.qty) > 0)
      .map(r => ({ ingredient: r.ingredientId, qty: Number(r.qty) }));
    if (!name.trim()) { setError('Give the menu item a name.'); return; }
    if (price === '' || Number(price) < 0 || isNaN(price)) { setError('Give the menu item a valid price.'); return; }
    if (recipe.length === 0) { setError('Add at least one ingredient with an amount.'); return; }
    try {
      await api.addMenuItem({ name: name.trim(), price: Number(price), recipe });
      setName(''); setPrice(''); setRows([]); setError('');
      reload();
    } catch (e) { setError(e.message); }
  }

  function requestDelete(id, name) {
    setToast({ type: 'confirm', id, name, message: `Delete "${name}"? This cannot be undone.` });
  }

  async function remove() {
    const { id } = toast;
    setToast(null);
    try { await api.deleteMenuItem(id); reload(); }
    catch (e) { setToast({ type: 'error', message: e.message }); }
  }

  function startEdit(item) {
    setEditingId(item._id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditRows(item.recipe.map(line => ({
      ingredientId: line.ingredient?._id || line.ingredient,
      qty: line.qty
    })));
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError('');
  }

  function updateEditRow(idx, field, value) {
    setEditRows(editRows.map((row, index) => index === idx ? { ...row, [field]: value } : row));
  }

  function addEditRow() {
    if (ingredients.length === 0) return;
    setEditRows([...editRows, { ingredientId: ingredients[0]._id, qty: '' }]);
  }

  async function saveEdit() {
    const recipe = editRows
      .filter(row => row.ingredientId && Number(row.qty) > 0)
      .map(row => ({ ingredient: row.ingredientId, qty: Number(row.qty) }));
    if (!editName.trim()) { setEditError('Give the menu item a name.'); return; }
    if (editPrice === '' || Number(editPrice) < 0 || isNaN(editPrice)) { setEditError('Give the menu item a valid price.'); return; }
    if (recipe.length === 0) { setEditError('Add at least one ingredient with an amount.'); return; }
    try {
      await api.updateMenuItem(editingId, { name: editName.trim(), price: Number(editPrice), recipe });
      cancelEdit();
      reload();
    } catch (e) { setEditError(e.message); }
  }

  return (
    <div>
      <div className="card">
        <h2>Add a menu item</h2>
        <div className="row field-gap">
          <div>
            <label>Item name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pizza" />
          </div>
          <div style={{ flex: 0.6 }}>
            <label>Price</label>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <label>Ingredients used per one item</label>
        {rows.map((r, idx) => (
          <div className="builder-row" key={idx}>
            <div className="sel">
              <select value={r.ingredientId} onChange={e => updateRow(idx, 'ingredientId', e.target.value)}>
                {ingredients.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </div>
            <div className="qty">
              <input type="number" min="0" step="0.1" placeholder="amount" value={r.qty}
                onChange={e => updateRow(idx, 'qty', e.target.value)} />
            </div>
            <button className="btn ghost" onClick={() => removeRow(idx)} aria-label="Remove row">&times;</button>
          </div>
        ))}
        <button className="btn" style={{ margin: '6px 0 14px' }} onClick={addRow}>+ Add ingredient</button>
        <div className="divider"></div>
        <button className="btn primary" onClick={save}>Save menu item</button>
        {error && <p style={{ color: 'var(--clay)', fontSize: 13 }}>{error}</p>}
      </div>

      <div className="card">
        <h2>Your menu items</h2>
        {menuItems.length === 0 && <div className="empty-note">No menu items yet. Add one above.</div>}
        {menuItems.map(m => (
          <div className="recipe-item" key={m._id}>
            <div className="title-row">
              <span className="name">{m.name} <span className="stock-num" style={{ fontWeight: 400, fontSize: 13 }}>— {m.price}</span></span>
              <div className="item-actions">
                <button className="icon-btn" onClick={() => startEdit(m)} aria-label={`Edit ${m.name}`} title="Edit menu item"><PencilIcon /></button>
                <button className="icon-btn danger" onClick={() => requestDelete(m._id, m.name)} aria-label={`Delete ${m.name}`} title="Delete menu item"><TrashIcon /></button>
              </div>
            </div>
            {editingId === m._id ? (
              <div className="recipe-editor">
                <div className="row field-gap">
                  <div>
                    <label>Item name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div style={{ flex: 0.6 }}>
                    <label>Price</label>
                    <input type="number" min="0" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                  </div>
                </div>
                <label>Ingredients used per one item</label>
                {editRows.map((row, index) => (
                  <div className="builder-row" key={index}>
                    <div className="sel">
                      <select value={row.ingredientId} onChange={e => updateEditRow(index, 'ingredientId', e.target.value)}>
                        {ingredients.map(ingredient => <option key={ingredient._id} value={ingredient._id}>{ingredient.name}</option>)}
                      </select>
                    </div>
                    <div className="qty">
                      <input type="number" min="0" step="0.1" value={row.qty} onChange={e => updateEditRow(index, 'qty', e.target.value)} />
                    </div>
                    <button className="btn ghost" onClick={() => setEditRows(editRows.filter((_, rowIndex) => rowIndex !== index))} aria-label="Remove ingredient">&times;</button>
                  </div>
                ))}
                <button className="btn" onClick={addEditRow}>+ Add ingredient</button>
                <div className="edit-actions">
                  <button className="btn primary" onClick={saveEdit}><CheckIcon /> Save changes</button>
                  <button className="btn" onClick={cancelEdit}>Cancel</button>
                </div>
                {editError && <p className="form-error">{editError}</p>}
              </div>
            ) : (
              <div className="recipe-list">
                {m.recipe.map((r, i) => (
                  <span key={i}>{r.qty} {r.ingredient?.unit} {r.ingredient?.name}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`} role={toast.type === 'confirm' ? 'alertdialog' : 'status'}>
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
