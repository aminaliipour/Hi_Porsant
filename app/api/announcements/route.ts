import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Announcement from "@/lib/models/Announcement"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"
import Notification from "@/lib/models/Notification"

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

        // Fetch announcements that match 'all' or include user's ID
        // Support both single ID and array of IDs in targetAudience
        const query = {
            $or: [
                { targetAudience: "all" },
                { targetAudience: user._id },
                { targetAudience: { $in: [user._id] } }
            ]
        }

        const announcements = await Announcement.find(query)
            .populate("sender", "name")
            .sort({ createdAt: -1 })

        return NextResponse.json(announcements)
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || (user.role !== "مدیر" && user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { title, content, targetAudience } = body

        if (!title || !content) {
            return NextResponse.json({ message: "Title and Content are required" }, { status: 400 })
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            sender: user._id,
            targetAudience: targetAudience || "all"
        })

        // Create notifications for all users (or specific targetAudience)
        let recipients = []
        if (targetAudience === "all" || !targetAudience) {
            // Send to all users except the sender
            const allUsers = await User.find({ _id: { $ne: user._id } })
            recipients = allUsers.map(u => u._id)
        } else {
            // Send to specific user(s)
            recipients = Array.isArray(targetAudience) ? targetAudience : [targetAudience]
        }

        // Create notification for each recipient
        const notifications = recipients.map(recipientId => ({
            recipient: recipientId,
            type: "announcement_created",
            title: "اطلاعیه جدید",
            message: `اطلاعیه: ${title}`,
            relatedId: newAnnouncement._id,
            read: false
        }))

        if (notifications.length > 0) {
            await Notification.insertMany(notifications)
        }

        return NextResponse.json(newAnnouncement, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || (user.role !== "مدیر" && user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { id, title, content, targetAudience } = body

        if (!id) {
            return NextResponse.json({ message: "Announcement ID is required" }, { status: 400 })
        }

        const announcement = await Announcement.findById(id)
        if (!announcement) {
            return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
        }

        // Detect if targetAudience changed
        const oldAudience = announcement.targetAudience
        const audienceChanged = targetAudience && JSON.stringify(oldAudience) !== JSON.stringify(targetAudience)

        if (title) announcement.title = title
        if (content) announcement.content = content
        if (targetAudience) announcement.targetAudience = targetAudience

        await announcement.save()

        // If audience changed, send notifications to new recipients
        if (audienceChanged) {
            let newRecipients = []
            if (targetAudience === "all") {
                const allUsers = await User.find({ _id: { $ne: user._id } })
                newRecipients = allUsers.map(u => u._id)
            } else if (Array.isArray(targetAudience)) {
                newRecipients = targetAudience
            } else {
                newRecipients = [targetAudience]
            }

            // Get old recipients to avoid duplicate notifications
            let oldRecipients: any[] = []
            if (oldAudience === "all") {
                const allUsers = await User.find({ _id: { $ne: user._id } })
                oldRecipients = allUsers.map(u => u._id.toString())
            } else if (Array.isArray(oldAudience)) {
                oldRecipients = oldAudience.map((id: any) => id.toString())
            } else if (oldAudience && oldAudience !== "all") {
                oldRecipients = [oldAudience.toString()]
            }

            // Only notify users who weren't in the old audience
            const addedRecipients = newRecipients.filter(
                (id: any) => !oldRecipients.includes(id.toString())
            )

            if (addedRecipients.length > 0) {
                const notifications = addedRecipients.map((recipientId: any) => ({
                    recipient: recipientId,
                    type: "announcement_created",
                    title: "اطلاعیه جدید",
                    message: `اطلاعیه: ${announcement.title}`,
                    relatedId: announcement._id,
                    read: false
                }))
                await Notification.insertMany(notifications)
            }
        }

        return NextResponse.json(announcement)
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || (user.role !== "مدیر" && user.role !== "admin")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ message: "Announcement ID is required" }, { status: 400 })
        }

        const announcement = await Announcement.findByIdAndDelete(id)
        if (!announcement) {
            return NextResponse.json({ message: "Announcement not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Announcement deleted successfully" })
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
