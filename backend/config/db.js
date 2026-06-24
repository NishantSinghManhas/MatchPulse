import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchpulse';
    console.log(`Connecting to MongoDB at ${connUri}...`);
    
    mongoose.set('strictQuery', false);
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000, // Quick timeout to fallback fast
    });
    
    isConnected = true;
    console.log('MongoDB Connected successfully!');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to file-based database store (matches_db.json).');
    isConnected = false;
  }
};

export const getDbStatus = () => isConnected;
