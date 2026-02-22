import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import Session from "@/lib/models/Session"
import User from "@/lib/models/User"
import dbConnect from "@/lib/db"

async function getUser(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) return null
    await dbConnect()
    const session = await Session.findOne({ token }).populate("userId")
    return session?.userId
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser(req)
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 })
        }

        // تبدیل فائل به buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // فولڈر بنائیں
        const uploadsDir = join(process.cwd(), "public/uploads/avatars")
        
        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (error) {
            console.error("Directory creation error:", error)
        }

        // منفرد نام بنائیں
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const filename = `${timestamp}-${random}-${user._id}.jpg`
        const filepath = join(uploadsDir, filename)

        // فائل محفوظ کریں
        await writeFile(filepath, buffer)

        // Avatar URL
        const avatarUrl = `/uploads/avatars/${filename}`

        // صارف کو اپڈیٹ کریں
        await dbConnect()
        await User.findByIdAndUpdate(user._id, { avatar: avatarUrl })

        return NextResponse.json({ 
            avatar: avatarUrl,
            message: "Avatar uploaded successfully"
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ message: "Upload failed" }, { status: 500 })
    }
}
