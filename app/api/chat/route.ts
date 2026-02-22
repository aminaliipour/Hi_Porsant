import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/lib/models/Message"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"

async function getUser(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) return null
    await dbConnect()
    const session = await Session.findOne({ token }).populate("userId")
    return session?.userId
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        // Mark all unread public messages as read for this user
        await Message.updateMany(
            {
                readBy: { $nin: [user._id] }
            },
            { $addToSet: { readBy: user._id } }
        )

        const messages = await Message.find()
            .populate("sender", "name avatar")
            .sort({ createdAt: 1 }) // Oldest first
            .limit(100)

        return NextResponse.json(messages)
    } catch (error) {
        console.error("Chat GET Error:", error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { content, type, fileUrl } = body

        if (!content && type === "text") {
            return NextResponse.json({ message: "Content is required" }, { status: 400 })
        }

        const newMessage = await Message.create({
            sender: user._id,
            content: content || "File", // Fallback for file only messages
            type: type || "text",
            fileUrl
        })

        const populatedMessage = await newMessage.populate("sender", "name avatar")

        return NextResponse.json(populatedMessage, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
