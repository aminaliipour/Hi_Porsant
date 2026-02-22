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
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log("MongoDB محلی با موفقیت متصل شد!");
      
      // Import all models to ensure they are registered
      await import("@/lib/models/User")
      await import("@/lib/models/Session")
      await import("@/lib/models/Task")
      await import("@/lib/models/Announcement")
      await import("@/lib/models/Notification")
      await import("@/lib/models/Message")
      await import("@/lib/models/ChatGroup")
      await import("@/lib/models/ChatGroupTask")
      await import("@/lib/models/GroupMessage")
      await import("@/lib/models/DirectMessage")
      await import("@/lib/models/archive.model")
      await import("@/lib/models/project.model")
      await import("@/lib/models/project-section.model")
      await import("@/lib/models/project-income.model")
      await import("@/lib/models/project-tax.model")
      await import("@/lib/models/project-commission.model")
      await import("@/lib/models/user-commission.model")
      await import("@/lib/models/employee-salary.model")
      await import("@/lib/models/team-member.model")
      await import("@/lib/models/section-weights.model")
      await import("@/lib/models/system-percentages.model")
      await import("@/lib/models/system-expenses.model")
      await import("@/lib/models/guest-referral.model")
      await import("@/lib/models/purchase-details.model")
      await import("@/lib/models/sale-details.model")
      await import("@/lib/models/design-details.model")
      await import("@/lib/models/contracting-details.model")
      await import("@/lib/models/consultation-details.model")
      await import("@/lib/models/collaboration-details.model")
      
      return mongoose;
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
