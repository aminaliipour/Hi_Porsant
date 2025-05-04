import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { DesignDetails } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await DesignDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات طراحی یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in design-details/[id] GET:", error)
    return NextResponse.json({ error: "خطا در دریافت جزئیات طراحی" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = await DesignDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات طراحی یافت نشد" }, { status: 404 })
    }

    if (body.assignedMembers) details.assignedMembers = body.assignedMembers
    if (body.details) details.details = body.details

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in design-details/[id] PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات طراحی" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await DesignDetails.findByIdAndDelete(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات طراحی یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "جزئیات طراحی با موفقیت حذف شد" })
  } catch (error) {
    console.error("Error in design-details/[id] DELETE:", error)
    return NextResponse.json({ error: "خطا در حذف جزئیات طراحی" }, { status: 500 })
  }
}
