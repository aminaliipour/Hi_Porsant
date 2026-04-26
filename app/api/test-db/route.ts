import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"

export async function GET() {
  try {
    await dbConnect()
    return NextResponse.json({ status: "success", message: "اتصال به دیتابیس MongoDB Atlas با موفقیت انجام شد" })
  } catch (error) {
    console.error("خطا در اتصال به دیتابیس:", error)
    return NextResponse.json(
      { status: "error", message: "خطا در اتصال به دیتابیس", error: String(error) },
      { status: 500 },
    )
  }
}
