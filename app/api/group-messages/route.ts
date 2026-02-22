import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import GroupMessage from "@/lib/models/GroupMessage"
import ChatGroup from "@/lib/models/ChatGroup"
import Session from "@/lib/models/Session"
import User from "@/lib/models/User"

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

        const { searchParams } = new URL(req.url)
        const groupId = searchParams.get("groupId")

        if (!groupId) {
            return NextResponse.json({ message: "groupId is required" }, { status: 400 })
        }

        // Verify user is in the group
        const group = await ChatGroup.findById(groupId)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        const isMember = group.members.includes(user._id)
        if (!isMember && group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        // Mark all unread group messages as read for this user
        await GroupMessage.updateMany(
            {
                chatGroup: groupId,
                readBy: { $nin: [user._id] }
            },
            { $addToSet: { readBy: user._id } }
        )

        const messages = await GroupMessage.find({ chatGroup: groupId })
            .populate("sender", "name avatar")
            .sort({ createdAt: 1 })

        return NextResponse.json(messages)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { groupId, content, type, fileUrl } = body

        if (!groupId || !content) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // Verify user is in the group
        const group = await ChatGroup.findById(groupId)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        const isMember = group.members.includes(user._id)
        if (!isMember && group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const newMessage = await GroupMessage.create({
            chatGroup: groupId,
            sender: user._id,
            content,
            type: type || "text",
            fileUrl
        })

        const populatedMessage = await newMessage.populate("sender", "name avatar")

        return NextResponse.json(populatedMessage, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
