import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.PORTAL_MONGODB_URI;
const DATABASE_NAME = process.env.PORTAL_DATABASE_NAME || 'company_portal';

if (!MONGODB_URI) {
  throw new Error('Please define the PORTAL_MONGODB_URI environment variable');
}

// MongoDB Native Client (for direct operations)
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

// Get database instance
export async function getPortalDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DATABASE_NAME);
}

// Mongoose connection for models
let isConnected = false;

export async function connectToPortalMongoDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI!, {
      dbName: DATABASE_NAME,
    });
    isConnected = true;
    console.log('✅ Connected to Portal MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default clientPromise; 