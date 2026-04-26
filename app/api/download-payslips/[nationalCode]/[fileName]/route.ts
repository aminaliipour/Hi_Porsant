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
// Note: In production, this should be replaced with a proper database or external storage
declare global {
  var tempFiles: TempFile[] | undefined
}

// Initialize global temp files storage
if (!global.tempFiles) {
  global.tempFiles = []
}

export async function GET(
  request: Request,
  { params }: { params: { nationalCode: string; fileName: string } }
) {
  try {
    const { nationalCode, fileName } = params
    const tempFiles = global.tempFiles || []
    
    const targetFile = tempFiles.find(
      (f: TempFile) => f.nationalCode === nationalCode && f.fileName === fileName
    )
    
    if (!targetFile) {
      return NextResponse.json(
        { error: "فایل یافت نشد" },
        { status: 404 }
      )
    }
    
    // تبدیل base64 به binary
    const pdfBuffer = Buffer.from(targetFile.pdfData.split(',')[1], 'base64')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
    
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json(
      { error: "خطا در دانلود فایل" },
      { status: 500 }
    )
  }
}