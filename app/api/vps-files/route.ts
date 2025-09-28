import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const baseDir = '/root/hiarchitectweb/public/files'
    
    // بررسی وجود پوشه اصلی
    if (!fs.existsSync(baseDir)) {
      return NextResponse.json({
        success: true,
        message: "پوشه files هنوز ایجاد نشده است",
        files: [],
        totalFiles: 0,
        baseDirectory: baseDir
      })
    }

    const employeeDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    const allFiles: Array<{
      nationalCode: string
      fileName: string
      filePath: string
      fileSize: number
      uploadTime: string
      url: string
    }> = []

    for (const nationalCode of employeeDirs) {
      const employeeDir = path.join(baseDir, nationalCode)
      
      if (fs.existsSync(employeeDir)) {
        const files = fs.readdirSync(employeeDir)
          .filter(file => file.endsWith('.pdf'))
        
        for (const fileName of files) {
          const filePath = path.join(employeeDir, fileName)
          const stats = fs.statSync(filePath)
          
          allFiles.push({
            nationalCode,
            fileName,
            filePath,
            fileSize: stats.size,
            uploadTime: stats.mtime.toISOString(),
            url: `https://hiarchitectweb.com/files/${nationalCode}/${fileName}`
          })
        }
      }
    }

    // مرتب‌سازی بر اساس زمان آپلود (جدیدترین اول)
    allFiles.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())

    return NextResponse.json({
      success: true,
      message: `${allFiles.length} فایل در VPS یافت شد`,
      totalFiles: allFiles.length,
      totalEmployees: employeeDirs.length,
      files: allFiles,
      baseDirectory: baseDir
    })

  } catch (error) {
    console.error("Error reading VPS files:", error)
    return NextResponse.json({
      success: false,
      error: "خطا در خواندن فایل‌های VPS",
      note: "آیا برنامه روی VPS اجرا می‌شود؟"
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nationalCode = searchParams.get('nationalCode')
    const fileName = searchParams.get('fileName')

    if (!nationalCode || !fileName) {
      return NextResponse.json(
        { error: "کد ملی و نام فایل الزامی است" },
        { status: 400 }
      )
    }

    const filePath = path.join('/root/hiarchitectweb/public/files', nationalCode, fileName)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "فایل یافت نشد" },
        { status: 404 }
      )
    }

    fs.unlinkSync(filePath)

    return NextResponse.json({
      success: true,
      message: "فایل با موفقیت حذف شد",
      deletedFile: filePath
    })

  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "خطا در حذف فایل" },
      { status: 500 }
    )
  }
}