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
    const body = await request.json()
    await dbConnect()

    if (!body.name) {
      return NextResponse.json({ error: "نام پروژه الزامی است" }, { status: 400 })
    }

    const project = await Project.findByIdAndUpdate(
      params.id,
      { name: body.name },
      { new: true }
    )

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
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
