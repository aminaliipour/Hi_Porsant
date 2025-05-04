import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { CollaborationDetails } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await CollaborationDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات همکاری یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت جزئیات همکاری" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = await CollaborationDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات همکاری یافت نشد" }, { status: 404 })
    }

    if (body.itemName) details.itemName = body.itemName
    if (body.details) details.details = body.details
    if (body.assignedMembers) details.assignedMembers = body.assignedMembers

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات همکاری" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await CollaborationDetails.findByIdAndDelete(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات همکاری یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "جزئیات همکاری با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف جزئیات همکاری" }, { status: 500 })
  }
}
