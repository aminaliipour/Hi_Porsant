import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")

    // Fetch all users, or filter by role/jobTitle if needed. 
    // For now, returning all users as potential team members.
    // We map User fields to the expected TeamMember format for frontend compatibility.
    const users = await User.find({}).sort({ createdAt: -1 })

    const members = users.map(user => ({
      _id: user._id,
      fullName: user.name,
      position: user.jobTitle || "تعیین نشده",
      fatherName: user.fatherName || "",
      nationalCode: user.nationalCode,
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
      education: user.education || "",
      address: user.address || "",
      cardNumber: user.cardNumber || "",
    }))

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "خطا در دریافت اعضای تیم" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ error: "Method not allowed. Use User Management to add members." }, { status: 405 })
}
