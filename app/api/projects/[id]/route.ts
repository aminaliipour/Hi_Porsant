import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project, ProjectSection } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const project = await Project.findById(params.id)

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت پروژه" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const projectId = params.id
    const body = await request.json()
    const { archiveId, useCustomTaadol, customTaadolPercentages, customSectionWeights, ...updateFields } = body

    const updateData: any = { ...updateFields }
    
    // به‌روزرسانی archiveId
    if (archiveId !== undefined) {
      updateData.archiveId = archiveId
    }
    
    // به‌روزرسانی useCustomTaadol
    if (typeof useCustomTaadol === 'boolean') {
      updateData.useCustomTaadol = useCustomTaadol
    }
    
    // به‌روزرسانی customTaadolPercentages
    if (customTaadolPercentages !== undefined) {
      updateData.customTaadolPercentages = {
        خرید: customTaadolPercentages.خرید || 0,
        همکاری: customTaadolPercentages.همکاری || 0,
        فروش: customTaadolPercentages.فروش || 0,
        طراحی: customTaadolPercentages.طراحی || 0,
        پیمانکاری: customTaadolPercentages.پیمانکاری || 0,
        مشاوره: customTaadolPercentages.مشاوره || 0,
      }
    }

    // به‌روزرسانی customSectionWeights
    if (customSectionWeights !== undefined) {
      updateData.customSectionWeights = customSectionWeights
    }

    // به‌روزرسانی پروژه
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true }
    )
    if (!updatedProject) {
      return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 })
    }

    // اگر archiveId تغییر کرد، بخش‌های پروژه را هم آپدیت کن
    if (archiveId !== undefined) {
      await ProjectSection.updateMany(
        { projectId },
        { $set: { archiveId } }
      )
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error in project PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی پروژه" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    // حذف پروژه و همه بخش‌های مرتبط با آن
    const project = await Project.findByIdAndDelete(params.id)

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 })
    }

    // حذف بخش‌های مرتبط با پروژه
    await ProjectSection.deleteMany({ projectId: params.id })

    return NextResponse.json({ message: "پروژه با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف پروژه" }, { status: 500 })
  }
}
