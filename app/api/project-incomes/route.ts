import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ProjectIncome } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let query = {}
    if (projectId) {
      query = { projectId }
    }

    const incomes = await ProjectIncome.find(query).lean()

    // تبدیل details از Map به Object
    const transformedIncomes = incomes.map(income => ({
      ...income,
      details: income.details instanceof Map ? 
        Object.fromEntries(income.details) : 
        (typeof income.details === 'function' ? 
          income.details.toObject() : income.details)
    }))

    return NextResponse.json(transformedIncomes)
  } catch (error) {
    console.error("Error in project-incomes GET:", error)
    return NextResponse.json({ error: "خطا در دریافت اطلاعات درآمد" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    // بررسی وجود رکورد قبلی برای این پروژه
    const existingIncome = await ProjectIncome.findOne({ projectId: body.projectId })

    if (existingIncome) {
      // بروزرسانی رکورد موجود
      existingIncome.purchaseProfit = body.purchaseProfit
      existingIncome.designProfit = body.designProfit
      existingIncome.collaborationProfit = body.collaborationProfit
      existingIncome.contractingProfit = body.contractingProfit
      existingIncome.salesProfit = body.salesProfit
      existingIncome.consultationProfit = body.consultationProfit
      existingIncome.details = body.details

      await existingIncome.save()
      return NextResponse.json(existingIncome)
    } else {
      // ایجاد رکورد جدید
      const income = new ProjectIncome({
        projectId: body.projectId,
        purchaseProfit: body.purchaseProfit,
        designProfit: body.designProfit,
        collaborationProfit: body.collaborationProfit,
        contractingProfit: body.contractingProfit,
        salesProfit: body.salesProfit,
        consultationProfit: body.consultationProfit,
        details: body.details,
      })

      await income.save()
      return NextResponse.json(income)
    }
  } catch (error) {
    console.error("Error in project-incomes POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره اطلاعات درآمد" }, { status: 500 })
  }
}
