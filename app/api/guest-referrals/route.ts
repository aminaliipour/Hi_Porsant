import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { GuestReferral } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")
    const filter: any = {}
    if (archiveId) filter.archiveId = archiveId
    const referrals = await GuestReferral.find(filter).sort({ createdAt: -1 })
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
      archiveId: body.archiveId, // اضافه شد
    })

    await referral.save()
    return NextResponse.json(referral, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد فرد مهمان" }, { status: 500 })
  }
}
