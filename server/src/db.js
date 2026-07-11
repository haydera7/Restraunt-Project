import mongoose from 'mongoose';
import Ingredient from './models/Ingredient.js';
import User from './models/User.js';

let isConnected = false;

function normalizePhone(raw) {
  const s = String(raw || '').trim().replace(/\s+/g, '');
  let digits;
  if (s.startsWith('+251')) digits = s.slice(4);
  else if (s.startsWith('251')) digits = s.slice(3);
  else if (s.startsWith('0')) digits = s.slice(1);
  else digits = s;
  if (!/^\d{9}$/.test(digits)) return null;
  return '+251' + digits;
}

export async function connectDB() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Please define the MONGO_URI environment variable inside Vercel');
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB connected');

    // Run migration for legacy ingredients without category
    try {
      const legacyCount = await Ingredient.countDocuments({ category: { $exists: false } });
      if (legacyCount > 0) {
        console.log(`Running database migration for ${legacyCount} legacy ingredients...`);
        const legacyIngredients = await Ingredient.find({ category: { $exists: false } });
        for (const ing of legacyIngredients) {
          const rawUnit = ing.get('unit');
          const currentStock = ing.stock || 0;
          const currentThreshold = ing.threshold || 0;

          if (rawUnit === 'kg') {
            ing.stock = currentStock * 1000;
            ing.threshold = currentThreshold * 1000;
            ing.unit = 'g';
            ing.category = 'weight';
          } else if (rawUnit === 'l') {
            ing.stock = currentStock * 1000;
            ing.threshold = currentThreshold * 1000;
            ing.unit = 'ml';
            ing.category = 'volume';
          } else if (rawUnit === 'g') {
            ing.category = 'weight';
            ing.unit = 'g';
          } else if (rawUnit === 'ml') {
            ing.category = 'volume';
            ing.unit = 'ml';
          } else {
            ing.category = 'count';
            ing.unit = 'pcs';
          }
          await ing.save();
        }
        console.log('Database migration completed successfully!');
      }
    } catch (migErr) {
      console.error('Database migration failed:', migErr);
    }

    // Migrate legacy phone numbers: normalize all to +251XXXXXXXXX format
    try {
      const users = await User.find({});
      let phoneMigrated = 0;
      for (const u of users) {
        const normalized = normalizePhone(u.phone);
        if (normalized && normalized !== u.phone) {
          // Check no conflict before updating
          const conflict = await User.exists({ phone: normalized, _id: { $ne: u._id } });
          if (!conflict) {
            u.phone = normalized;
            await u.save();
            phoneMigrated++;
          }
        }
      }
      if (phoneMigrated > 0) {
        console.log(`Phone migration: normalized ${phoneMigrated} user phone numbers to +251 format.`);
      }
    } catch (phoneMigErr) {
      console.error('Phone migration failed:', phoneMigErr);
    }

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
