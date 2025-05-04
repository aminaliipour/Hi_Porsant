import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, ProjectSection, ProjectIncome, PurchaseDetails, CollaborationDetails, SaleDetails, DesignDetails, ContractingDetails, ConsultationDetails, SectionWeights, SystemPercentages } from "@/lib/models"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const memberId = params.id

    // دریافت درصدهای سیستم
    const systemPercentages = await SystemPercentages.find().sort({ createdAt: -1 }).limit(1)
    const systemPercent = systemPercentages[0] || {
      خرید: 0,
      همکاری: 0,
      فروش: 0,
      طراحی: 0,
      پیمانکاری: 0,
      مشاوره: 0
    }

    // دریافت اطلاعات وزن‌های بخش‌ها
    const weights = await SectionWeights.find().lean()
    const commissions = []

    // دریافت تمام پروژه‌ها و بخش‌ها
    const projects = await Project.find().lean()
    const sections = await ProjectSection.find().lean()
    const incomes = await ProjectIncome.find().lean()

    // بررسی بخش‌های دارای آیتم
    const withItemsCollections = [
      { model: PurchaseDetails, name: "خرید", percentField: "خرید" },
      { model: CollaborationDetails, name: "همکاری", percentField: "همکاری" },
      { model: SaleDetails, name: "فروش", percentField: "فروش" }
    ]

    const calculateDistributedWeights = (sectionName: string, itemName: string, allFields: string[], 
      activeFields: string[], weights: any[]) => {
      // فیلتر وزن‌های مربوط به بخش
      const sectionWeights = weights.filter(w => w.sectionName === sectionName && allFields.includes(w.fieldName))
      
      // محاسبه مجموع وزن‌های فیلدهای فعال
      let activeWeightsSum = 0
      const activeWeights = new Map()
      
      for (const field of activeFields) {
        const weight = sectionWeights.find(w => w.fieldName === field)?.weight || 0
        activeWeights.set(field, weight)
        activeWeightsSum += weight
      }

      // اگر هیچ فیلد فعالی نداشتیم یا مجموع وزن‌ها صفر بود
      if (activeWeightsSum === 0) {
        return new Map(activeFields.map(field => [field, 0]))
      }

      // محاسبه مجموع کل وزن‌های اولیه (شامل غیرفعال‌ها)
      const totalOriginalWeight = sectionWeights.reduce((sum, w) => sum + w.weight, 0)

      // محاسبه وزن‌های جدید با حفظ نسبت
      const redistributedWeights = new Map()
      for (const field of activeFields) {
        const originalWeight = activeWeights.get(field)
        const newWeight = originalWeight / activeWeightsSum * totalOriginalWeight
        redistributedWeights.set(field, newWeight)
      }

      return redistributedWeights
    }

    // بخش‌های دارای آیتم
    for (const { model, name, percentField } of withItemsCollections) {
      const details = await model.find()
      
      for (const detail of details) {
        // بررسی assignedMembers
        let assignedMembers = {}
        if (detail.assignedMembers instanceof Map) {
          assignedMembers = Object.fromEntries(detail.assignedMembers)
        } else if (detail.assignedMembers?.toObject) {
          assignedMembers = detail.assignedMembers.toObject()
        } else if (typeof detail.assignedMembers === 'object') {
          assignedMembers = detail.assignedMembers || {}
        }

        // بررسی details
        let detailsObj = {}
        if (detail.details instanceof Map) {
          detailsObj = Object.fromEntries(detail.details)
        } else if (detail.details?.toObject) {
          detailsObj = detail.details.toObject()
        } else if (typeof detail.details === 'object') {
          detailsObj = detail.details || {}
        }

        // تعیین همه فیلدها و فیلدهای فعال
        const allFields = Object.keys(detailsObj)
        const activeFields = allFields.filter(field => 
          !detailsObj[field] || detailsObj[field].isActive !== false
        )

        // محاسبه وزن‌های بازتوزیع شده
        const redistributedWeights = calculateDistributedWeights(name, detail.itemName, allFields, activeFields, weights)

        // بررسی تخصیص از طریق assignedMembers
        for (const [field, assignedId] of Object.entries(assignedMembers)) {
          if (!assignedId) continue

          const assignedMemberId = typeof assignedId === 'object' ? 
            assignedId.toString() : 
            assignedId?.toString()

          if (assignedMemberId === memberId) {
            // بررسی وضعیت فعال/غیرفعال از details
            const fieldDetails = detailsObj[field]
            const isActive = !fieldDetails || fieldDetails.isActive !== false

            if (isActive) {
              const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
              if (section) {
                const project = projects.find(p => p._id.toString() === section.projectId.toString())
                const income = incomes.find(i => i.projectId.toString() === section.projectId.toString())

                if (project && income) {
                  const key = `${name}_${detail.itemName}_${field}`
                  const value = income.details?.[key]?.value || 0
                  const weightValue = redistributedWeights.get(field) || 0
                  const systemPercentValue = systemPercent[percentField as keyof typeof systemPercent] || 0
                  
                  // محاسبه سهم نهایی
                  const finalShare = (weightValue * (100 - systemPercentValue)) / 10000

                  if (value > 0 && weightValue > 0) {
                    commissions.push({
                      projectId: project._id,
                      projectName: project.name,
                      sectionName: name,
                      itemName: detail.itemName || "",
                      fieldName: field,
                      income: value,
                      weight: weightValue,
                      systemPercent: systemPercentValue,
                      commission: Math.round(value * finalShare)
                    })
                  }
                }
              }
            }
          }
        }

        // بررسی تخصیص از طریق details
        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          if (!fieldDetails || typeof fieldDetails !== 'object') continue

          const assignedMemberId = fieldDetails.assignedMemberId?.toString()
          const isActive = fieldDetails.isActive !== false

          if (assignedMemberId === memberId && isActive) {
            const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
            if (section) {
              const project = projects.find(p => p._id.toString() === section.projectId.toString())
              const income = incomes.find(i => i.projectId.toString() === section.projectId.toString())

              if (project && income) {
                const key = `${name}_${detail.itemName}_${field}`
                const value = income.details?.[key]?.value || 0
                const weightValue = redistributedWeights.get(field) || 0
                const systemPercentValue = systemPercent[percentField as keyof typeof systemPercent] || 0
                
                // محاسبه سهم نهایی
                const finalShare = (weightValue * (100 - systemPercentValue)) / 10000

                if (value > 0 && weightValue > 0) {
                  commissions.push({
                    projectId: project._id,
                    projectName: project.name,
                    sectionName: name,
                    itemName: detail.itemName || "",
                    fieldName: field,
                    income: value,
                    weight: weightValue,
                    systemPercent: systemPercentValue,
                    commission: Math.round(value * finalShare)
                  })
                }
              }
            }
          }
        }
      }
    }

    // بررسی بخش‌های بدون آیتم
    const withoutItemsCollections = [
      { model: DesignDetails, name: "طراحی", percentField: "طراحی" },
      { model: ContractingDetails, name: "پیمانکاری", percentField: "پیمانکاری" },
      { model: ConsultationDetails, name: "مشاوره", percentField: "مشاوره" }
    ]

    for (const { model, name, percentField } of withoutItemsCollections) {
      const details = await model.find()
      
      for (const detail of details) {
        if (!detail?.details) continue
        
        let detailsObj = {}
        if (detail.details instanceof Map) {
          detailsObj = Object.fromEntries(detail.details)
        } else if (detail.details?.toObject) {
          detailsObj = detail.details.toObject()
        } else if (typeof detail.details === 'object') {
          detailsObj = detail.details
        }

        // تعیین همه فیلدها و فیلدهای فعال
        const allFields = Object.keys(detailsObj)
        const activeFields = allFields.filter(field => {
          const fieldDetails = detailsObj[field]
          return typeof fieldDetails === 'object' && fieldDetails?.isActive !== false
        })

        // محاسبه وزن‌های بازتوزیع شده
        const redistributedWeights = calculateDistributedWeights(name, "", allFields, activeFields, weights)

        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          let assignedMemberId = null
          let isActive = true

          // بررسی ساختار details
          if (typeof fieldDetails === 'object') {
            assignedMemberId = fieldDetails?.assignedMemberId?.toString()
            isActive = fieldDetails?.isActive !== false
          }
          
          if (assignedMemberId === memberId && isActive) {
            const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
            if (section) {
              const project = projects.find(p => p._id.toString() === section.projectId.toString())
              const income = incomes.find(i => i.projectId.toString() === section.projectId.toString())

              if (project && income) {
                const key = `${name}_${field}`
                const value = income.details?.[key]?.value || 0
                const weightValue = redistributedWeights.get(field) || 0
                const systemPercentValue = systemPercent[percentField as keyof typeof systemPercent] || 0
                
                // محاسبه سهم نهایی
                const finalShare = (weightValue * (100 - systemPercentValue)) / 10000

                if (value > 0 && weightValue > 0) {
                  commissions.push({
                    projectId: project._id,
                    projectName: project.name,
                    sectionName: name,
                    itemName: "",
                    fieldName: field,
                    income: value,
                    weight: weightValue,
                    systemPercent: systemPercentValue,
                    commission: Math.round(value * finalShare)
                  })
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json(commissions)
  } catch (error) {
    console.error("Error fetching user commissions:", error)
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات پورسانت" },
      { status: 500 }
    )
  }
}