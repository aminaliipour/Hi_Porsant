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

// Helper function to get temp files from global storage
function getTempFiles(): TempFile[] {
  if (typeof global !== 'undefined' && global.tempFiles) {
    return global.tempFiles
  }
  return []
}

export async function GET() {
  try {
    const tempFiles = getTempFiles()
    
    if (tempFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "هیچ فایلی برای انتقال به VPS وجود ندارد",
        files: []
      })
    }

    // اطلاعات فایل‌ها برای انتقال دستی به VPS
    const syncInfo = tempFiles.map((file: TempFile) => ({
      nationalCode: file.nationalCode,
      fileName: file.fileName,
      employeeName: file.employeeName,
      uploadTime: file.uploadTime,
      targetPath: `/root/hiarchitectweb/public/files/${file.nationalCode}/${file.fileName}`,
      downloadUrl: `/api/download-payslips/${file.nationalCode}/${file.fileName}`,
      curlCommand: `curl -o "${file.fileName}" "https://hi-porsant.vercel.app/api/download-payslips/${file.nationalCode}/${file.fileName}"`
    }))

    return NextResponse.json({
      success: true,
      message: `${tempFiles.length} فایل آماده انتقال به VPS`,
      totalFiles: tempFiles.length,
      files: syncInfo,
      instructions: {
        manual: "برای انتقال دستی، از download URL ها استفاده کنید",
        ssh: "وارد VPS شوید و از curl commands استفاده کنید",
        targetDirectory: "/root/hiarchitectweb/public/files/"
      }
    })

  } catch (error) {
    console.error("Error getting sync info:", error)
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات sync" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // این endpoint می‌تواند برای clear کردن temp files بعد از sync استفاده شود
    if (typeof global !== 'undefined') {
      global.tempFiles = []
    }

    return NextResponse.json({
      success: true,
      message: "فایل‌های موقت پاک شدند"
    })

  } catch (error) {
    console.error("Error clearing temp files:", error)
    return NextResponse.json(
      { error: "خطا در پاک کردن فایل‌های موقت" },
      { status: 500 }
    )
  }
}