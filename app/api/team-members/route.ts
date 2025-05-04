import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const members = await TeamMember.find({}).sort({ createdAt: -1 })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت اعضای تیم" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    // بررسی تکراری نبودن کد ملی
    const existingMember = await TeamMember.findOne({ nationalCode: body.nationalCode })
    if (existingMember) {
      return NextResponse.json({ error: "کد ملی قبلاً در سیستم ثبت شده است" }, { status: 400 })
    }

    const member = new TeamMember({
      fullName: body.fullName,
      position: body.position,
      fatherName: body.fatherName,
      nationalCode: body.nationalCode,
      phoneNumber: body.phoneNumber,
      email: body.email,
      education: body.education,
      address: body.address,
    })

    await member.save()
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد عضو تیم" }, { status: 500 })
  }
}
