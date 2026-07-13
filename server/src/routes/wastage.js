import express from 'express';
import Ingredient from '../models/Ingredient.js';
import WastageLog, { WASTAGE_REASONS } from '../models/WastageLog.js';
import { convertToBase } from './ingredients.js';

const router = express.Router();

router.get('/reasons', (req, res) => res.json(WASTAGE_REASONS));

// Log wasted ingredient — deducts stock the same way a sale would, but is
// tagged with a reason instead of being tied to a menu item.
router.post('/', async (req, res) => {
    const { ingredientId, amount, amountUnit, reason, note } = req.body;
    const n = Number(amount);
    if (!n || n <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
    if (!amountUnit) return res.status(400).json({ error: 'amountUnit is required' });
    if (!reason || !WASTAGE_REASONS.includes(reason)) {
        return res.status(400).json({ error: `reason must be one of: ${WASTAGE_REASONS.join(', ')}` });
    }

    try {
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) return res.status(404).json({ error: 'ingredient not found' });

        const baseAmount = convertToBase(n, amountUnit, ingredient.category);
        if (baseAmount > ingredient.stock) {
            return res.status(400).json({
                error: `Cannot waste ${baseAmount} ${ingredient.unit} of ${ingredient.name}: only ${Math.round(ingredient.stock * 100) / 100} ${ingredient.unit} in stock.`
            });
        }

        const costImpact = Math.round(baseAmount * (ingredient.costPerUnit || 0) * 100) / 100;

        ingredient.stock = Math.round((ingredient.stock - baseAmount) * 100) / 100;
        await ingredient.save();

        const log = await WastageLog.create({
            ingredient: ingredient._id,
            name: ingredient.name,
            unit: ingredient.unit,
            qty: baseAmount,
            costPerUnit: ingredient.costPerUnit || 0,
            costImpact,
            reason,
            note: note || ''
        });

        res.status(201).json({ log, remainingStock: ingredient.stock });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
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

    const logs = await WastageLog.find(Object.keys(dateFilter).length ? { date: dateFilter } : {})
        .sort({ date: -1 })
        .limit(100);
    res.json(logs);
});

router.delete('/history/:id', async (req, res) => {
    const log = await WastageLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'wastage record not found' });
    res.status(204).end();
});

export default router;