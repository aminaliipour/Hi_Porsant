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

    let incomes;
    if (archiveId) {
      incomes = await ProjectIncome.find()
        .populate({
          path: 'projectId',
          match: { archiveId: archiveId },
          select: 'archiveId'
        })
        .lean()
        .then(results => results.filter(income => income.projectId)) // فیلتر کردن مواردی که projectId پیدا شده
    } else {
      incomes = await ProjectIncome.find(query).lean()
    }

    // تبدیل details از Map به Object
    const transformedIncomes = incomes.map(income => {
      const transformed = {
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
            income.fixedValues.toObject() : income.fixedValues),
        itemCalculationType: income.itemCalculationType instanceof Map ? 
          Object.fromEntries(income.itemCalculationType) : 
          (typeof income.itemCalculationType === 'function' ? 
            income.itemCalculationType.toObject() : income.itemCalculationType || income.itemCalculationType),
        itemFixedValues: income.itemFixedValues instanceof Map ? 
          Object.fromEntries(income.itemFixedValues) : 
          (typeof income.itemFixedValues === 'function' ? 
            income.itemFixedValues.toObject() : income.itemFixedValues || income.itemFixedValues)
      }
      
      // لاگ اضافی برای بررسی Map transformations
      console.log(`=== TRANSFORMING INCOME ${income._id} ===`)
      console.log("Original itemCalculationType:", income.itemCalculationType)
      console.log("Transformed itemCalculationType:", transformed.itemCalculationType)
      console.log("Original itemFixedValues:", income.itemFixedValues)
      console.log("Transformed itemFixedValues:", transformed.itemFixedValues)
      
      return transformed
    })

    console.log("API returning incomes:", transformedIncomes.map(inc => ({
      id: inc._id,
      totalIncome: (inc as any).totalIncome,
      totalRawIncome: (inc as any).totalRawIncome,
      totalSystemShare: (inc as any).totalSystemShare,
      itemCalculationType: (inc as any).itemCalculationType,
      itemFixedValues: (inc as any).itemFixedValues
    })))

    console.log("🔥 DETAILED FIRST INCOME:")
    if (transformedIncomes.length > 0) {
      console.log("  - itemCalculationType:", (transformedIncomes[0] as any).itemCalculationType)
      console.log("  - itemFixedValues:", (transformedIncomes[0] as any).itemFixedValues)
    }

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
    console.log("API received itemCalculationType:", body.itemCalculationType)
    console.log("API received itemFixedValues:", body.itemFixedValues)
    
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
      
      console.log("Updating itemCalculationType:", body.itemCalculationType)
      console.log("Updating itemFixedValues:", body.itemFixedValues)
      
      // برای Map ها باید از روش خاصی استفاده کنیم
      if (body.calculationType !== undefined) {
        existingIncome.calculationType = body.calculationType || {}
      }
      if (body.fixedValues !== undefined) {
        existingIncome.fixedValues = body.fixedValues || {}
      }
      if (body.itemCalculationType !== undefined) {
        existingIncome.itemCalculationType = body.itemCalculationType || {}
        console.log("🔥 UPDATED existingIncome.itemCalculationType:", existingIncome.itemCalculationType)
      }
      if (body.itemFixedValues !== undefined) {
        existingIncome.itemFixedValues = body.itemFixedValues || {}
        console.log("🔥 UPDATED existingIncome.itemFixedValues:", existingIncome.itemFixedValues)
      }
      const savedIncome = await existingIncome.save()
      console.log("🔥 SAVED income with itemCalculationType:", savedIncome.itemCalculationType)
      console.log("🔥 SAVED income with itemFixedValues:", savedIncome.itemFixedValues)
      console.log("Saved income:", savedIncome.toObject())
      
      // بررسی اضافی برای itemCalculationType و itemFixedValues
      console.log("=== POST-SAVE VERIFICATION ===")
      console.log("Saved itemCalculationType:", savedIncome.itemCalculationType)
      console.log("Saved itemFixedValues:", savedIncome.itemFixedValues)
      console.log("itemCalculationType as Map size:", savedIncome.itemCalculationType?.size)
      console.log("itemFixedValues as Map size:", savedIncome.itemFixedValues?.size)
      
      return NextResponse.json(savedIncome)
    } else {
      // ایجاد رکورد جدید
      console.log("Creating new income with calculationType:", body.calculationType)
      console.log("Creating new income with fixedValues:", body.fixedValues)
      console.log("Creating new income with itemCalculationType:", body.itemCalculationType)
      console.log("Creating new income with itemFixedValues:", body.itemFixedValues)
      
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
        calculationType: body.calculationType || {},
        fixedValues: body.fixedValues || {},
        itemCalculationType: body.itemCalculationType || {},
        itemFixedValues: body.itemFixedValues || {},
      })

      const savedIncome = await income.save()
      console.log("New saved income:", savedIncome.toObject())
      
      // بررسی اضافی برای itemCalculationType و itemFixedValues
      console.log("=== POST-SAVE VERIFICATION (NEW) ===")
      console.log("Saved itemCalculationType:", savedIncome.itemCalculationType)
      console.log("Saved itemFixedValues:", savedIncome.itemFixedValues)
      console.log("itemCalculationType as Map size:", savedIncome.itemCalculationType?.size)
      console.log("itemFixedValues as Map size:", savedIncome.itemFixedValues?.size)
      
      return NextResponse.json(savedIncome)
    }
  } catch (error) {
    console.error("Error in project-incomes POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره اطلاعات درآمد" }, { status: 500 })
  }
}
