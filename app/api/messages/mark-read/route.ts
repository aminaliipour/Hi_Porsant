import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import DirectMessage from "@/lib/models/DirectMessage"
import GroupMessage from "@/lib/models/GroupMessage"
import Session from "@/lib/models/Session"
import User from "@/lib/models/User"

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
        const { type, messageIds, chatId } = body

        if (!type || !messageIds || messageIds.length === 0) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        if (type === "direct") {
            // Mark direct messages as read
            await DirectMessage.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { readBy: user._id } }
            )
        } else if (type === "group") {
            // Mark group messages as read
            await GroupMessage.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { readBy: user._id } }
            )
        }

        return NextResponse.json({ message: "Messages marked as read" })
    } catch (error) {
        console.error("Mark as read error:", error)
        return NextResponse.json({ message: "Server Error", error: String(error) }, { status: 500 })
    }
}
