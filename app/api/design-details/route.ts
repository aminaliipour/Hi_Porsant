import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { DesignDetails } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("sectionId")

    if (!sectionId) {
      return NextResponse.json({ error: "شناسه بخش مورد نیاز است" }, { status: 400 })
    }

    const details = await DesignDetails.find({ sectionId })
    return NextResponse.json(details)
  } catch (error) {
    console.error("Error in design-details GET:", error)
    return NextResponse.json({ error: "خطا در دریافت جزئیات طراحی" }, { status: 500 })
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
    const existingDetails = await DesignDetails.findOne({ sectionId })

    if (existingDetails) {
      // Update existing details
      existingDetails.details = details
      await existingDetails.save()
      return NextResponse.json(existingDetails)
    } else {
      // Create new details
      const newDetails = await DesignDetails.create({
        sectionId,
        details,
      })
      return NextResponse.json(newDetails)
    }
  } catch (error) {
    console.error("Error in design-details POST:", error)
    return NextResponse.json({ error: "خطا در ذخیره جزئیات طراحی" }, { status: 500 })
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

    const updatedDetails = await DesignDetails.findByIdAndUpdate(
      id,
      { details },
      { new: true }
    )

    if (!updatedDetails) {
      return NextResponse.json({ error: "جزئیات طراحی یافت نشد" }, { status: 404 })
    }

    return NextResponse.json(updatedDetails)
  } catch (error) {
    console.error("Error in design-details PUT:", error)
    return NextResponse.json({ error: "خطا در بروزرسانی جزئیات طراحی" }, { status: 500 })
  }
}
