import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  category: { type: String, required: true, enum: ['weight', 'volume', 'count'] },
  unit: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  threshold: { type: Number, required: true, default: 0 },
  costPerUnit: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Ingredient', ingredientSchema);