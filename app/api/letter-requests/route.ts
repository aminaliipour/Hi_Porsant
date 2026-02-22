import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import LetterRequest from "@/lib/models/LetterRequest"
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

function isAdminUser(user: any) {
    return user?.role === "admin" || user?.role === "مدیر"
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const summary = searchParams.get("summary")

        if (summary && isAdminUser(user)) {
            const pendingCount = await LetterRequest.countDocuments({ status: "pending" })
            return NextResponse.json({ pendingCount })
        }

        const query = isAdminUser(user) ? {} : { requester: user._id }
        const requests = await LetterRequest.find(query)
            .populate("requester", "name")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })

        return NextResponse.json(requests)
    } catch (error) {
        console.error("LetterRequest GET Error:", error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { requestType, title, description, startDate, endDate } = body

        if (!requestType || !title) {
            return NextResponse.json({ message: "Request type and title are required" }, { status: 400 })
        }

        const newRequest = await LetterRequest.create({
            requester: user._id,
            requestType,
            title,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: "pending",
        })

        const admins = await User.find({ role: { $in: ["admin", "مدیر"] } })
        if (admins.length > 0) {
            const notifications = admins.map((admin: any) => ({
                recipient: admin._id,
                type: "letter_request",
                title: "درخواست جدید",
                message: `${user.name} یک درخواست جدید ثبت کرد: ${title}`,
                relatedId: newRequest._id,
                read: false,
            }))
            await Notification.insertMany(notifications)
        }

        return NextResponse.json(newRequest, { status: 201 })
    } catch (error) {
        console.error("LetterRequest POST Error:", error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        if (!isAdminUser(user)) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        const body = await req.json()
        const { id, status, decisionNote } = body

        if (!id || !status || !["approved", "rejected"].includes(status)) {
            return NextResponse.json({ message: "Invalid request" }, { status: 400 })
        }

        const request = await LetterRequest.findById(id)
        if (!request) return NextResponse.json({ message: "Request not found" }, { status: 404 })

        request.status = status
        request.reviewedBy = user._id
        request.reviewedAt = new Date()
        if (decisionNote) request.decisionNote = decisionNote

        await request.save()

        await Notification.create({
            recipient: request.requester,
            type: "letter_response",
            title: "پاسخ درخواست",
            message: status === "approved" ? "درخواست شما تایید شد" : "درخواست شما رد شد",
            relatedId: request._id,
            read: false,
        })

        return NextResponse.json(request)
    } catch (error) {
        console.error("LetterRequest PUT Error:", error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
