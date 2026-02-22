import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import DirectMessage from "@/lib/models/DirectMessage"
import GroupMessage from "@/lib/models/GroupMessage"
import Message from "@/lib/models/Message"
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

        // Get unread direct messages count for each conversation
        const directUnread = await DirectMessage.aggregate([
            {
                $match: {
                    receiver: user._id,
                    readBy: { $nin: [user._id] }
                }
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 }
                }
            }
        ])

        // Get unread group messages count for each group
        const groupsForUser = await ChatGroup.find({
            $or: [
                { admin: user._id },
                { members: user._id }
            ]
        }).select("_id")

        const groupIds = groupsForUser.map(g => g._id)

        const groupUnread = await GroupMessage.aggregate([
            {
                $match: {
                    chatGroup: { $in: groupIds },
                    readBy: { $nin: [user._id] }
                }
            },
            {
                $group: {
                    _id: "$chatGroup",
                    count: { $sum: 1 }
                }
            }
        ])

        // Get unread public messages count
        const publicUnread = await Message.countDocuments({
            readBy: { $nin: [user._id] }
        })

        const unreadData = {
            direct: Object.fromEntries(
                directUnread.map(item => [item._id.toString(), item.count])
            ),
            group: Object.fromEntries(
                groupUnread.map(item => [item._id.toString(), item.count])
            ),
            public: publicUnread
        }

        return NextResponse.json(unreadData)
    } catch (error) {
        console.error("Get unread count error:", error)
        return NextResponse.json({ message: "Server Error", error: String(error) }, { status: 500 })
    }
}
