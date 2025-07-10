import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ProjectIncome } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")
    const projectId = searchParams.get("projectId")

    let query: any = {}
    if (archiveId) query.archiveId = archiveId
    if (projectId) query.projectId = projectId

    const incomes = await ProjectIncome.find(query).lean()

    // تبدیل details از Map به Object
    const transformedIncomes = incomes.map(income => ({
      ...income,
      details: income.details instanceof Map ? 
        Object.fromEntries(income.details) : 
        (typeof income.details === 'function' ? 
          income.details.toObject() : income.details),
      calculationType: income.calculationType instanceof Map ? 
        Object.fromEntries(income.calculationType) : 
        (typeof income.calculationType === 'function' ? 
          income.calculationType.toObject() : income.calculationType),
      fixedValues: income.fixedValues instanceof Map ? 
        Object.fromEntries(income.fixedValues) : 
        (typeof income.fixedValues === 'function' ? 
          income.fixedValues.toObject() : income.fixedValues)
    }))

    console.log("API returning incomes:", transformedIncomes.map(inc => ({
      id: inc._id,
      totalIncome: inc.totalIncome,
      totalRawIncome: inc.totalRawIncome,
      totalSystemShare: inc.totalSystemShare
    })))

    return NextResponse.json(transformedIncomes)
  } catch (error) {
    console.error("Error in project-incomes GET:", error)
    return NextResponse.json({ error: "خطا در دریافت اطلاعات درآمد" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("API received body keys:", Object.keys(body))
    console.log("API received rawPurchaseProfit:", body.rawPurchaseProfit)
    console.log("API received rawDesignProfit:", body.rawDesignProfit)
    console.log("API received rawCollaborationProfit:", body.rawCollaborationProfit)
    console.log("API received calculationType:", body.calculationType)
    console.log("API received fixedValues:", body.fixedValues)
    
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
      
      // بروزرسانی مقادیر خام
      existingIncome.rawPurchaseProfit = body.rawPurchaseProfit || 0
      existingIncome.rawDesignProfit = body.rawDesignProfit || 0
      existingIncome.rawCollaborationProfit = body.rawCollaborationProfit || 0
      existingIncome.rawContractingProfit = body.rawContractingProfit || 0
      existingIncome.rawSalesProfit = body.rawSalesProfit || 0
      existingIncome.rawConsultationProfit = body.rawConsultationProfit || 0
      
      existingIncome.details = body.details
      if (body.archiveId) {
        existingIncome.archiveId = body.archiveId
      }
      // همیشه calculationType و fixedValues را بروزرسانی کن، حتی اگر خالی باشند
      console.log("Updating calculationType:", body.calculationType)
      console.log("calculationType type:", typeof body.calculationType)
      
      console.log("Updating fixedValues:", body.fixedValues)
      console.log("fixedValues type:", typeof body.fixedValues)
      
      // برای Map ها باید از روش خاصی استفاده کنیم
      if (body.calculationType !== undefined) {
        existingIncome.calculationType = new Map(Object.entries(body.calculationType || {}))
      }
      if (body.fixedValues !== undefined) {
        existingIncome.fixedValues = new Map(Object.entries(body.fixedValues || {}))
      }
      const savedIncome = await existingIncome.save()
      console.log("Saved income:", savedIncome.toObject())
      return NextResponse.json(savedIncome)
    } else {
      // ایجاد رکورد جدید
      console.log("Creating new income with calculationType:", body.calculationType)
      console.log("Creating new income with fixedValues:", body.fixedValues)
      
      const income = new ProjectIncome({
        projectId: body.projectId,
        purchaseProfit: body.purchaseProfit,
        designProfit: body.designProfit,
        collaborationProfit: body.collaborationProfit,
        contractingProfit: body.contractingProfit,
        salesProfit: body.salesProfit,
        consultationProfit: body.consultationProfit,
        
        // مقادیر خام
        rawPurchaseProfit: body.rawPurchaseProfit || 0,
        rawDesignProfit: body.rawDesignProfit || 0,
        rawCollaborationProfit: body.rawCollaborationProfit || 0,
        rawContractingProfit: body.rawContractingProfit || 0,
        rawSalesProfit: body.rawSalesProfit || 0,
        rawConsultationProfit: body.rawConsultationProfit || 0,
        
        details: body.details,
        archiveId: body.archiveId || null,
        calculationType: new Map(Object.entries(body.calculationType || {})),
        fixedValues: new Map(Object.entries(body.fixedValues || {})),
      })

      const savedIncome = await income.save()
      console.log("New saved income:", savedIncome.toObject())
      return NextResponse.json(savedIncome)
    }
  } catch (error) {
    console.error("Error in project-incomes POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره اطلاعات درآمد" }, { status: 500 })
  }
}
