import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Type definition
interface TempFile {
  nationalCode: string
  fileName: string
  pdfData: string
  employeeName: string
  uploadTime: Date
}

// In-memory storage (shared across the application)
declare global {
  var tempFiles: TempFile[] | undefined
}

// Initialize global temp files storage
if (!global.tempFiles) {
  global.tempFiles = []
}

export async function GET() {
  try {
    const tempFiles = global.tempFiles || []
    
    // لیست فایل‌های موقت برای دانلود
    return NextResponse.json({
      success: true,
      files: tempFiles.map((f: TempFile) => ({
        nationalCode: f.nationalCode,
        fileName: f.fileName,
        employeeName: f.employeeName,
        uploadTime: f.uploadTime,
        downloadUrl: `/api/download-payslips/${f.nationalCode}/${f.fileName}`
      })),
      totalFiles: tempFiles.length
    })
  } catch (error) {
    console.error("Error getting temp files:", error)
    return NextResponse.json(
      { error: "خطا در دریافت لیست فایل‌ها" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nationalCode, fileName, pdfData, employeeName } = body

    if (!nationalCode || !fileName || !pdfData || !employeeName) {
      return NextResponse.json(
        { error: "اطلاعات کامل ارسال نشده" },
        { status: 400 }
      )
    }

    // Initialize if not exists
    if (!global.tempFiles) {
      global.tempFiles = []
    }

    // اضافه کردن فایل به آرایه موقت
    global.tempFiles.push({
      nationalCode,
      fileName,
      pdfData,
      employeeName,
      uploadTime: new Date()
    })

    return NextResponse.json({
      success: true,
      message: "فایل موقتاً ذخیره شد"
    })

  } catch (error) {
    console.error("Error storing temp file:", error)
    return NextResponse.json(
      { error: "خطا در ذخیره فایل موقت" },
      { status: 500 }
    )
  }
}