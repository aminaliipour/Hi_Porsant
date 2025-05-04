import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { PurchaseDetails } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("sectionId")

    let query = {}
    if (sectionId) {
      query = { sectionId }
    }

    const details = await PurchaseDetails.find(query).sort({ createdAt: -1 })
    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت جزئیات خرید" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await dbConnect()

    const details = new PurchaseDetails({
      sectionId: body.sectionId,
      itemName: body.itemName,
      details: body.details || {},
      assignedMembers: body.assignedMembers || {},
    })

    await details.save()
    return NextResponse.json(details, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "خطا در ایجاد جزئیات خرید" }, { status: 500 })
  }
}
