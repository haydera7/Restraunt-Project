import express from 'express';
import Ingredient from '../models/Ingredient.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

export const CONVERSIONS = {
  volume: { base: 'ml', ml: 1, l: 1000, L: 1000 },
  weight: { base: 'g', g: 1, kg: 1000 },
  count: { base: 'pcs', pcs: 1, pc: 1 }
};

export function convertToBase(qty, unit, category) {
  const cat = CONVERSIONS[category];
  if (!cat) throw new Error(`Invalid category: ${category}`);
  const factor = cat[unit];
  if (!factor) throw new Error(`Invalid unit ${unit} for category ${category}`);
  return qty * factor;
}

router.get('/', async (req, res) => {
  const ingredients = await Ingredient.find().sort({ name: 1 });
  res.json(ingredients);
});

router.post('/', async (req, res) => {
  const { name, category, stock, stockUnit, threshold, thresholdUnit, cost } = req.body;
  if (!name || !category || !stockUnit || !thresholdUnit) {
    return res.status(400).json({ error: 'name, category, stockUnit, and thresholdUnit are required' });
  }
  const baseUnit = CONVERSIONS[category]?.base;
  if (!baseUnit) {
    return res.status(400).json({ error: `Invalid category: ${category}` });
  }

  try {
    const baseStock = convertToBase(Number(stock) || 0, stockUnit, category);
    const baseThreshold = convertToBase(Number(threshold) || 0, thresholdUnit, category);
    // `cost` is entered as "cost per stockUnit" (e.g. birr per kg) — convert
    // down to cost per base unit the same way stock and threshold are.
    const costPerUnit = cost ? Number(cost) / CONVERSIONS[category][stockUnit] : 0;

    const ingredient = await Ingredient.create({
      name,
      category,
      unit: baseUnit,
      stock: baseStock,
      threshold: baseThreshold,
      costPerUnit
    });
    res.status(201).json(ingredient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/restock', async (req, res) => {
  const { amount, amountUnit, totalPaid } = req.body;
  const n = Number(amount);
  if (!n || n <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  if (!amountUnit) return res.status(400).json({ error: 'amountUnit is required' });

  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'ingredient not found' });

    const baseAmount = convertToBase(n, amountUnit, ingredient.category);

    // If the owner tells us what this delivery cost in total, blend it into
    // the existing cost as a weighted average — so costPerUnit reflects a
    // realistic blend of old and new stock instead of jumping to the latest
    // price alone.
    if (totalPaid !== undefined && totalPaid !== null && totalPaid !== '') {
      const paid = Number(totalPaid);
      if (isNaN(paid) || paid < 0) return res.status(400).json({ error: 'totalPaid must be a non-negative number' });
      const existingValue = ingredient.stock * ingredient.costPerUnit;
      const newTotalStock = ingredient.stock + baseAmount;
      ingredient.costPerUnit = newTotalStock > 0
        ? Math.round(((existingValue + paid) / newTotalStock) * 10000) / 10000
        : ingredient.costPerUnit;
    }

    ingredient.stock += baseAmount;
    await ingredient.save();
    res.json(ingredient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, category, stock, stockUnit, threshold, thresholdUnit, cost } = req.body;
  if (!name || !category || !stockUnit || !thresholdUnit) {
    return res.status(400).json({ error: 'name, category, stockUnit, and thresholdUnit are required' });
  }
  const baseUnit = CONVERSIONS[category]?.base;
  if (!baseUnit) {
    return res.status(400).json({ error: `Invalid category: ${category}` });
  }

  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'ingredient not found' });

    const baseStock = convertToBase(Number(stock) || 0, stockUnit, category);
    const baseThreshold = convertToBase(Number(threshold) || 0, thresholdUnit, category);

    ingredient.name = name;
    ingredient.category = category;
    ingredient.unit = baseUnit;
    ingredient.stock = baseStock;
    ingredient.threshold = baseThreshold;
    if (cost !== undefined && cost !== null && cost !== '') {
      ingredient.costPerUnit = Number(cost) / CONVERSIONS[category][stockUnit];
    }

    await ingredient.save();
    res.json(ingredient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const inUse = await MenuItem.exists({ 'recipe.ingredient': req.params.id });
  if (inUse) return res.status(409).json({ error: 'ingredient is used in a recipe, remove it there first' });
  await Ingredient.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;