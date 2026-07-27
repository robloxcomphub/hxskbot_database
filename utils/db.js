const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Connects to MongoDB Atlas once and reuses the connection for the life of
 * the process. Call this early (before the bot logs in) and await it.
 */
async function connectDB() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add your MongoDB Atlas connection string to your environment variables.');
  }

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(process.env.MONGODB_DB_NAME || 'hxskbot');
  console.log('✅ Connected to MongoDB');
  return db;
}

/** Returns the connected database. Throws if connectDB() hasn't run yet. */
function getDB() {
  if (!db) {
    throw new Error('Database not connected yet — connectDB() must be awaited before getDB() is used.');
  }
  return db;
}

module.exports = { connectDB, getDB };
