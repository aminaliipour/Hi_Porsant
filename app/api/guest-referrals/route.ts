import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { GuestReferral } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const referrals = await GuestReferral.find({}).sort({ createdAt: -1 })
    return NextResponse.json(referrals)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت لیست افراد مهمان" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    const referral = new GuestReferral({
      fullName: body.fullName,
      referralFee: body.referralFee,
      description: body.description,
      dateAdded: body.dateAdded,
    })

    await referral.save()
    return NextResponse.json(referral, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد فرد مهمان" }, { status: 500 })
  }
}
