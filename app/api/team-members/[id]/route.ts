import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const member = await TeamMember.findById(params.id)

    if (!member) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت عضو تیم" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    // بررسی تکراری نبودن کد ملی در صورت تغییر
    if (body.nationalCode) {
      const existingMember = await TeamMember.findOne({
        nationalCode: body.nationalCode,
        _id: { $ne: params.id },
      })

      if (existingMember) {
        return NextResponse.json({ error: "کد ملی قبلاً در سیستم ثبت شده است" }, { status: 400 })
      }
    }

    const member = await TeamMember.findByIdAndUpdate(
      params.id,
      {
        fullName: body.fullName,
        position: body.position,
        fatherName: body.fatherName,
        nationalCode: body.nationalCode,
        phoneNumber: body.phoneNumber,
        email: body.email,
        education: body.education,
        address: body.address,
      },
      { new: true },
    )

    if (!member) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی عضو تیم" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const member = await TeamMember.findByIdAndDelete(params.id)

    if (!member) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "عضو تیم با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف عضو تیم" }, { status: 500 })
  }
}
