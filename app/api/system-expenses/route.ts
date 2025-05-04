import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { SystemExpenses } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const expenses = await SystemExpenses.find({}).sort({ date: -1 }).limit(1)
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت هزینه‌های سیستم" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    // بررسی وجود رکورد قبلی برای این تاریخ
    const currentDate = new Date().toISOString().split("T")[0]
    const existingExpenses = await SystemExpenses.findOne({ date: currentDate })

    if (existingExpenses) {
      // بروزرسانی رکورد موجود
      Object.keys(body).forEach((key) => {
        if (key !== "_id" && key !== "date" && key !== "createdAt" && key !== "updatedAt") {
          existingExpenses[key] = body[key]
        }
      })

      await existingExpenses.save()
      return NextResponse.json(existingExpenses)
    } else {
      // ایجاد رکورد جدید
      const expenses = new SystemExpenses({
        ...body,
        date: currentDate,
      })

      await expenses.save()
      return NextResponse.json(expenses, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ error: "خطا در ذخیره هزینه‌های سیستم" }, { status: 500 })
  }
}
