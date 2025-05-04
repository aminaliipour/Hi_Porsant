import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { EmployeeSalary } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است" }, { status: 400 })
    }

    let query = { employeeId }

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
    await dbConnect()

    if (!body.employeeId) {
      return NextResponse.json(
        { error: "شناسه کارمند الزامی است" },
        { status: 400 }
      )
    }

    // بررسی وجود رکورد قبلی برای این کارمند و تاریخ
    const existingSalary = await EmployeeSalary.findOne({
      employeeId: body.employeeId,
      date: body.date,
    })

    if (existingSalary) {
      // بروزرسانی رکورد موجود
      existingSalary.baseSalary = body.baseSalary
      existingSalary.additions = body.additions
      existingSalary.deductions = body.deductions
      await existingSalary.save()
      return NextResponse.json(existingSalary)
    } else {
      // ایجاد رکورد جدید
      const salary = new EmployeeSalary({
        employeeId: body.employeeId,
        baseSalary: body.baseSalary || 0,
        additions: body.additions || 0,
        deductions: body.deductions || 0,
        date: body.date,
      })
      await salary.save()
      return NextResponse.json(salary, { status: 201 })
    }
  } catch (error) {
    console.error("Error saving salary data:", error)
    return NextResponse.json(
      { error: "خطا در ذخیره اطلاعات حقوق" },
      { status: 500 }
    )
  }
}
