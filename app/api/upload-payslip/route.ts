import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  console.log('Upload payslip API called')
  
  try {
    let body
    try {
      body = await request.json()
      console.log('Request body parsed successfully')
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: "خطا در پردازش درخواست - فرمت JSON نامعتبر" },
        { status: 400 }
      )
    }

    const { employeeId, pdfData, fileName } = body
    console.log('Request data:', { 
      employeeId, 
      fileName, 
      pdfDataLength: pdfData?.length 
    })

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
      let isVPS = false
      
      try {
        isVPS = fs.existsSync('/root/hiarchitectweb/public/files/') || 
                process.env.VPS_MODE === 'true'
        console.log('VPS detection:', { isVPS, vpsMode: process.env.VPS_MODE })
      } catch (fsError) {
        console.log('File system check failed, assuming non-VPS:', fsError)
        isVPS = false
      }

      if (isVPS) {
        // اجرا روی VPS - ذخیره مستقیم در فایل سیستم
        console.log('Running on VPS - Direct file system access')
        
        try {
          // مسیر پوشه اصلی
          const baseDir = process.env.FILES_DIR || '/root/hiarchitectweb/public/files'
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
          console.log('PDF buffer created, size:', pdfBuffer.length)
          
          // نوشتن فایل PDF
          fs.writeFileSync(filePath, pdfBuffer)
          console.log('File saved successfully:', filePath)

          // تنظیم دسترسی فایل
          try {
            fs.chmodSync(filePath, 0o644)
          } catch (chmodError) {
            console.warn('chmod failed:', chmodError)
          }

          const siteUrl = process.env.SITE_URL || 'https://hiarchitectweb.com'
          
          return NextResponse.json({
            success: true,
            message: "فیش حقوقی با موفقیت در VPS ذخیره شد",
            filePath: filePath,
            url: `${siteUrl}/files/${employee.nationalCode}/${fileName}`,
            localPath: filePath,
            employeeName: employee.fullName,
            nationalCode: employee.nationalCode
          })
          
        } catch (vpsError: any) {
          console.error('VPS file operation error:', vpsError)
          return NextResponse.json(
            { error: `خطا در ذخیره فایل در VPS: ${vpsError.message}` },
            { status: 500 }
          )
        }

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