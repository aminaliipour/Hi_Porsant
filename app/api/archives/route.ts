import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { Archive } from "@/lib/models"

// GET: لیست همه آرشیوها
export async function GET() {
  try {
    await dbConnect()
    const archives = await Archive.find({}).sort({ createdAt: -1 })
    return NextResponse.json(archives)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت آرشیوها" }, { status: 500 })
  }
}

// POST: ایجاد آرشیو جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()
    if (!body.name || !body.month || !body.year) {
      return NextResponse.json({ error: "نام، ماه و سال الزامی است" }, { status: 400 })
    }
    const archive = new Archive({
      name: body.name,
      month: body.month,
      year: body.year,
    })
    await archive.save()
    return NextResponse.json(archive, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد آرشیو" }, { status: 500 })
  }
}

// PUT: ویرایش آرشیو
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()
    if (!body._id) {
      return NextResponse.json({ error: "آیدی آرشیو الزامی است" }, { status: 400 })
    }
    const archive = await Archive.findByIdAndUpdate(body._id, body, { new: true })
    return NextResponse.json(archive)
  } catch (error) {
    return NextResponse.json({ error: "خطا در ویرایش آرشیو" }, { status: 500 })
  }
}

// DELETE: حذف آرشیو
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "آیدی آرشیو الزامی است" }, { status: 400 })
    }
    await dbConnect()
    await Archive.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف آرشیو" }, { status: 500 })
  }
}
