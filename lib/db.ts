import mongoose from "mongoose"

// MongoDB Local Connection String
const MONGODB_URI = "mongodb://localhost:27017/taadol-db";

if (!MONGODB_URI) {
  throw new Error("لطفاً متغیر محیطی MONGODB_URI را تنظیم کنید");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("MongoDB محلی با موفقیت متصل شد!");
      return mongoose;
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect

// Extend the NodeJS.Global interface to include mongoose
declare global {
  namespace NodeJS {
    interface Global {
      mongoose: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      };
    }
  }
}

export {}; // Ensure this file is treated as a module
