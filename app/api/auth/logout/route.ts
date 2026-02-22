import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Session from "@/lib/models/Session"

async function handleLogout(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value

        if (token) {
            await dbConnect()
            await Session.deleteOne({ token })
        }

        const response = NextResponse.redirect(new URL("/login", req.url))
        response.cookies.delete("auth_token")

        return response
    } catch (error) {
        console.error("Logout error:", error)
        const response = NextResponse.redirect(new URL("/login", req.url))
        response.cookies.delete("auth_token")
        return response
    }
}

export async function GET(req: NextRequest) {
    return handleLogout(req)
}

export async function POST(req: NextRequest) {
    return handleLogout(req)
}
