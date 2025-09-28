import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { TeamMember } from "@/lib/models"

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

    // در محیط production (Vercel) از webhook استفاده می‌کنیم
    // در محیط development از فایل سیستم محلی استفاده می‌کنیم
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      // ارسال درخواست به webhook سرور برای آپلود فایل
      try {
        const uploadResponse = await fetch('https://hiarchitectweb.com/upload-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.UPLOAD_SECRET || '1muys'}` // کلید امنیتی
          },
          body: JSON.stringify({
            nationalCode: employee.nationalCode,
            fileName: fileName,
            pdfData: pdfData,
            employeeName: employee.fullName
          })
        })

        if (!uploadResponse.ok) {
          throw new Error(`Server responded with status: ${uploadResponse.status}`)
        }

        const uploadResult = await uploadResponse.json()
        
        return NextResponse.json({
          success: true,
          message: "فیش حقوقی با موفقیت آپلود شد",
          filePath: uploadResult.filePath,
          url: `https://hiarchitectweb.com/files/${employee.nationalCode}/${fileName}`
        })
      } catch (error) {
        console.error('Webhook upload error:', error)
        return NextResponse.json(
          { error: "خطا در آپلود فایل به سرور - لطفاً دوباره تلاش کنید" },
          { status: 500 }
        )
      }
    } else {
      // در محیط development فقط پیام موفقیت برمی‌گردانیم
      return NextResponse.json({
        success: true,
        message: "در محیط development - فایل آپلود نشد",
        filePath: `/temp/${employee.nationalCode}/${fileName}`,
        url: `http://localhost:3000/temp/${employee.nationalCode}/${fileName}`
      })
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    )
  }
}