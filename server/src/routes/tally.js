import express from 'express';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Ingredient from '../models/Ingredient.js';
import TallyLog from '../models/TallyLog.js';

const router = express.Router();

// entries: [{ menuItemId, qty }]
router.post('/process', async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries is required' });
  }

  const menuItems = await MenuItem.find({
    _id: { $in: entries.map(e => e.menuItemId) }
  }).populate('recipe.ingredient');

  const usageMap = new Map();
  const soldLines = [];
  let totalRevenue = 0;

  for (const entry of entries) {
    const item = menuItems.find(m => m._id.toString() === entry.menuItemId);
    if (!item) continue;
    const qty = Number(entry.qty) || 0;
    const lineTotal = Math.round(item.price * qty * 100) / 100;
    totalRevenue += lineTotal;
    soldLines.push({ menuItem: item._id, name: item.name, qty, price: item.price, lineTotal });
    for (const line of item.recipe) {
      const key = line.ingredient._id.toString();
      const prev = usageMap.get(key) || { ingredient: line.ingredient, used: 0 };
      prev.used += line.qty * qty;
      usageMap.set(key, prev);
    }
  }

  const ingredientIds = [...usageMap.keys()];
  const freshIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
  const ingredientsById = new Map(freshIngredients.map(ingredient => [ingredient._id.toString(), ingredient]));
  const shortages = [];
  for (const [id, { ingredient, used }] of usageMap.entries()) {
    const fresh = ingredientsById.get(id);
    if (!fresh) shortages.push(`${ingredient.name} is unavailable`);
    else if (fresh.stock < used) shortages.push(`${fresh.name} is short by ${Math.round((used - fresh.stock) * 100) / 100} ${fresh.unit}`);
  }
  if (shortages.length) {
    return res.status(400).json({ error: `Cannot process tally: ${shortages.join(', ')}` });
  }

  const usageResults = [];
  for (const [id, { ingredient, used }] of usageMap.entries()) {
    const fresh = ingredientsById.get(id);
    const before = fresh.stock;
    const after = Math.round((before - used) * 100) / 100;
    fresh.stock = after;
    await fresh.save();
    usageResults.push({
      ingredient: fresh._id,
      name: fresh.name,
      unit: fresh.unit,
      used: Math.round(used * 100) / 100,
      before: Math.round(before * 100) / 100,
      after
    });
  }

  const log = await TallyLog.create({
    sold: soldLines,
    usage: usageResults,
    totalRevenue: Math.round(totalRevenue * 100) / 100
  });
  res.status(201).json(log);
});

router.get('/history', async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};

  if (from) {
    const start = new Date(`${from}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ error: 'from must be a valid date' });
    dateFilter.$gte = start;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999Z`);
    if (Number.isNaN(end.getTime())) return res.status(400).json({ error: 'to must be a valid date' });
    dateFilter.$lte = end;
  }
  if (from && to && dateFilter.$gte > dateFilter.$lte) {
    return res.status(400).json({ error: 'from date must be before to date' });
  }

  const logs = await TallyLog.find(Object.keys(dateFilter).length ? { date: dateFilter } : {})
    .sort({ date: -1 })
    .limit(100);
  res.json(logs);
});

router.delete('/history/:id', async (req, res) => {
  const log = await TallyLog.findByIdAndDelete(req.params.id);
  if (!log) return res.status(404).json({ error: 'tally history record not found' });
  res.status(204).end();
});

export default router;
