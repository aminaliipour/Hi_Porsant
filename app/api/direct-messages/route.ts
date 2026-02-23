import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import DirectMessage from "@/lib/models/DirectMessage"
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
        const { receiverId, content, type, fileUrl } = body

        if (!receiverId) {
            return NextResponse.json({ message: "receiverId is required" }, { status: 400 })
        }

        if (!content && type === "text") {
            return NextResponse.json({ message: "Content is required" }, { status: 400 })
        }

        const targetUser = await User.findById(receiverId)
        if (!targetUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        const newMessage = await DirectMessage.create({
            sender: user._id,
            receiver: receiverId,
            content: content || "File",
            type: type || "text",
            fileUrl
        })

        const populatedMessage = await newMessage.populate([
            { path: "sender", select: "name avatar" },
            { path: "receiver", select: "name avatar" }
        ])

        return NextResponse.json(populatedMessage, { status: 201 })
    } catch (error) {
        console.error("DirectMessage POST Error:", error)
        return NextResponse.json({ message: "Server Error", error: String(error) }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return NextResponse.json({ message: "userId is required" }, { status: 400 })
        }

        const targetUser = await User.findById(userId)
        if (!targetUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        // Mark all unread messages from the other user as read
        await DirectMessage.updateMany(
            {
                sender: userId,
                receiver: user._id,
                readBy: { $nin: [user._id] }
            },
            { $addToSet: { readBy: user._id } }
        )

        const messages = await DirectMessage.find({
            $or: [
                { sender: user._id, receiver: userId },
                { sender: userId, receiver: user._id }
            ]
        })
            .populate("sender", "name avatar")
            .populate("receiver", "name avatar")
            .sort({ createdAt: 1 })

        return NextResponse.json(messages)
    } catch (error) {
        console.error("DirectMessage GET Error:", error)
        return NextResponse.json({ message: "Server Error", error: String(error) }, { status: 500 })
    }
}
