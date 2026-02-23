import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    // Map User to TeamMember format for consistent API response
    const member = {
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
      const existingUser = await User.findOne({
        nationalCode: body.nationalCode,
        _id: { $ne: params.id },
      })

      if (existingUser) {
        return NextResponse.json({ error: "کد ملی قبلاً در سیستم ثبت شده است" }, { status: 400 })
      }
    }

    // Update User collection with TeamMember data mapped to User fields
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      {
        name: body.fullName,
        jobTitle: body.position,
        fatherName: body.fatherName,
        nationalCode: body.nationalCode,
        phoneNumber: body.phoneNumber,
        email: body.email,
        education: body.education,
        address: body.address,
        cardNumber: body.cardNumber,
      },
      { new: true },
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    // Return in TeamMember format for frontend compatibility
    const member = {
      _id: updatedUser._id,
      fullName: updatedUser.name,
      position: updatedUser.jobTitle || "تعیین نشده",
      fatherName: updatedUser.fatherName || "",
      nationalCode: updatedUser.nationalCode,
      phoneNumber: updatedUser.phoneNumber || "",
      email: updatedUser.email || "",
      education: updatedUser.education || "",
      address: updatedUser.address || "",
      cardNumber: updatedUser.cardNumber || "",
    }

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی عضو تیم" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const user = await User.findByIdAndDelete(params.id)

    if (!user) {
      return NextResponse.json({ error: "عضو تیم یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "عضو تیم با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف عضو تیم" }, { status: 500 })
  }
}
