import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import {
  Project,
  ProjectSection,
  PurchaseDetails,
  CollaborationDetails,
  SaleDetails,
  DesignDetails,
  ContractingDetails,
  ConsultationDetails,
} from "@/lib/models"
import mongoose from "mongoose"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const memberId = params.id
    const assignments = []

    // دریافت تمام بخش‌های پروژه
    const sections = await ProjectSection.find()
    
    // جستجوی بخش‌های دارای آیتم
    const withItemsCollections = [
      { model: PurchaseDetails, name: "خرید" },
      { model: CollaborationDetails, name: "همکاری" },
      { model: SaleDetails, name: "فروش" }
    ]

    for (const { model, name } of withItemsCollections) {
      const details = await model.find()
      
      for (const detail of details) {
        if (!detail.assignedMembers) continue
        
        // تبدیل Map به Object برای راحتی کار
        let assignedMembers = {}
        if (detail.assignedMembers instanceof Map) {
          assignedMembers = Object.fromEntries(detail.assignedMembers)
        } else if (detail.assignedMembers.toObject) {
          assignedMembers = detail.assignedMembers.toObject()
        } else if (typeof detail.assignedMembers === 'object') {
          assignedMembers = detail.assignedMembers
        }
        
        for (const [field, assignedId] of Object.entries(assignedMembers)) {
          if (assignedId?.toString() === memberId) {
            const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
            if (section) {
              const project = await Project.findById(section.projectId)
              if (project) {
                assignments.push({
                  projectName: project.name,
                  sectionName: name,
                  itemName: detail.itemName,
                  fieldName: field
                })
              }
            }
          }
        }
      }
    }

    // جستجوی بخش‌های بدون آیتم
    const withoutItemsCollections = [
      { model: DesignDetails, name: "طراحی" },
      { model: ContractingDetails, name: "پیمانکاری" },
      { model: ConsultationDetails, name: "مشاوره" }
    ]

    for (const { model, name } of withoutItemsCollections) {
      const details = await model.find()
      
      for (const detail of details) {
        if (!detail.details) continue
        
        // تبدیل Map به Object برای راحتی کار
        let detailsObj = {}
        if (detail.details instanceof Map) {
          detailsObj = Object.fromEntries(detail.details)
        } else if (detail.details.toObject) {
          detailsObj = detail.details.toObject()
        } else if (typeof detail.details === 'object') {
          detailsObj = detail.details
        }
        
        for (const [field, fieldDetails] of Object.entries(detailsObj)) {
          if (fieldDetails?.assignedMemberId?.toString() === memberId) {
            const section = sections.find(s => s._id.toString() === detail.sectionId?.toString())
            if (section) {
              const project = await Project.findById(section.projectId)
              if (project) {
                assignments.push({
                  projectName: project.name,
                  sectionName: name,
                  fieldName: field
                })
              }
            }
          }
        }
      }
    }

    console.log("Found assignments:", assignments)
    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error in assignments route:", error)
    return NextResponse.json({ error: "خطا در دریافت وظایف اختصاص داده شده" }, { status: 500 })
  }
}
