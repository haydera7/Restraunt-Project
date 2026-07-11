import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['volume', 'weight', 'count'] },
  unit: { type: String, required: true, enum: ['g', 'ml', 'pcs'] },
  stock: { type: Number, required: true, default: 0 },
  threshold: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.model('Ingredient', ingredientSchema);
