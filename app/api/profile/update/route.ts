import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"

async function getUser(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) return null
    await dbConnect()
    const session = await Session.findOne({ token }).populate("userId")
    return session?.userId
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()

        // فیلڈز کی تصدیق
        const updateFields: any = {}
        
        // قابلِ تبدیل فیلڈز
        const editableFields = [
            "name",
            "jobTitle",
            "email",
            "phoneNumber",
            "fatherName",
            "education",
            "address",
            "bankAccount",
            "cardNumber"
        ]

        for (const field of editableFields) {
            if (body[field] !== undefined) {
                updateFields[field] = body[field]
            }
        }

        // صارف کو اپڈیٹ کریں
        await dbConnect()
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            updateFields,
            { new: true }
        )

        return NextResponse.json({ 
            user: updatedUser,
            message: "پروفایل بروز شد"
        })
    } catch (error) {
        console.error("Update error:", error)
        return NextResponse.json(
            { message: "خطا در بروزرسانی" },
            { status: 500 }
        )
    }
}
