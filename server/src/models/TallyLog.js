import mongoose from 'mongoose';

const usageLineSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  name: String,
  unit: String,
  used: Number,
  before: Number,
  after: Number
}, { _id: false });

const soldLineSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  qty: Number,
  price: Number,
  lineTotal: Number,
  costPerItem: Number,
  lineCost: Number
}, { _id: false });

const tallyLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  sold: { type: [soldLineSchema], default: [] },
  usage: { type: [usageLineSchema], default: [] },
  totalRevenue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  grossProfit: { type: Number, default: 0 }
});

export default mongoose.model('TallyLog', tallyLogSchema);