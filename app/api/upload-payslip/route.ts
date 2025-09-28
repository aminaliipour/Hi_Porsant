import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId, pdfData, fileName } = body

    if (!employeeId || !pdfData || !fileName) {
      return NextResponse.json(
        { error: "اطلاعات کامل ارسال نشده است" },
        { status: 400 }
      )
    }

    // اتصال به دیتابیس برای دریافت کد ملی
    await dbConnect()
    const employee = await TeamMember.findById(employeeId)
    
    if (!employee) {
      return NextResponse.json(
        { error: "کارمند یافت نشد" },
        { status: 404 }
      )
    }

    if (!employee.nationalCode) {
      return NextResponse.json(
        { error: "کد ملی کارمند موجود نیست" },
        { status: 400 }
      )
    }

    try {
      // تشخیص محیط - آیا روی VPS اجرا می‌شود یا خیر
      const isVPS = fs.existsSync('/root/hiarchitectweb/public/files/') || 
                    process.env.VPS_MODE === 'true' || 
                    process.env.NODE_ENV === 'production'

      if (isVPS) {
        // اجرا روی VPS - ذخیره مستقیم در فایل سیستم
        console.log('Running on VPS - Direct file system access')
        
        // مسیر پوشه اصلی
        const baseDir = '/root/hiarchitectweb/public/files'
        const employeeDir = path.join(baseDir, employee.nationalCode)
        const filePath = path.join(employeeDir, fileName)

        console.log('Target directory:', employeeDir)
        console.log('Target file path:', filePath)

        // ایجاد پوشه کد ملی اگر وجود نداشته باشد
        if (!fs.existsSync(employeeDir)) {
          fs.mkdirSync(employeeDir, { recursive: true })
          console.log('Created directory:', employeeDir)
        }

        // تبدیل base64 به buffer
        const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64')
        
        // نوشتن فایل PDF
        fs.writeFileSync(filePath, pdfBuffer)
        console.log('File saved successfully:', filePath)

        // تنظیم دسترسی فایل
        fs.chmodSync(filePath, 0o644)

        return NextResponse.json({
          success: true,
          message: "فیش حقوقی با موفقیت در VPS ذخیره شد",
          filePath: filePath,
          url: `https://hiarchitectweb.com/files/${employee.nationalCode}/${fileName}`,
          localPath: filePath,
          employeeName: employee.fullName,
          nationalCode: employee.nationalCode
        })

      } else {
        // اجرا در محیط development - استفاده از temp storage
        console.log('Running in development - Using temp storage')
        
        const tempResponse = await fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/download-payslips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nationalCode: employee.nationalCode,
            fileName: fileName,
            pdfData: pdfData,
            employeeName: employee.fullName
          })
        })

        if (!tempResponse.ok) {
          throw new Error(`Temp storage failed: ${tempResponse.status}`)
        }

        return NextResponse.json({
          success: true,
          message: "فیش حقوقی در محیط تست ذخیره شد",
          filePath: `/temp/${employee.nationalCode}/${fileName}`,
          url: `http://localhost:3000/temp/${employee.nationalCode}/${fileName}`,
          note: "در محیط development - فایل در temp storage قرار گرفت"
        })
      }

    } catch (fileError: any) {
      console.error('File system error:', fileError)
      return NextResponse.json(
        { error: `خطا در ذخیره فایل: ${fileError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    )
  }
}