import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, Archive } from "@/lib/models"

// PATCH /api/projects/migrate-to-ordibehesht
export async function PATCH() {
  try {
    await dbConnect()
    // پیدا کردن آرشیو اردیبهشت 1404
    const ordibehesht = await Archive.findOne({ name: /اردیبهشت/i })
    if (!ordibehesht) {
      return NextResponse.json({ error: "آرشیو اردیبهشت پیدا نشد" }, { status: 404 })
    }
    // پیدا کردن پروژه‌هایی که archiveId ندارند
    const projects = await Project.find({ archiveId: { $exists: false } })
    let updatedCount = 0
    for (const p of projects) {
      p.archiveId = ordibehesht._id
      await p.save()
      updatedCount++
    }
    return NextResponse.json({ success: true, updatedCount })
  } catch (error) {
    return NextResponse.json({ error: "خطا در انتقال پروژه‌های اصلی به آرشیو اردیبهشت" }, { status: 500 })
  }
}
