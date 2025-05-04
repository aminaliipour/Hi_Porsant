import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ProjectTax } from "@/lib/models/project-tax.model"
import { Project } from "@/lib/models/project.model"
import { ProjectIncome } from "@/lib/models/project-income.model"

// تابع کمکی برای محاسبه درصدها
async function recalculateAllTaxes() {
  const projects = await Project.find()
  const incomes = await ProjectIncome.find()

  // محاسبه درآمد کل برای هر پروژه
  const projectIncomes = projects.map(project => {
    const projectIncome = incomes
      .filter(income => income.projectId.toString() === project._id.toString())
      .reduce((total, income) => total + (
        (income.purchaseProfit || 0) +
        (income.collaborationProfit || 0) +
        (income.salesProfit || 0) +
        (income.designProfit || 0) +
        (income.contractingProfit || 0) +
        (income.consultationProfit || 0)
      ), 0)
    
    return {
      projectId: project._id,
      totalIncome: projectIncome
    }
  }).filter(p => p.totalIncome > 0) // فقط پروژه‌های با درآمد مثبت

  // محاسبه کل درآمدها
  const totalIncomes = projectIncomes.reduce((sum, p) => sum + p.totalIncome, 0)

  if (totalIncomes === 0) return []

  // محاسبه درصد برای هر پروژه
  const taxCalculations = projectIncomes.map(p => ({
    projectId: p.projectId,
    taxPercentage: Math.round((p.totalIncome / totalIncomes) * 100),
    totalIncome: p.totalIncome,
    lastCalculatedAt: new Date()
  }))

  // ذخیره یا به‌روزرسانی درصدها
  for (const calc of taxCalculations) {
    await ProjectTax.findOneAndUpdate(
      { projectId: calc.projectId },
      calc,
      { upsert: true, new: true }
    )
  }

  return taxCalculations
}

export async function GET() {
  try {
    await dbConnect()
    // هر بار که اطلاعات درخواست می‌شود، درصدها دوباره محاسبه می‌شوند
    const taxes = await recalculateAllTaxes()
    return NextResponse.json(taxes)
  } catch (error) {
    console.error("Error in GET /api/project-tax:", error)
    return NextResponse.json(
      { error: "خطا در محاسبه درصدهای مالیات" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await dbConnect()
    const taxes = await recalculateAllTaxes()
    return NextResponse.json(taxes)
  } catch (error) {
    console.error("Error in POST /api/project-tax:", error)
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی درصدهای مالیات" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    await dbConnect()
    
    const tax = await ProjectTax.findByIdAndUpdate(
      body._id,
      {
        taxPercentage: body.taxPercentage,
        lastCalculatedAt: new Date()
      },
      { new: true }
    )

    if (!tax) {
      return NextResponse.json({ error: "مالیات یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(tax)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی مالیات" }, { status: 500 })
  }
}