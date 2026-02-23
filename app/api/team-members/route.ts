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
  try {
    const body = await request.json()
    await dbConnect()

    // Validate required fields
    if (!body.fullName || !body.nationalCode || !body.position || !body.phoneNumber) {
      return NextResponse.json({ error: "فیلدهای ضروری را تکمیل کنید" }, { status: 400 })
    }

    // Check if national code already exists
    const existingUser = await User.findOne({ nationalCode: body.nationalCode })
    if (existingUser) {
      return NextResponse.json({ error: "کد ملی قبلاً در سیستم ثبت شده است" }, { status: 400 })
    }

    // Create new user with TeamMember data mapped to User fields
    const newUser = await User.create({
      name: body.fullName,
      jobTitle: body.position,
      fatherName: body.fatherName || "",
      nationalCode: body.nationalCode,
      phoneNumber: body.phoneNumber,
      email: body.email || "",
      education: body.education || "",
      address: body.address || "",
      cardNumber: body.cardNumber || "",
      role: "user",
    })

    // Return in TeamMember format for frontend compatibility
    const member = {
      _id: newUser._id,
      fullName: newUser.name,
      position: newUser.jobTitle || "تعیین نشده",
      fatherName: newUser.fatherName || "",
      nationalCode: newUser.nationalCode,
      phoneNumber: newUser.phoneNumber || "",
      email: newUser.email || "",
      education: newUser.education || "",
      address: newUser.address || "",
      cardNumber: newUser.cardNumber || "",
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error("Error creating team member:", error)
    if (error.code === 11000) {
      return NextResponse.json({ error: "کد ملی قبلاً در سیستم ثبت شده است" }, { status: 400 })
    }
    return NextResponse.json({ error: "خطا در ایجاد عضو تیم" }, { status: 500 })
  }
}
