import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ContractingDetails } from "@/lib/models"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await ContractingDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات پیمانکاری یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in contracting-details/[id] GET:", error)
    return NextResponse.json({ error: "خطا در دریافت جزئیات پیمانکاری" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = await ContractingDetails.findById(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات پیمانکاری یافت نشد" }, { status: 404 })
    }

    if (body.assignedMembers) details.assignedMembers = body.assignedMembers
    if (body.details) details.details = body.details

    await details.save()
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in contracting-details/[id] PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات پیمانکاری" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const details = await ContractingDetails.findByIdAndDelete(params.id)

    if (!details) {
      return NextResponse.json({ error: "جزئیات پیمانکاری یافت نشد" }, { status: 404 })
    }

    return NextResponse.json({ message: "جزئیات پیمانکاری با موفقیت حذف شد" })
  } catch (error) {
    console.error("Error in contracting-details/[id] DELETE:", error)
    return NextResponse.json({ error: "خطا در حذف جزئیات پیمانکاری" }, { status: 500 })
  }
}
