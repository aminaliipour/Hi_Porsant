import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import {
  Project,
  ProjectSection,
  ProjectIncome,
  PurchaseDetails,
  CollaborationDetails,
  SaleDetails,
  DesignDetails,
  ContractingDetails,
  ConsultationDetails,
  SectionWeights
} from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = 10 // Number of projects to process per request

    await dbConnect()
    const memberId = params.id

    // دریافت اطلاعات وزن‌های بخش‌ها
    const weights = await SectionWeights.find().lean()
    console.log("Section weights validation:", weights.map(w => ({
      id: w._id,
      section: w.sectionName,
      field: w.fieldName,
      weight: w.weight
    })))

    // دریافت بخش‌های پروژه‌ها
    const sections = await ProjectSection.find().lean()
    console.log("Project sections validation:", sections.map(s => ({
      id: s._id,
      projectId: s.projectId,
      name: s.sectionName,
      assignedMember: s.assignedMemberId
    })))

    // دریافت اطلاعات درآمد همه پروژه‌ها
    const incomes = await ProjectIncome.find().lean()
    console.log("Income data validation:", incomes.map(income => ({
      projectId: income.projectId,
      details: Object.entries(income.details || {}).map(([key, detail]) => ({
        key,
        value: detail.value,
        isActive: detail.isActive
      }))
    })))

    // بررسی بخش‌های دارای آیتم
    const withItemsCollections = [
      { model: PurchaseDetails, name: "خرید" },
      { model: CollaborationDetails, name: "همکاری" },
      { model: SaleDetails, name: "فروش" }
    ]

    // Filter projects based on cursor
    const projects = await Project.find().lean()
    const startIndex = cursor 
      ? projects.findIndex(p => p._id.toString() === cursor) + 1 
      : 0
    
    const paginatedProjects = projects.slice(startIndex, startIndex + limit)
    const commissions: any[] = []

    // Process only paginated projects
    for (const project of paginatedProjects) {
      const projectSections = sections.filter(s => s.projectId.toString() === project._id.toString())

      for (const { model, name } of withItemsCollections) {
        const details = await model.find()
        
        for (const detail of details) {
          const section = projectSections.find(s => s._id.toString() === detail.sectionId.toString())
          const income = section ? incomes.find(i => 
            i.projectId.toString() === section.projectId.toString()
          ) : null

          if (section?.assignedMemberId?.toString() === memberId) {
            console.log(`Processing section ${name} for project ${project?.name}:`, {
              sectionId: section._id,
              projectId: project?._id,
              hasIncome: !!income,
              incomeDetails: income ? Object.keys(income.details || {}) : []
            })

            for (const [field, data] of detail.details.entries()) {
              if (data.value > 0) {
                const weight = weights.find(w => 
                  w.sectionName === name && 
                  w.fieldName === field
                )
                
                console.log(`Weight matching for ${name}/${field}:`, {
                  sectionName: name,
                  fieldName: field,
                  foundWeight: weight ? {
                    weight: weight.weight,
                    sectionName: weight.sectionName,
                    fieldName: weight.fieldName
                  } : null,
                  allMatchingWeights: weights
                    .filter(w => w.sectionName === name || w.fieldName === field)
                    .map(w => ({
                      weight: w.weight,
                      sectionName: w.sectionName,
                      fieldName: w.fieldName
                    }))
                })

                if (project && income) {
                  const key = `${name}_${field}`
                  const value = income.details?.[key]?.value || 0
                  const weightValue = weight?.weight || 0

                  if (value > 0 && weightValue > 0) {
                    console.log(`Found commission for ${name}:`, {
                      project: project.name,
                      field,
                      value,
                      weight: weightValue
                    })

                    commissions.push({
                      projectId: project._id,
                      projectName: project.name,
                      sectionName: name,
                      itemName: detail.itemName,
                      fieldName: field,
                      income: value,
                      weight: weightValue,
                      commission: Math.round(value * weightValue)
                    })
                  }
                }
              }
            }
          }
        }
      }
    }

    // بررسی بخش‌های بدون آیتم
    const withoutItemsCollections = [
      { model: DesignDetails, name: "طراحی" },
      { model: ContractingDetails, name: "پیمانکاری" },
      { model: ConsultationDetails, name: "مشاوره" }
    ]

    for (const { model, name } of withoutItemsCollections) {
      const details = await model.find()
      console.log(`Processing ${name} details:`, details.length)
      
      for (const detail of details) {
        if (!detail.details) {
          console.log(`Skipping ${name} detail - no details found`)
          continue
        }
        
        const detailsObj = detail.details instanceof Map ? 
          Object.fromEntries(detail.details) : 
          (typeof detail.details.toObject === 'function' ? 
            detail.details.toObject() : detail.details)

        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          if (fieldDetails?.assignedMemberId?.toString() === memberId) {
            const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
            if (section) {
              const project = await Project.findById(section.projectId)
              const income = incomes.find(i => i.projectId.toString() === section.projectId.toString())
              const weight = weights.find(w => 
                w.sectionName === name && 
                w.fieldName === field
              )

              if (project && income) {
                const key = `${name}_${field}`
                const value = income.details?.[key]?.value || 0
                const weightValue = weight?.weight || 0

                if (value > 0 && weightValue > 0) {
                  console.log(`Found commission for ${name}:`, {
                    project: project.name,
                    field,
                    value,
                    weight: weightValue
                  })

                  commissions.push({
                    projectId: project._id,
                    projectName: project.name,
                    sectionName: name,
                    fieldName: field,
                    income: value,
                    weight: weightValue,
                    commission: Math.round(value * weightValue)
                  })
                }
              }
            }
          }
        }
      }
    }

    console.log("Final calculated commissions:", commissions)
    const nextCursor = startIndex + limit < projects.length 
      ? projects[startIndex + limit - 1]._id.toString()
      : null

    return NextResponse.json({
      commissions,
      nextCursor,
      hasMore: nextCursor !== null
    })
  } catch (error) {
    console.error("Error in commissions route:", error)
    return NextResponse.json({ error: "خطا در محاسبه پورسانت‌ها" }, { status: 500 })
  }
}
