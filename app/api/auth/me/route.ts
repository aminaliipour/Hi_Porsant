import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Session from "@/lib/models/Session"
import User from "@/lib/models/User"

export async function GET(req: NextRequest) {
    // Ensure User model is registered
    const _userModel = User;

    try {
        const token = req.cookies.get("auth_token")?.value

        if (!token) {
            return NextResponse.json(
                { message: "احراز هویت نشده‌اید" },
                { status: 401 }
            )
        }

        await dbConnect()

        const session = await Session.findOne({ token }).populate("userId")

        if (!session || !session.userId) {
            return NextResponse.json(
                { message: "نشست نامعتبر است" },
                { status: 401 }
            )
        }

        const user = session.userId

        return NextResponse.json({
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                nationalCode: user.nationalCode,
                jobTitle: user.jobTitle,
                avatar: user.avatar,
                email: user.email,
                phoneNumber: user.phoneNumber,
                fatherName: user.fatherName,
                education: user.education,
                address: user.address,
                bankAccount: user.bankAccount,
                cardNumber: user.cardNumber,
            },
        })
    } catch (error) {
        console.error("Get Me error:", error)
        return NextResponse.json(
            { message: "خطای سرور" },
            { status: 500 }
        )
    }
}
