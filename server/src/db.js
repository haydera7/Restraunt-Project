import mongoose from 'mongoose';

let isConnected = false;

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
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
