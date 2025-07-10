import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { UserCommission } from "@/lib/models"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { employeeId, archiveId, commissionStates } = body

    if (!employeeId || !Array.isArray(commissionStates)) {
      return NextResponse.json(
        { error: "پارامترهای الزامی ارسال نشده است" },
        { status: 400 }
      )
    }

    // تبدیل archiveId به ObjectId اگر وجود داشت
    let archiveObjectId = undefined
    if (archiveId) {
      try {
        archiveObjectId = new mongoose.Types.ObjectId(archiveId)
      } catch (e) {
        archiveObjectId = undefined
      }
    }

    // به‌روزرسانی یا ایجاد رکوردهای UserCommission
    for (const commissionState of commissionStates) {
      const { projectName, sectionName, itemName, fieldName, isActive } = commissionState

      // پیدا کردن پروژه بر اساس نام
      const Project = (await import("@/lib/models")).Project
      const project = await Project.findOne({ 
        name: projectName,
        ...(archiveObjectId && { archiveId: archiveObjectId })
      })

      if (!project) {
        console.warn(`Project not found: ${projectName}`)
        continue
      }

      // شرایط جستجو
      const query = {
        userId: new mongoose.Types.ObjectId(employeeId),
        projectId: project._id,
        sectionName,
        fieldName,
        ...(itemName && { itemName }),
        ...(archiveObjectId && { archiveId: archiveObjectId })
      }

      // بررسی وجود رکورد
      const existingCommission = await UserCommission.findOne(query)

      if (existingCommission) {
        // به‌روزرسانی رکورد موجود
        existingCommission.isActive = isActive
        await existingCommission.save()
      } else {
        // ایجاد رکورد جدید
        const newCommission = new UserCommission({
          ...query,
          income: 0, // مقادیر پیش‌فرض
          weight: 0,
          systemPercent: 0,
          commission: 0,
          isActive
        })
        await newCommission.save()
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error updating commission status:", error)
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی وضعیت پورسانت‌ها" },
      { status: 500 }
    )
  }
}
