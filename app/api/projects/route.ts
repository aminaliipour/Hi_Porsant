import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Project } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const projects = await Project.find({})
      .select('name hasIncome createdAt updatedAt') // حذف type
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

    if (!body.name) {
      return NextResponse.json({ error: "نام پروژه الزامی است" }, { status: 400 })
    }

    const project = new Project({
      name: body.name,
    })

    await project.save()
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error in projects POST:", error)
    return NextResponse.json({ error: "خطا در ایجاد پروژه" }, { status: 500 })
  }
}
