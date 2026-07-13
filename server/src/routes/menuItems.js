import express from 'express';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

function withCosting(itemDoc) {
  const item = itemDoc.toObject();
  const costToMake = item.recipe.reduce((sum, line) => {
    const costPerUnit = line.ingredient?.costPerUnit || 0;
    return sum + costPerUnit * line.qty;
  }, 0);
  item.costToMake = Math.round(costToMake * 100) / 100;
  item.profit = Math.round((item.price - item.costToMake) * 100) / 100;
  item.marginPct = item.price > 0 ? Math.round((item.profit / item.price) * 1000) / 10 : 0;
  return item;
}

router.get('/', async (req, res) => {
  const items = await MenuItem.find().populate('recipe.ingredient').sort({ name: 1 });
  res.json(items.map(withCosting));
});

router.post('/', async (req, res) => {
  const { name, price, recipe } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ error: 'a valid price is required' });
  }
  if (!Array.isArray(recipe) || recipe.length === 0) {
    return res.status(400).json({ error: 'recipe must have at least one ingredient line' });
  }
  const item = await MenuItem.create({ name, price: Number(price), recipe });
  await item.populate('recipe.ingredient');
  res.status(201).json(withCosting(item));
});

router.put('/:id', async (req, res) => {
  const { name, price, recipe } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    return res.status(400).json({ error: 'a valid price is required' });
  }
  if (!Array.isArray(recipe) || recipe.length === 0) {
    return res.status(400).json({ error: 'recipe must have at least one ingredient line' });
  }

  const item = await MenuItem.findByIdAndUpdate(
    req.params.id,
    { name: name.trim(), price: Number(price), recipe },
    { new: true, runValidators: true }
  ).populate('recipe.ingredient');
  if (!item) return res.status(404).json({ error: 'menu item not found' });
  res.json(withCosting(item));
});

router.delete('/:id', async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;