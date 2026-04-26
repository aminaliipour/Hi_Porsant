import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, ProjectSection, ProjectIncome, PurchaseDetails, CollaborationDetails, SaleDetails, DesignDetails, ContractingDetails, ConsultationDetails, SectionWeights, SystemPercentages, UserCommission } from "@/lib/models"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const paramsResolved = await params
    const memberId = paramsResolved.id

    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")

    console.time('API Total')
    console.time('Database Queries')

    // بهینه‌سازی: دریافت موثر داده‌ها با projection
    const [systemPercentages, weights, projects, sections, incomes] = await Promise.all([
      SystemPercentages.findOne().sort({ createdAt: -1 }).lean(),
      SectionWeights.find().lean(),
      archiveId ? 
        Project.find({ archiveId }, { _id: 1, name: 1, archiveId: 1, useCustomTaadol: 1, customTaadolPercentages: 1, customSectionWeights: 1 }).lean() : 
        Project.find({}, { _id: 1, name: 1, useCustomTaadol: 1, customTaadolPercentages: 1, customSectionWeights: 1 }).lean(),
      archiveId ? 
        ProjectSection.find({ archiveId }, { _id: 1, projectId: 1, archiveId: 1 }).lean() : 
        ProjectSection.find({}, { _id: 1, projectId: 1 }).lean(),
      archiveId ? 
        ProjectIncome.find({ archiveId }, { projectId: 1, details: 1, archiveId: 1 }).lean() : 
        ProjectIncome.find({}, { projectId: 1, details: 1 }).lean()
    ])

    console.timeEnd('Database Queries')

    const systemPercent = systemPercentages || {
      خرید: 0,
      همکاری: 0,
      فروش: 0,
      طراحی: 0,
      پیمانکاری: 0,
      مشاوره: 0
    }

    // ایجاد نقشه‌های سریع برای جستجو
    const projectsMap = new Map(projects.map((p: any) => [p._id.toString(), p]))
    const sectionsMap = new Map(sections.map((s: any) => [s._id.toString(), s]))
    const incomesMap = new Map(incomes.map((i: any) => [i.projectId.toString(), i]))
    const weightsMap = new Map()
    
    // گروه‌بندی weights برای دسترسی سریع
    weights.forEach((w: any) => {
      const key = `${w.sectionName}_${w.fieldName}`
      weightsMap.set(key, w.weight)
    })

    // محاسبه درصد سیستم تعادل توزیع شده برای هر پروژه
    const distributedSystemPercents = new Map()
    for (const project of projects) {
      const projectSections = sections.filter((s: any) => s.projectId.toString() === (project as any)._id.toString())
      const activeSections = projectSections.filter((s: any) => s.isActive !== false)
      const inactiveSections = projectSections.filter((s: any) => s.isActive === false)
      
      const distributedPercent: Record<string, number> = {}
      
      // جمع درصد بخش‌های غیرفعال
      let inactivePercentSum = 0
      for (const section of inactiveSections) {
        const percent = (project as any).useCustomTaadol && (project as any).customTaadolPercentages 
          ? (project as any).customTaadolPercentages[section.sectionName] || 0
          : systemPercent[section.sectionName as keyof typeof systemPercent] || 0
        inactivePercentSum += percent
      }
      
      // توزیع بین بخش‌های فعال
      if (activeSections.length > 0 && inactivePercentSum > 0) {
        const percentPerActiveSection = inactivePercentSum / activeSections.length
        for (const section of activeSections) {
          const originalPercent = (project as any).useCustomTaadol && (project as any).customTaadolPercentages 
            ? (project as any).customTaadolPercentages[section.sectionName] || 0
            : systemPercent[section.sectionName as keyof typeof systemPercent] || 0
          distributedPercent[section.sectionName] = originalPercent + percentPerActiveSection
        }
      } else {
        // اگر هیچ بخش فعالی نیست یا درصد غیرفعالی نیست، درصد اصلی را نگه دار
        for (const section of activeSections) {
          distributedPercent[section.sectionName] = (project as any).useCustomTaadol && (project as any).customTaadolPercentages 
            ? (project as any).customTaadolPercentages[section.sectionName] || 0
            : systemPercent[section.sectionName as keyof typeof systemPercent] || 0
        }
      }
      
      distributedSystemPercents.set((project as any)._id.toString(), distributedPercent)
    }

    // تابع کمکی برای گرفتن وزن فیلد (مخصوص پروژه یا عمومی)
    const getWeightForProject = (project: any, sectionName: string, fieldName: string) => {
      // اگر پروژه وزن‌های مخصوص داره
      if (project.useCustomTaadol && project.customSectionWeights && Array.isArray(project.customSectionWeights)) {
        const customWeight = project.customSectionWeights.find(
          (w: any) => w.sectionName === sectionName && w.fieldName === fieldName
        )
        if (customWeight) {
          return customWeight.weight || 0
        }
      }
      // در غیر این صورت از وزن‌های عمومی استفاده کن
      const key = `${sectionName}_${fieldName}`
      return weightsMap.get(key) || 0
    }

    const commissions: any[] = []

    console.time('Processing Details')

    // تابع کمکی برای دریافت درصد سیستم تعادل توزیع شده
    const getSystemPercentForProject = (project: any, sectionName: string) => {
      const distributed = distributedSystemPercents.get(project._id.toString())
      if (distributed) {
        return distributed[sectionName] || 0
      }
      // fallback به درصد اصلی
      if (project.useCustomTaadol && project.customTaadolPercentages) {
        return project.customTaadolPercentages[sectionName] || 0
      }
      return systemPercent[sectionName as keyof typeof systemPercent] || 0
    }

    // بهینه‌سازی: دریافت تنها details مربوط به کاربر
    const withItemsCollections = [
      { model: PurchaseDetails, name: "خرید", percentField: "خرید" },
      { model: CollaborationDetails, name: "همکاری", percentField: "همکاری" },
      { model: SaleDetails, name: "فروش", percentField: "فروش" }
    ]

    // تابع کمکی برای پردازش commission
    const processCommission = (project: any, section: any, income: any, name: any, itemName: any, field: any, weightValue: any, systemPercentValue: any, value: any) => {
      if (value > 0 && weightValue > 0) {
        // مقدار دریافتی از project-income قبلاً پردازش شده است
        // (درصد سیستم کسر شده و مقدار نهایی محاسبه شده)
        // پس فقط باید درصد پورسانت را اعمال کنیم
        const commissionAmount = Math.round(value * weightValue / 100)
        
        commissions.push({
          projectId: project._id,
          projectName: project.name,
          sectionName: name,
          itemName: itemName || "",
          fieldName: field,
          income: value, // مقدار از project-income (قبلاً پردازش شده)
          weight: weightValue,
          systemPercent: systemPercentValue,
          commission: commissionAmount
        })
      }
    }

    // بهینه‌سازی محاسبه وزن‌ها
    const getSectionFields = (sectionName: string) => {
      const sectionFields: Record<string, string[]> = {
        خرید: [
          "متراژ",
          "استعلام قیمت",
          "هماهنگی با نصاب",
          "بودجه",
          "سفارش",
          "تحویل باربری",
          "گرفتن فاکتور نهایی",
        ],
        همکاری: [
          "بازدید",
          "ابعاد و اندازه",
          "براورد مالی",
          "برآورد زمانی",
          "قرارداد",
          "گرفتن بودجه",
          "تهیه جنس",
          "نظارت بر اجرای درست",
          "گرفتن فاکتور نهایی",
          "تحویل نهایی پروژه",
        ],
        فروش: [
          "متراژ",
          "۳ سطح پیشنهاد",
          "هماهنگی زمان و اندازه با نصاب",
          "گرفتن موجودی",
          "بودجه",
          "سفارش",
          "تحویل بار",
        ],
        طراحی: [
          "برداشت میدانی",
          "ترسیم وضع موجود",
          "طراحی اولیه",
          "نقشه نهایی 2d",
          "نقشه آماده 3d(نما-مقطع-پلان-روف-محوطه)",
          "3D Modeling",
          "3D Rendering & Animation",
          "نقشه اجرایی فاز ۱",
          "نقشه اجرایی فاز ۲",
          "آلبوم عکس و نقشه",
        ],
        پیمانکاری: [
          "فاصله زمانی",
          "سختی کار",
          "تحویل نهایی کار و آلبوم",
          "ارجاع توسط",
        ],
        مشاوره: [
          "بازدید",
          "پر کردن چک لیست",
          "مشاوره",
        ],
      }
      return sectionFields[sectionName] || []
    }

    const calculateDistributedWeights = (project: any, sectionName: string, allFields: string[], activeFields: string[]) => {
      const redistributedWeights = new Map()
      
      if (activeFields.length === 0) {
        return redistributedWeights
      }

      // محاسبه مجموع وزن‌های فیلدهای فعال
      let activeWeightsSum = 0
      let totalOriginalWeight = 0
      
      const activeWeights = new Map()
      
      for (const field of allFields) {
        const weight = getWeightForProject(project, sectionName, field)
        totalOriginalWeight += weight
        
        if (activeFields.includes(field)) {
          activeWeights.set(field, weight)
          activeWeightsSum += weight
        }
      }

      if (activeWeightsSum === 0) {
        return redistributedWeights
      }

      // محاسبه وزن‌های جدید با حفظ نسبت
      for (const field of activeFields) {
        const originalWeight = activeWeights.get(field) || 0
        const newWeight = (originalWeight / activeWeightsSum) * totalOriginalWeight
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
        const allFields = Array.from(new Set([
          ...getSectionFields(name),
          ...Object.keys(detailsObj),
        ]))
        const activeFields = allFields.filter(field => 
          !(detailsObj as any)[field] || (detailsObj as any)[field].isActive !== false
        )

        // پیدا کردن پروژه مربوط به این detail برای استفاده از وزن‌های صحیح
        const section = sectionsMap.get(detail.sectionId?.toString())
        const project = section ? projectsMap.get(section.projectId.toString()) : null

        // اگر بخش غیرفعال باشد، رد کن
        if (!section || section.isActive === false) continue

        // محاسبه وزن‌های بازتوزیع شده
        const redistributedWeights = project ? 
          calculateDistributedWeights(project, name, allFields, activeFields) :
          new Map()

        // بررسی تخصیص از طریق assignedMembers
        for (const [field, assignedId] of Object.entries(assignedMembers)) {
          if (!assignedId) continue

          const assignedMemberId = typeof assignedId === 'object' ? 
            assignedId.toString() : 
            assignedId?.toString()

          if (assignedMemberId === memberId) {
            // بررسی وضعیت فعال/غیرفعال از details
            const fieldDetails = (detailsObj as any)[field]
            const isActive = !fieldDetails || fieldDetails.isActive !== false

            if (isActive) {
              const section = sectionsMap.get(detail.sectionId?.toString())
              if (section) {
                const project = projectsMap.get(section.projectId.toString())
                const income = incomesMap.get(section.projectId.toString())

                if (project && income) {
                  const key = `${name}_${detail.itemName}_${field}`
                  const value = income.details?.[key]?.value || 0
                  const weightValue = redistributedWeights.get(field) || 0
                  const systemPercentValue = getSystemPercentForProject(project, percentField)
                  
                  processCommission(project, section, income, name, detail.itemName, field, weightValue, systemPercentValue, value)
                }
              }
            }
          }
        }

        // بررسی تخصیص از طریق details
        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          if (!fieldDetails || typeof fieldDetails !== 'object') continue

          const assignedMemberId = (fieldDetails as any).assignedMemberId?.toString()
          const isActive = (fieldDetails as any).isActive !== false

          if (assignedMemberId === memberId && isActive) {
            const section = sectionsMap.get(detail.sectionId?.toString())
            if (section) {
              const project = projectsMap.get(section.projectId.toString())
              const income = incomesMap.get(section.projectId.toString())

              if (project && income) {
                const key = `${name}_${detail.itemName}_${field}`
                const value = income.details?.[key]?.value || 0
                const weightValue = redistributedWeights.get(field) || 0
                const systemPercentValue = getSystemPercentForProject(project, percentField)
                
                processCommission(project, section, income, name, detail.itemName, field, weightValue, systemPercentValue, value)
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
        const allFields = Array.from(new Set([
          ...getSectionFields(name),
          ...Object.keys(detailsObj),
        ]))
        const activeFields = allFields.filter(field => {
          const fieldDetails = (detailsObj as any)[field]
          return typeof fieldDetails === 'object' && (fieldDetails as any)?.isActive !== false
        })

        // پیدا کردن پروژه مربوط به این detail
        const section = sectionsMap.get(detail.sectionId?.toString())
        const project = section ? projectsMap.get(section.projectId.toString()) : null

        // اگر بخش غیرفعال باشد، رد کن
        if (!section || section.isActive === false) continue

        // محاسبه وزن‌های بازتوزیع شده
        const redistributedWeights = project ?
          calculateDistributedWeights(project, name, allFields, activeFields) :
          new Map()

        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          let assignedMemberId = null
          let isActive = true

          // بررسی ساختار details
          if (typeof fieldDetails === 'object') {
            assignedMemberId = (fieldDetails as any)?.assignedMemberId?.toString()
            isActive = (fieldDetails as any)?.isActive !== false
          }
          
          if (assignedMemberId === memberId && isActive) {
            const section = sectionsMap.get(detail.sectionId?.toString())
            if (section) {
              const project = projectsMap.get(section.projectId.toString())
              const income = incomesMap.get(section.projectId.toString())

              if (project && income) {
                const key = `${name}_${field}`
                const value = income.details?.[key]?.value || 0
                const weightValue = redistributedWeights.get(field) || 0
                const systemPercentValue = getSystemPercentForProject(project, percentField)
                
                processCommission(project, section, income, name, "", field, weightValue, systemPercentValue, value)
              }
            }
          }
        }
      }
    }

    console.timeEnd('Processing Details')
    console.time('UserCommission Query')

    // دریافت حالت‌های ذخیره شده از UserCommission
    const savedCommissions = await UserCommission.find({
      userId: memberId,
      ...(archiveId && { archiveId })
    }).lean()

    console.timeEnd('UserCommission Query')
    console.time('Final Processing')

    // اضافه کردن حالت isActive به هر commission
    const commissionsWithStatus = commissions.map(commission => {
      const savedCommission = savedCommissions.find(saved => 
        saved.projectId.toString() === (commission as any).projectId.toString() &&
        saved.sectionName === (commission as any).sectionName &&
        saved.fieldName === (commission as any).fieldName &&
        ((commission as any).itemName ? saved.itemName === (commission as any).itemName : !saved.itemName)
      )
      
      return {
        ...commission,
        isActive: savedCommission ? savedCommission.isActive : true // پیش‌فرض فعال
      }
    })

    console.timeEnd('Final Processing')
    console.timeEnd('API Total')
    console.log(`Processed ${commissionsWithStatus.length} commissions`)

    return NextResponse.json(commissionsWithStatus)
  } catch (error) {
    console.error("Error fetching user commissions:", error)
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات پورسانت" },
      { status: 500 }
    )
  }
}