import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { ConsultationDetails } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("sectionId")

    if (!sectionId) {
      return NextResponse.json({ error: "شناسه بخش مورد نیاز است" }, { status: 400 })
    }

    const details = await ConsultationDetails.find({ sectionId })
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in consultation-details GET:", error)
    return NextResponse.json({ error: "خطا در دریافت جزئیات مشاوره" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { sectionId, details } = body

    if (!sectionId) {
      return NextResponse.json({ error: "شناسه بخش مورد نیاز است" }, { status: 400 })
    }

    // Check if details already exist for this section
    const existingDetails = await ConsultationDetails.findOne({ sectionId })

    if (existingDetails) {
      // Update existing details
      existingDetails.details = details
      await existingDetails.save()
      return NextResponse.json(existingDetails)
    } else {
      // Create new details
      const newDetails = await ConsultationDetails.create({
        sectionId,
        details,
      })
      return NextResponse.json(newDetails)
    }
  } catch (error) {
    console.error("Error in consultation-details POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره جزئیات مشاوره" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    const { id, details } = body

    if (!id) {
      return NextResponse.json({ error: "شناسه جزئیات مورد نیاز است" }, { status: 400 })
    }

    const updatedDetails = await ConsultationDetails.findByIdAndUpdate(
      id,
      { details },
      { new: true }
    )

    if (!updatedDetails) {
      return NextResponse.json({ error: "جزئیات مشاوره یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(updatedDetails)
  } catch (error) {
    console.error("Error in consultation-details PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات مشاوره" }, { status: 500 })
  }
}
