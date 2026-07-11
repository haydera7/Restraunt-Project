import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';

dotenv.config();

const [phone, password, role = 'owner'] = process.argv.slice(2);
if (!phone || !password) {
  console.error('Usage: npm run create-user -- <phone> <temporary-password> [owner|staff]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

await connectDB();
const existing = await User.findOne({ phone: phone.trim() });
if (existing) {
  console.error('A user with that phone number already exists.');
  await mongoose.disconnect();
  process.exit(1);
}
await User.create({ phone: phone.trim(), passwordHash: await bcrypt.hash(password, 12), role });
console.log(`Created ${role} account for ${phone}.`);
await mongoose.disconnect();
