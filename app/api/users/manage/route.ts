import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Session from "@/lib/models/Session"
import { writeFile } from "fs/promises"
import path from "path"

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
        if (!user || user.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        const users = await User.find().sort({ createdAt: -1 })
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || user.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        const formData = await req.formData()
        const name = formData.get("name") as string
        const nationalCode = formData.get("nationalCode") as string
        const jobTitle = formData.get("jobTitle") as string
        const role = formData.get("role") as string
        const fatherName = formData.get("fatherName") as string
        const phoneNumber = formData.get("phoneNumber") as string
        const email = formData.get("email") as string
        const education = formData.get("education") as string
        const address = formData.get("address") as string
        const cardNumber = formData.get("cardNumber") as string
        const bankAccount = formData.get("bankAccount") as string
        const avatarFile = formData.get("avatar") as File | null

        if (!name || !nationalCode) {
            return NextResponse.json({ message: "Name and National Code are required" }, { status: 400 })
        }

        let avatarPath = ""
        if (avatarFile && avatarFile.size > 0) {
            const buffer = Buffer.from(await avatarFile.arrayBuffer())
            const filename = Date.now() + "-" + avatarFile.name.replaceAll(" ", "_")
            const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")

            // Ensure directory exists (you might want to add a check/create here if not guaranteed)
            // For now assuming public/uploads/avatars exists or we might fail. 
            // Better to just write to public/uploads/avatars
            // actually lets ensure it exists
            const fs = require('fs')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            await writeFile(path.join(uploadDir, filename), buffer)
            avatarPath = `/uploads/avatars/${filename}`
        }

        const newUser = await User.create({
            name,
            nationalCode,
            jobTitle,
            role: role || "user",
            fatherName,
            phoneNumber,
            email,
            education,
            address,
            cardNumber,
            bankAccount,
            avatar: avatarPath
        })

        return NextResponse.json(newUser, { status: 201 })
    } catch (error: any) {
        console.error("Error creating user:", error)
        if (error.code === 11000) {
            return NextResponse.json({ message: "National Code already exists" }, { status: 400 })
        }
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || user.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        const formData = await req.formData()
        const id = formData.get("id") as string

        if (!id) return NextResponse.json({ message: "User ID is required" }, { status: 400 })

        const updates: any = {}
        const fields = ["name", "nationalCode", "jobTitle", "role", "fatherName", "phoneNumber", "email", "education", "address", "cardNumber", "bankAccount"]

        fields.forEach(field => {
            const value = formData.get(field)
            if (value !== null) updates[field] = value
        })

        const avatarFile = formData.get("avatar") as File | null
        if (avatarFile && avatarFile.size > 0) {
            const buffer = Buffer.from(await avatarFile.arrayBuffer())
            const filename = Date.now() + "-" + avatarFile.name.replaceAll(" ", "_")
            const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars")

            const fs = require('fs')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            await writeFile(path.join(uploadDir, filename), buffer)
            updates.avatar = `/uploads/avatars/${filename}`
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })

        if (!updatedUser) return NextResponse.json({ message: "User not found" }, { status: 404 })

        return NextResponse.json(updatedUser)
    } catch (error: any) {
        console.error("Error updating user:", error)
        if (error.code === 11000) {
            return NextResponse.json({ message: "National Code already exists" }, { status: 400 })
        }
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}


export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user || user.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 })

        await User.findByIdAndDelete(id)
        return NextResponse.json({ message: "User deleted" })
    } catch (error) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
}
