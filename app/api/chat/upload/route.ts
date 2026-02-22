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

        // فائل کو buffer میں تبدیل کریں
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // uploads فولڈر میں ڈالیں
        const uploadsDir = join(process.cwd(), "public/uploads/chat")
        
        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (error) {
            console.error("Directory creation error:", error)
        }

        // منفرد فائل نام بنائیں
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const filename = `${timestamp}-${random}-${file.name}`
        const filepath = join(uploadsDir, filename)

        // فائل محفوظ کریں
        await writeFile(filepath, buffer)

        // فائل کا URL واپس کریں
        const fileUrl = `/uploads/chat/${filename}`

        return NextResponse.json({ 
            url: fileUrl,
            filename: file.name,
            size: file.size
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ message: "Upload failed" }, { status: 500 })
    }
}
