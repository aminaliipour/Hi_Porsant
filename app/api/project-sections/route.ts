import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ProjectSection } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let query = {}
    if (projectId) {
      query = { projectId }
    }

    const sections = await ProjectSection.find(query).sort({ sectionName: 1 })
    return NextResponse.json(sections)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت بخش‌های پروژه" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    const section = new ProjectSection({
      projectId: body.projectId,
      sectionName: body.sectionName,
      isActive: body.isActive !== undefined ? body.isActive : true,
    })

    await section.save()
    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد بخش پروژه" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    const section = await ProjectSection.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    )
    if (!section) {
      return NextResponse.json({ error: "بخش یافت نشد" }, { status: 404 })
    }
    return NextResponse.json(section)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی بخش پروژه" }, { status: 500 })
  }
}
