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

    // در production از upload service استفاده می‌کنیم
    const isProduction = process.env.NODE_ENV === 'production'
    
    try {
      // فعلاً فایل رو در temp storage ذخیره می‌کنیم
      // و یه service جداگانه برای انتقال به VPS می‌سازیم
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

      // در production پیام ویژه نمایش می‌دهیم
      if (isProduction) {
        return NextResponse.json({
          success: true,
          message: "فیش حقوقی آپلود شد - فایل در حال انتقال به سرور اصلی است",
          filePath: `/root/hiarchitectweb/public/files/${employee.nationalCode}/${fileName}`,
          url: `https://hiarchitectweb.com/files/${employee.nationalCode}/${fileName}`,
          vpsPath: `/root/hiarchitectweb/public/files/${employee.nationalCode}/${fileName}`,
          note: "فایل موقتاً ذخیره شده و به زودی به VPS منتقل خواهد شد"
        })
      } else {
        return NextResponse.json({
          success: true,
          message: "فیش حقوقی در محیط تست آپلود شد",
          filePath: `/temp/${employee.nationalCode}/${fileName}`,
          url: `http://localhost:3000/temp/${employee.nationalCode}/${fileName}`
        })
      }

    } catch (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: "خطا در آپلود فایل - لطفاً دوباره تلاش کنید" },
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