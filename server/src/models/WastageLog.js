import mongoose from 'mongoose';

export const WASTAGE_REASONS = [
    'Spoiled / expired',
    'Spilled / dropped',
    'Over-prepared',
    'Mistake / wrong order',
    'Staff meal',
    'Other'
];

const wastageLogSchema = new mongoose.Schema({
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
    name: String,
    unit: String,
    qty: { type: Number, required: true },
    costPerUnit: { type: Number, default: 0 },
    costImpact: { type: Number, default: 0 },
    reason: { type: String, required: true, enum: WASTAGE_REASONS },
    note: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now }
});

export default mongoose.model('WastageLog', wastageLogSchema);