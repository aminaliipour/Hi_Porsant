import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"

async function getUser(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  if (!token) return null
  await dbConnect()
  const session = await Session.findOne({ token }).populate("userId")
  return session?.userId
}

/**
 * Sync endpoint for synchronizing users between collections
 * This ensures that users added in either User Management or Porsant Team
 * are visible in both places
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    await dbConnect()

    // Since we've unified both sections to use the User collection,
    // we just need to verify all users are properly formatted
    const users = await User.find()

    let syncedCount = 0
    const errors: string[] = []

    // Check and fix any incomplete user records
    for (const userData of users) {
      try {
        // Ensure all required fields have values
        const updates: any = {}
        
        if (!userData.jobTitle) updates.jobTitle = "تعیین نشده"
        if (!userData.fatherName) updates.fatherName = ""
        if (!userData.phoneNumber) updates.phoneNumber = ""
        if (!userData.email) updates.email = ""

        if (Object.keys(updates).length > 0) {
          await User.findByIdAndUpdate(userData._id, updates)
          syncedCount++
        }
      } catch (error: any) {
        errors.push(`Error syncing user ${userData._id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: "Sync completed successfully",
      syncedUsers: syncedCount,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 })
  }
}
