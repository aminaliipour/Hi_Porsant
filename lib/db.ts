import mongoose from "mongoose"

// const MONGODB_URI = "mongodb://root:pNjqJR1oro7I6aU6YjtXlSPg@denali.liara.cloud:31986/my-app?authSource=admin";
const MONGODB_URI = "mongodb://localhost:27017/my-app";

if (!MONGODB_URI) {
  throw new Error("لطفاً متغیر محیطی MONGODB_URI را تنظیم کنید");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

declare global {
  var mongoose: {
    conn: typeof import("mongoose") | null;
    promise: Promise<typeof import("mongoose")> | null;
  };
}

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
