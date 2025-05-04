import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { SaleDetails } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await SaleDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات فروش یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت جزئیات فروش" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = await SaleDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات فروش یافت نشد" }, { status: 404 })
    }

    if (body.itemName) details.itemName = body.itemName
    if (body.details) details.details = body.details
    if (body.assignedMembers) details.assignedMembers = body.assignedMembers

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات فروش" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await SaleDetails.findByIdAndDelete(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات فروش یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "جزئیات فروش با موفقیت حذف شد" })
  } catch (error) {
    return NextResponse.json({ error: "خطا در حذف جزئیات فروش" }, { status: 500 })
  }
}
