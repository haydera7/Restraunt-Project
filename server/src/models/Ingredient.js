import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, enum: ['g', 'kg', 'ml', 'l', 'pcs'] },
  stock: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.model('Ingredient', ingredientSchema);
