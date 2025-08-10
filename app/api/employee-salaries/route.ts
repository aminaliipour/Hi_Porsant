import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { EmployeeSalary } from "@/lib/models"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const archiveId = searchParams.get("archiveId")

    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است" }, { status: 400 })
    }

    let query: any = { employeeId }
    if (archiveId) query.archiveId = new mongoose.Types.ObjectId(archiveId)

    const salaries = await EmployeeSalary.find(query)
      .sort({ date: -1 })
      .populate('employeeId')
      .exec()

    if (!salaries || salaries.length === 0) {
      return NextResponse.json([])
    }

    return NextResponse.json(salaries)
  } catch (error) {
    console.error("Error fetching salary data:", error)
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات حقوق" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Received body in API:", body)
    await dbConnect()

    if (!body.employeeId) {
      return NextResponse.json(
        { error: "شناسه کارمند الزامی است" },
        { status: 400 }
      )
    }

    // تبدیل archiveId به ObjectId اگر وجود داشت
    let findArchiveId = undefined
    if (body.archiveId) {
      try {
        findArchiveId = new mongoose.Types.ObjectId(body.archiveId)
      } catch (e) {
        findArchiveId = undefined
      }
    }

    // جستجو بر اساس employeeId + archiveId (اگر وجود داشت)
    const query = {
      employeeId: body.employeeId,
      ...(findArchiveId && { archiveId: findArchiveId }),
    }

    // استفاده از updateOne برای اطمینان از ذخیره فیلد description
    const updateData = {
      baseSalary: body.baseSalary,
      additions: body.additions,
      deductions: body.deductions,
      description: body.description || "",
    }

    console.log("Update data:", updateData)

    let salary = await EmployeeSalary.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    // اگر document جدید است، date و archiveId را تنظیم کن
    if (!salary.date) {
      salary.date = body.date || new Date().toISOString().split("T")[0]
      if (findArchiveId) {
        salary.archiveId = findArchiveId
      }
      await salary.save()
    }

    console.log("Final saved salary:", salary)
    return NextResponse.json(salary, { status: 201 })
  } catch (error) {
    console.error("Error saving salary data:", error)
    return NextResponse.json(
      { error: "خطا در ذخیره اطلاعات حقوق" },
      { status: 500 }
    )
  }
}
