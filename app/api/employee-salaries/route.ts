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
      taxDeduction: body.taxDeduction || 0, // کسر 7% اضافه شد
      description: body.description || "",
      isPorsanti: body.isPorsanti || false, // حالت پورسانتی
      salary1: body.salary1 || 0, // حقوق اول
      salary2: body.salary2 || 0, // حقوق دوم
      salary1Base: body.salary1Base || 133911989, // مبلغ حقوق پایه - هر شخص مبلغ خودش
      insuranceDeduction: body.insuranceDeduction ?? true, // وضعیت کسر بیمه
      date: body.date || new Date().toISOString().split("T")[0],
      ...(findArchiveId && { archiveId: findArchiveId }),
    }

    console.log("Update data:", updateData)

    let salary = await EmployeeSalary.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

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

export async function DELETE(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const archiveId = searchParams.get("archiveId")

    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است" }, { status: 400 })
    }

    let query: any = { employeeId }
    if (archiveId) {
      try {
        query.archiveId = new mongoose.Types.ObjectId(archiveId)
      } catch (e) {
        return NextResponse.json({ error: "شناسه آرشیو نامعتبر است" }, { status: 400 })
      }
    }

    const result = await EmployeeSalary.deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "رکورد حقوق یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "رکورد حقوق با موفقیت حذف شد" })
  } catch (error) {
    console.error("Error deleting salary data:", error)
    return NextResponse.json(
      { error: "خطا در حذف اطلاعات حقوق" },
      { status: 500 }
    )
  }
}
