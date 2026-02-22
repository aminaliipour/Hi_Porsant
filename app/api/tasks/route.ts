import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Task from "@/lib/models/Task"
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

        let query = {}
        if (user.role !== "مدیر" && user.role !== "admin") {
            query = { assignees: user._id }
        }

        const tasks = await Task.find(query)
            .populate("assignees", "name")
            .sort({ createdAt: -1 })

        return NextResponse.json(tasks)
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
        const { title, description, assigneeIds, priority, startDate, dueDate } = body

        if (!title || !assigneeIds || assigneeIds.length === 0) {
            return NextResponse.json({ message: "Title and at least one Assignee are required" }, { status: 400 })
        }

        const newTask = await Task.create({
            title,
            description,
            assignees: assigneeIds,
            createdBy: user._id,
            priority,
            startDate: startDate ? new Date(startDate) : undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            status: "pending"
        })

        // Create notification for all assignees
        const notifications = assigneeIds.map((assigneeId: string) => ({
            recipient: assigneeId,
            type: "task_assigned",
            title: "وظیفه جدید",
            message: `وظیفه "${title}" به شما اختصاص داده شد`,
            relatedId: newTask._id,
            read: false
        }))

        await Notification.insertMany(notifications)

        return NextResponse.json(newTask, { status: 201 })
    } catch (error) {
        console.error("Task POST Error:", error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { id, status, title, description, assigneeIds, priority, startDate, dueDate } = body

        const task = await Task.findById(id)
        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 })

        const isAdmin = user.role === "مدیر" || user.role === "admin"
        const isCreator = task.createdBy && task.createdBy.toString() === user._id.toString()

        // Only creator or admin can edit
        if (!isAdmin && !isCreator) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        // Check if assignees changed
        const oldAssignees = task.assignees.map((a: any) => a.toString())
        const newAssignees = assigneeIds || []
        const assigneesChanged = assigneeIds && JSON.stringify(oldAssignees.sort()) !== JSON.stringify(newAssignees.sort())

        // Update allowed fields
        if (status) task.status = status
        if (title) task.title = title
        if (description) task.description = description
        if (assigneeIds) task.assignees = assigneeIds
        if (priority) task.priority = priority
        if (startDate) task.startDate = new Date(startDate)
        if (dueDate) task.dueDate = new Date(dueDate)

        await task.save()

        // Create notifications for new assignees
        if (assigneesChanged) {
            const addedAssignees = newAssignees.filter((id: string) => !oldAssignees.includes(id))
            if (addedAssignees.length > 0) {
                const notifications = addedAssignees.map((assigneeId: string) => ({
                    recipient: assigneeId,
                    type: "task_assigned",
                    title: "وظیفه جدید",
                    message: `وظیفه "${task.title}" به شما اختصاص داده شد`,
                    relatedId: task._id,
                    read: false
                }))
                await Notification.insertMany(notifications)
            }
        }

        return NextResponse.json(task)
    } catch (error) {
        console.error("Task PUT Error:", error)
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
            return NextResponse.json({ message: "Task ID is required" }, { status: 400 })
        }

        const task = await Task.findById(id)
        if (!task) {
            return NextResponse.json({ message: "Task not found" }, { status: 404 })
        }

        const isAdmin = user.role === "مدیر" || user.role === "admin"
        const isCreator = task.createdBy && task.createdBy.toString() === user._id.toString()

        // Only creator or admin can delete
        if (!isAdmin && !isCreator) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await Task.findByIdAndDelete(id)

        return NextResponse.json({ message: "Task deleted successfully" })
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
