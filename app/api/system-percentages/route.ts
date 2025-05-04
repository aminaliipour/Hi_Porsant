import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { SystemPercentages } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const percentages = await SystemPercentages.find({}).sort({ createdAt: -1 }).limit(1)
    if (percentages.length === 0) {
      return NextResponse.json({
        خرید: 0,
        همکاری: 0,
        فروش: 0,
        طراحی: 0,
        پیمانکاری: 0,
        مشاوره: 0
      })
    }
    return NextResponse.json(percentages[0])
  } catch (error) {
    console.error("Error in system-percentages GET:", error)
    return NextResponse.json({ error: "خطا در دریافت درصدهای سیستم" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()

    // حذف تمام رکوردهای قبلی
    await SystemPercentages.deleteMany({})

    // ایجاد رکورد جدید
    const percentages = new SystemPercentages({
      خرید: Number(body.خرید) || 0,
      همکاری: Number(body.همکاری) || 0,
      فروش: Number(body.فروش) || 0,
      طراحی: Number(body.طراحی) || 0,
      پیمانکاری: Number(body.پیمانکاری) || 0,
      مشاوره: Number(body.مشاوره) || 0,
    })

    await percentages.save()
    return NextResponse.json(percentages)
  } catch (error) {
    console.error("Error in system-percentages POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره درصدهای سیستم" }, { status: 500 })
  }
}
