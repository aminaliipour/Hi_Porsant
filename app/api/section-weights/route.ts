import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { SectionWeights } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const weights = await SectionWeights.find({})
    return NextResponse.json(weights)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت وزن‌های بخش‌ها" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    // حذف همه وزن‌های قبلی و ایجاد موارد جدید
    if (body.weights && Array.isArray(body.weights)) {
      await SectionWeights.deleteMany({})

      const weights = await SectionWeights.insertMany(body.weights)
      return NextResponse.json(weights, { status: 201 })
    } else {
      return NextResponse.json({ error: "داده‌های نامعتبر" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "خطا در ذخیره وزن‌های بخش‌ها" }, { status: 500 })
  }
}
