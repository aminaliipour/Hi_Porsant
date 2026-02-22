import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import ChatGroup from "@/lib/models/ChatGroup"
import GroupMessage from "@/lib/models/GroupMessage"
import ChatGroupTask from "@/lib/models/ChatGroupTask"
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

        // Get all groups where user is admin or member
        const groups = await ChatGroup.find({
            $or: [
                { admin: user._id },
                { members: user._id }
            ]
        })
            .populate("admin", "name avatar")
            .populate("members", "name avatar")
            .sort({ createdAt: -1 })

        return NextResponse.json(groups)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        // Only مدیر role can create groups
        if (user.role !== "مدیر" && user.role !== "admin") {
            return NextResponse.json({ message: "فقط مدیر می‌تواند گروه ایجاد کند" }, { status: 403 })
        }

        const body = await req.json()
        const { name, description, image, memberIds } = body

        if (!name) {
            return NextResponse.json({ message: "Name is required" }, { status: 400 })
        }

        // Create group with admin and members
        const newGroup = await ChatGroup.create({
            name,
            description,
            image,
            admin: user._id,
            members: memberIds ? [user._id, ...memberIds] : [user._id]
        })

        const populatedGroup = await newGroup.populate([
            { path: "admin", select: "name avatar" },
            { path: "members", select: "name avatar" }
        ])

        return NextResponse.json(populatedGroup, { status: 201 })
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
        const { id, name, description, image, memberIds } = body

        const group = await ChatGroup.findById(id)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        // Only admin can edit
        if (group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        if (name) group.name = name
        if (description) group.description = description
        if (image) group.image = image
        if (memberIds) group.members = [user._id, ...memberIds]

        await group.save()

        const populatedGroup = await group.populate([
            { path: "admin", select: "name avatar" },
            { path: "members", select: "name avatar" }
        ])

        return NextResponse.json(populatedGroup)
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
            return NextResponse.json({ message: "Group ID is required" }, { status: 400 })
        }

        const group = await ChatGroup.findById(id)
        if (!group) return NextResponse.json({ message: "Group not found" }, { status: 404 })

        // Only admin can delete
        if (group.admin.toString() !== user._id.toString()) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        // Delete all related messages
        await GroupMessage.deleteMany({ chatGroup: id })

        // Delete all related tasks
        await ChatGroupTask.deleteMany({ chatGroup: id })

        // Delete the group itself
        await ChatGroup.findByIdAndDelete(id)

        return NextResponse.json({ message: "Group and all related content deleted" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
