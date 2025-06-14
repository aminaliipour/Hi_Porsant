import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project } from "@/lib/models"
import { ProjectSection } from "@/lib/models/project-section.model"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const archiveId = searchParams.get("archiveId")
    const filter: any = {}
    if (archiveId) filter.archiveId = archiveId
    const projects = await Project.find(filter)
      .select('name archiveId createdAt updatedAt')
      .sort({ createdAt: -1 })
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error in projects GET:", error)
    return NextResponse.json({ error: "خطا در دریافت پروژه‌ها" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    if (!body.name || !body.archiveId) {
      return NextResponse.json({ error: "نام پروژه و آرشیو الزامی است" }, { status: 400 })
    }

    // جلوگیری از ایجاد پروژه تکراری با نام یکسان در هر آرشیو
    const existingProject = await Project.findOne({ name: body.name, archiveId: body.archiveId })
    if (existingProject) {
      return NextResponse.json({ error: "پروژه‌ای با این نام در این آرشیو وجود دارد" }, { status: 400 })
    }

    const project = new Project({
      name: body.name,
      archiveId: body.archiveId,
    })

    await project.save()
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error in projects POST:", error)
    return NextResponse.json({ error: "خطا در ایجاد پروژه" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { ids, archiveId } = body
    if (!Array.isArray(ids) || !archiveId) {
      return NextResponse.json({ error: "ids (آرایه) و archiveId الزامی است" }, { status: 400 })
    }
    // بروزرسانی پروژه‌ها
    await Project.updateMany({ _id: { $in: ids } }, { $set: { archiveId } })
    // بروزرسانی بخش‌های همه پروژه‌ها
    await ProjectSection.updateMany({ projectId: { $in: ids } }, { $set: { archiveId } })
    return NextResponse.json({ message: "پروژه‌ها و بخش‌ها با موفقیت منتقل شدند" })
  } catch (error) {
    console.error("Error in group archive PUT:", error)
    return NextResponse.json({ error: "خطا در انتقال گروهی پروژه‌ها" }, { status: 500 })
  }
}
