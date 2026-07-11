import mongoose from 'mongoose';

const recipeLineSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  qty: { type: Number, required: true }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  recipe: { type: [recipeLineSchema], default: [] }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);