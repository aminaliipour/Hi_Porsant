import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, Archive } from "@/lib/models"

// PATCH /api/projects/migrate-all-to-ordibehesht
export async function PATCH() {
  try {
    await dbConnect()
    // پیدا کردن آرشیو اردیبهشت (نام شامل اردیبهشت)
    const ordibehesht = await Archive.findOne({ name: /اردیبهشت/i })
    if (!ordibehesht) {
      return NextResponse.json({ error: "آرشیو اردیبهشت پیدا نشد" }, { status: 404 })
    }
    // همه پروژه‌ها را به این آرشیو منتقل کن
    const result = await Project.updateMany({}, { archiveId: ordibehesht._id })
    return NextResponse.json({ success: true, matched: result.matchedCount || result.n, modified: result.modifiedCount || result.nModified })
  } catch (error) {
    return NextResponse.json({ error: "خطا در انتقال پروژه‌ها به آرشیو اردیبهشت" }, { status: 500 })
  }
}
