import mongoose from "mongoose"

const MONGODB_URI = "mongodb://root:pNjqJR1oro7I6aU6YjtXlSPg@denali.liara.cloud:31986/my-app?authSource=admin";
// const MONGODB_URI = "mongodb://localhost:27017/salam";

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
      maxPoolSize: 10, // Connection pool size for better performance
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log("MongoDB محلی با موفقیت متصل شد!");
      
      // Import all models in parallel for better performance
      await Promise.all([
        import("@/lib/models/User"),
        import("@/lib/models/Session"),
        import("@/lib/models/Task"),
        import("@/lib/models/Announcement"),
        import("@/lib/models/Notification"),
        import("@/lib/models/Message"),
        import("@/lib/models/ChatGroup"),
        import("@/lib/models/ChatGroupTask"),
        import("@/lib/models/GroupMessage"),
        import("@/lib/models/DirectMessage"),
        import("@/lib/models/archive.model"),
        import("@/lib/models/project.model"),
        import("@/lib/models/project-section.model"),
        import("@/lib/models/project-income.model"),
        import("@/lib/models/project-tax.model"),
        import("@/lib/models/project-commission.model"),
        import("@/lib/models/user-commission.model"),
        import("@/lib/models/employee-salary.model"),
        import("@/lib/models/team-member.model"),
        import("@/lib/models/section-weights.model"),
        import("@/lib/models/system-percentages.model"),
        import("@/lib/models/system-expenses.model"),
        import("@/lib/models/guest-referral.model"),
        import("@/lib/models/purchase-details.model"),
        import("@/lib/models/sale-details.model"),
        import("@/lib/models/design-details.model"),
        import("@/lib/models/contracting-details.model"),
        import("@/lib/models/consultation-details.model"),
        import("@/lib/models/collaboration-details.model"),
      ])
      
      return mongoose;
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
