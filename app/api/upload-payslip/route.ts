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

    // در محیط production (Vercel) فعلاً فقط فایل رو ذخیره می‌کنیم
    // بعداً می‌تونیم webhook یا manual sync بزاریم
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      // فعلاً فایل رو در temp endpoint نگه می‌داریم
      try {
        // ارسال فایل به temp storage
        const tempResponse = await fetch(`${request.headers.get('origin') || 'https://hi-porsant.vercel.app'}/api/download-payslips`, {
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
          message: "فیش حقوقی موقتاً ذخیره شد - برای انتقال به سرور اصلی با پشتیبانی تماس بگیرید",
          tempPath: `/temp/${employee.nationalCode}/${fileName}`,
          note: "فایل در سیستم موقت ذخیره شده و آماده انتقال به سرور اصلی است"
        })
        
      } catch (error) {
        console.error('Production upload error:', error)
        return NextResponse.json(
          { error: "خطا در آپلود فایل - لطفاً دوباره تلاش کنید" },
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