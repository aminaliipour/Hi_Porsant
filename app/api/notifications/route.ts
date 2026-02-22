import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Notification from "@/lib/models/Notification"
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

        const notifications = await Notification.find({ recipient: user._id })
            .sort({ createdAt: -1 })
            .limit(50)

        return NextResponse.json(notifications)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { id, markAllAsRead } = body

        // Mark all notifications as read for the user
        if (markAllAsRead) {
            await Notification.updateMany(
                { recipient: user._id, read: false },
                { $set: { read: true } }
            )
            return NextResponse.json({ message: "All notifications marked as read" })
        }

        // Mark single notification as read
        const notification = await Notification.findById(id)
        if (!notification) return NextResponse.json({ message: "Notification not found" }, { status: 404 })

        if (notification.recipient.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        notification.read = true
        await notification.save()

        return NextResponse.json(notification)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 403 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ message: "Notification ID is required" }, { status: 400 })
        }

        const notification = await Notification.findById(id)
        if (!notification) return NextResponse.json({ message: "Notification not found" }, { status: 404 })

        if (notification.recipient.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await Notification.findByIdAndDelete(id)

        return NextResponse.json({ message: "Notification deleted" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
