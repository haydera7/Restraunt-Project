import express from 'express';
import Ingredient from '../models/Ingredient.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 });
  res.json(ingredients);
});

router.post('/', async (req, res) => {
  const { name, unit, stock } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'name and unit are required' });
  const ingredient = await Ingredient.create({ name, unit, stock: Number(stock) || 0 });
  res.status(201).json(ingredient);
});

router.put('/:id/restock', async (req, res) => {
  const { amount } = req.body;
  const n = Number(amount);
  if (!n || n <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  const ingredient = await Ingredient.findById(req.params.id);
  if (!ingredient) return res.status(404).json({ error: 'ingredient not found' });
  ingredient.stock += n;
  await ingredient.save();
  res.json(ingredient);
});

router.delete('/:id', async (req, res) => {
  const inUse = await MenuItem.exists({ 'recipe.ingredient': req.params.id });
  if (inUse) return res.status(409).json({ error: 'ingredient is used in a recipe, remove it there first' });
  await Ingredient.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
