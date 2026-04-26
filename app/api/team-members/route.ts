import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")
    
    let members
    if (archiveId) {
      // دریافت اعضای تخصصی برای آرشیو + shared members (بدون archiveId)
      members = await TeamMember.find({
        $or: [
          { archiveId: archiveId },
          { archiveId: { $exists: false } }
        ]
      }).sort({ createdAt: -1 })
    } else {
      // اگر archiveId نداشتیم، تمام shared members را دریافت کن
      members = await TeamMember.find({ archiveId: { $exists: false } }).sort({ createdAt: -1 })
    }
    
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت اعضای تیم" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    // بررسی تکراری نبودن کد ملی (فقط برای همین آرشیو)
    const existingMember = await TeamMember.findOne({ 
      nationalCode: body.nationalCode,
      archiveId: body.archiveId
    })
    if (existingMember) {
      return NextResponse.json({ error: "کد ملی قبلاً در این آرشیو ثبت شده است" }, { status: 400 })
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
      cardNumber: body.cardNumber,
      archiveId: body.archiveId,
    })

    await member.save()
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد عضو تیم" }, { status: 500 })
  }
}
