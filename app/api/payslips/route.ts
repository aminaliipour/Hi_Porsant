import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Session from "@/lib/models/Session"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

interface TempFile {
  nationalCode: string
  fileName: string
  pdfData: string
  employeeName: string
  uploadTime: Date
}

declare global {
  var tempFiles: TempFile[] | undefined
}

async function getUser(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  if (!token) return null

  await dbConnect()
  const session = await Session.findOne({ token }).populate("userId")
  return session?.userId
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const nationalCode = user.nationalCode
    if (!nationalCode) {
      return NextResponse.json({ message: "National code missing" }, { status: 400 })
    }

    let isVPS = false
    try {
      isVPS = fs.existsSync("/root/hiarchitectweb/public/files/") || process.env.VPS_MODE === "true"
    } catch {
      isVPS = false
    }

    if (isVPS) {
      const baseDir = process.env.FILES_DIR || "/root/hiarchitectweb/public/files"
      const employeeDir = path.join(baseDir, nationalCode)
      if (!fs.existsSync(employeeDir)) {
        return NextResponse.json({ success: true, files: [] })
      }

      const siteUrl = process.env.SITE_URL || "https://hiarchitectweb.com"
      const files = fs
        .readdirSync(employeeDir)
        .filter((file) => file.toLowerCase().endsWith(".pdf"))
        .map((file) => {
          const stats = fs.statSync(path.join(employeeDir, file))
          return {
            fileName: file,
            uploadTime: stats.mtime,
            downloadUrl: `${siteUrl}/files/${nationalCode}/${encodeURIComponent(file)}`,
          }
        })
        .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())

      return NextResponse.json({ success: true, files })
    }

    const tempFiles = global.tempFiles || []
    const files = tempFiles
      .filter((file) => file.nationalCode === nationalCode)
      .map((file) => ({
        fileName: file.fileName,
        uploadTime: file.uploadTime,
        downloadUrl: `/api/download-payslips/${file.nationalCode}/${encodeURIComponent(file.fileName)}`,
      }))
      .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())

    return NextResponse.json({ success: true, files })
  } catch (error) {
    console.error("Payslips GET Error:", error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
}
