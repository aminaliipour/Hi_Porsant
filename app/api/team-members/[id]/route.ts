import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    const member = await TeamMember.findById(id)

    if (!member) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت عضو تیم" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    await dbConnect()

    // بررسی تکراری نبودن کد ملی در صورت تغییر (فقط برای همین آرشیو)
    if (body.nationalCode) {
      const existingMember = await TeamMember.findOne({
        nationalCode: body.nationalCode,
        archiveId: body.archiveId,
        _id: { $ne: id },
      })

      if (existingMember) {
        return NextResponse.json({ error: "کد ملی قبلاً در این آرشیو ثبت شده است" }, { status: 400 })
      }
    }

    const member = await TeamMember.findByIdAndUpdate(
      id,
      {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await dbConnect()
    const member = await TeamMember.findByIdAndDelete(id)

    if (!member) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "عضو تیم با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف عضو تیم" }, { status: 500 })
  }
}
