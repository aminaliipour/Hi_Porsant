import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ConsultationDetails } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await ConsultationDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات مشاوره یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in consultation-details/[id] GET:", error)
    return NextResponse.json({ error: "خطا در دریافت جزئیات مشاوره" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = await ConsultationDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات مشاوره یافت نشد" }, { status: 404 })
    }

    if (body.assignedMembers) details.assignedMembers = body.assignedMembers
    if (body.details) details.details = body.details

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in consultation-details/[id] PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات مشاوره" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await ConsultationDetails.findByIdAndDelete(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات مشاوره یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "جزئیات مشاوره با موفقیت حذف شد" })
  } catch (error) {
    console.error("Error in consultation-details/[id] DELETE:", error)
    return NextResponse.json({ error: "خطا در حذف جزئیات مشاوره" }, { status: 500 })
  }
}
