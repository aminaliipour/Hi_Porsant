import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"
import crypto from "crypto"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { loginId } = body

        if (!loginId) {
            return NextResponse.json(
                { message: "لطفا شناسه ورود را وارد کنید" },
                { status: 400 }
            )
        }

        await dbConnect()

        let user

        // Check for Admin
        if (loginId === "123@123@123") {
            // Find or create admin user
            user = await User.findOne({ role: "admin" })
            if (!user) {
                user = await User.create({
                    name: "مدیر سیستم",
                    nationalCode: "admin",
                    role: "admin",
                    jobTitle: "مدیر کل",
                })
            }
        } else {
            // Check for regular user by National ID
            user = await User.findOne({ nationalCode: loginId })
            if (!user) {
                return NextResponse.json(
                    { message: "کاربری با این مشخصات یافت نشد" },
                    { status: 401 }
                )
            }
        }

        // Create Session
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await Session.create({
            token,
            userId: user._id,
            expiresAt,
        })

        // Create response with cookie
        const response = NextResponse.json(
            { message: "ورود موفقیت‌آمیز بود", user: { name: user.name, role: user.role } },
            { status: 200 }
        )

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: expiresAt,
            path: "/",
        })

        return response
    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json(
            { message: "خطای سرور" },
            { status: 500 }
        )
    }
}
