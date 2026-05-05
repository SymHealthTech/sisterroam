import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  // If the existing connection is alive, reuse it
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn

  // No in-flight promise — start one
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Clear so the next request gets a fresh attempt instead of the same rejection
    cached.promise = null
    cached.conn = null
    throw err
  }

  return cached.conn
}
