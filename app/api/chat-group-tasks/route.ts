import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import ChatGroupTask from "@/lib/models/ChatGroupTask"
import ChatGroup from "@/lib/models/ChatGroup"
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

        const tasks = await ChatGroupTask.find({ chatGroup: groupId })
            .populate("assignedTo", "name avatar")
            .populate("createdBy", "name avatar")
            .sort({ createdAt: -1 })

        return NextResponse.json(tasks)
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
        const { chatGroupId, title, description, assignedToId, dueDate, priority } = body

        if (!chatGroupId || !title || !assignedToId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // Verify user is admin of the group
        const group = await ChatGroup.findById(chatGroupId)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        if (group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Only group admin can create tasks" }, { status: 403 })
        }

        // Create task
        const newTask = await ChatGroupTask.create({
            chatGroup: chatGroupId,
            title,
            description,
            assignedTo: assignedToId,
            createdBy: user._id,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            priority: priority || "medium",
            status: "pending"
        })

        // Create notification for assigned user
        await Notification.create({
            recipient: assignedToId,
            type: "task_assigned",
            title: "وظیفه جدید",
            message: `${user.name} برای شما یک وظیفه جدید اختصاص داده است: ${title}`,
            relatedId: newTask._id,
            read: false
        })

        const populatedTask = await newTask.populate([
            { path: "assignedTo", select: "name avatar" },
            { path: "createdBy", select: "name avatar" }
        ])

        return NextResponse.json(populatedTask, { status: 201 })
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
        const { id, status, title, description, assignedToId, dueDate, priority } = body

        const task = await ChatGroupTask.findById(id)
        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 })

        // Verify user is admin of the group
        const group = await ChatGroup.findById(task.chatGroup)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        if (group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        if (status) task.status = status
        if (title) task.title = title
        if (description) task.description = description
        if (assignedToId) task.assignedTo = assignedToId
        if (dueDate) task.dueDate = new Date(dueDate)
        if (priority) task.priority = priority

        await task.save()

        const populatedTask = await task.populate([
            { path: "assignedTo", select: "name avatar" },
            { path: "createdBy", select: "name avatar" }
        ])

        return NextResponse.json(populatedTask)
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
            return NextResponse.json({ message: "Task ID is required" }, { status: 400 })
        }

        const task = await ChatGroupTask.findById(id)
        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 })

        // Verify user is admin of the group
        const group = await ChatGroup.findById(task.chatGroup)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        if (group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await ChatGroupTask.findByIdAndDelete(id)

        return NextResponse.json({ message: "Task deleted" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
