import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { DesignDetails } from "@/lib/models"

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { sectionId, field, isActive } = body

    const details = await DesignDetails.findOne({ sectionId })
    if (!details) {
      return NextResponse.json({ error: "جزئیات بخش یافت نشد" }, { status: 404 })
    }

    // به‌روزرسانی وضعیت فیلد
    if (!details.details) details.details = {}
    if (!details.details[field]) details.details[field] = {}
    details.details[field].isActive = isActive

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in design-details update-field-status:", error)
    return NextResponse.json({ error: "خطا در به‌روزرسانی وضعیت فیلد" }, { status: 500 })
  }
}