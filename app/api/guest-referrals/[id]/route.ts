import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { GuestReferral } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const referral = await GuestReferral.findById(params.id)

    if (!referral) {
      return NextResponse.json({ error: "فرد مهمان یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(referral)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت اطلاعات فرد مهمان" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const referral = await GuestReferral.findByIdAndUpdate(
      params.id,
      {
        fullName: body.fullName,
        referralFee: body.referralFee,
        description: body.description,
      },
      { new: true },
    )

    if (!referral) {
      return NextResponse.json({ error: "فرد مهمان یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(referral)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی اطلاعات فرد مهمان" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const referral = await GuestReferral.findByIdAndDelete(params.id)

    if (!referral) {
      return NextResponse.json({ error: "فرد مهمان یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "فرد مهمان با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف فرد مهمان" }, { status: 500 })
  }
}
