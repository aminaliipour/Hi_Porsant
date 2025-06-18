"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"

interface CommissionAssignment {
  projectName: string
  sectionName: string
  itemName?: string
  income: number
  commission: number
  weight: number
  systemPercent: number
  fieldName?: string
}

interface CommissionInvoicePdfProps {
  fullName: string
  position?: string
  assignments: CommissionAssignment[]
  totalCommission: number
  baseSalary?: number
  additions?: number
  deductions?: number
  onComplete?: () => void
}

export const CommissionInvoicePdf: React.FC<CommissionInvoicePdfProps> = ({
  fullName,
  position,
  assignments,
  totalCommission,
  baseSalary = 0,
  additions = 0,
  deductions = 0,
  onComplete,
}) => {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleDownloadPdf = async () => {
    if (!isClient) return
    
    setIsLoading(true)
    try {
      // Dynamic import with better error handling
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ])

      const html2canvas = html2canvasModule.default
      const jsPDF = jsPDFModule.default

      // بررسی بارگیری کتابخانه‌ها
      if (!html2canvas || !jsPDF) {
        throw new Error('Failed to load PDF libraries')
      }

      // ایجاد HTML برای تبدیل به PDF
      const htmlContent = createPdfHtml()
      
      // ایجاد div موقت در DOM
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '0'
      tempDiv.style.width = '800px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Vazirmatn, IRANSans, Arial, sans-serif'
      tempDiv.style.direction = 'rtl'
      document.body.appendChild(tempDiv)

      // تبدیل HTML به canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      })

      // حذف div موقت
      document.body.removeChild(tempDiv)

      // ایجاد PDF
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const doc = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // اضافه کردن صفحه اول
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // اضافه کردن صفحات بعدی در صورت نیاز
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // ذخیره فایل
      const fileName = `فیش-حقوقی-${fullName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)

      if (onComplete) {
        onComplete()
      }

    } catch (error) {
      console.error("خطا در تولید PDF:", error)
      alert("خطا در تولید PDF. لطفاً دوباره تلاش کنید.")
    } finally {
      setIsLoading(false)
    }
  }

  const createPdfHtml = () => {
    const currentDate = new Date().toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const totalPayment = baseSalary + additions + totalCommission - deductions

    return `
      <div style="width: 800px; min-height: 900px; background: white; font-family: Vazirmatn, IRANSans, Arial, sans-serif; font-size: 13px; direction: rtl; padding: 15px; box-sizing: border-box;">
        
        <!-- هدر -->
        <div style="background: linear-gradient(135deg, #FBCC0A, #FDD835); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="width: 70px;">
              <img src="/logo.png" alt="لوگو" style="width: 50px; height: 50px; border-radius: 6px;" />
            </div>
            <div style="flex: 1; text-align: center;">
              <h1 style="color: #58595B; font-size: 22px; margin: 0; font-weight: bold;">فیش حقوق و دستمزد</h1>
              <h2 style="color: #58595B; font-size: 15px; margin: 3px 0; font-weight: normal;">شرکت Hi Architect</h2>
              <p style="color: #58595B; font-size: 11px; margin: 0;">سیستم مدیریت پروژه و محاسبه پورسانت</p>
            </div>
            <div style="width: 70px;"></div>
          </div>
        </div>

        <!-- اطلاعات کارمند -->
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-right: 3px solid #FBCC0A;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 15px; font-weight: bold; color: #58595B; display: flex; align-items: center;">
                نام و نام خانوادگی: <span style="color: #FBCC0A; background: #58595B; padding: 4px 10px; border-radius: 4px; margin-right: 8px; display: inline-block;">${fullName}</span>
              </p>
              ${position ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #58595B;">سمت: ${position}</p>` : ''}
            </div>
            <div style="text-align: left; color: #58595B; font-size: 11px;">
              تاریخ صدور: ${currentDate}
            </div>
          </div>
        </div>

        <!-- خلاصه مالی -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #58595B; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #FBCC0A; padding-bottom: 3px;">خلاصه مالی</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <tr style="background: #FBCC0A;">
              <td style="padding: 10px; border: 1px solid #58595B; font-weight: bold; text-align: right; color: #58595B;">💰 حقوق پایه (مبلغ ثابت ماهانه)</td>
              <td style="padding: 10px; border: 1px solid #58595B; text-align: left; color: #58595B; font-weight: bold;">${baseSalary.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #58595B; font-weight: bold; text-align: right; color: #58595B;">➕ اضافات (پاداش و مزایا)</td>
              <td style="padding: 10px; border: 1px solid #58595B; text-align: left; color: #58595B; font-weight: bold;">${additions.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: #FBCC0A;">
              <td style="padding: 10px; border: 1px solid #58595B; font-weight: bold; text-align: right; color: #58595B;">🎯 مجموع پورسانت (سهم از پروژه‌ها)</td>
              <td style="padding: 10px; border: 1px solid #58595B; text-align: left; color: #58595B; font-weight: bold;">${totalCommission.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #58595B; font-weight: bold; text-align: right; color: #58595B;">➖ کسورات (بیمه، مالیات و سایر)</td>
              <td style="padding: 10px; border: 1px solid #58595B; text-align: left; color: #58595B; font-weight: bold;">${deductions.toLocaleString('fa-IR')} ریال</td>
            </tr>
          </table>
          
          <div style="background: white; color: #58595B; padding: 12px; border-radius: 6px; text-align: center; border: 2px solid #FBCC0A;">
            <span style="font-size: 16px; font-weight: bold;">💵 جمع کل دریافتی: ${totalPayment.toLocaleString('fa-IR')} ریال</span>
          </div>
        </div>

        <!-- جزئیات پورسانت -->
        <div>
          <h3 style="color: #58595B; font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #FBCC0A; padding-bottom: 3px;">🏗️ جزئیات محاسبه پورسانت</h3>
          
          ${assignments.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #58595B; color: #FBCC0A;">
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 6%;">ردیف</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 28%;">نام پروژه</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 16%;">بخش</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 20%;">آیتم/فیلد</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 15%;">درآمد (ریال)</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; font-weight: bold; width: 15%;">پورسانت (ریال)</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map((assignment, index) => `
                <tr style="background: ${index % 2 === 0 ? '#FBCC0A' : 'white'}; color: #58595B;">
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: center; font-weight: bold;">${(index + 1).toLocaleString('fa-IR')}</td>
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: right; font-weight: 600;">${assignment.projectName || 'نام پروژه مشخص نیست'}</td>
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: center; font-weight: 500;">${assignment.sectionName || 'بخش مشخص نیست'}</td>
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: center;">${assignment.itemName || assignment.fieldName || 'فیلد مشخص نیست'}</td>
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: left; font-weight: 600;">${assignment.income.toLocaleString('fa-IR')}</td>
                  <td style="padding: 6px; border: 1px solid #58595B; text-align: left; font-weight: bold;">${assignment.commission.toLocaleString('fa-IR')}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: white; color: #58595B; border: 2px solid #FBCC0A;">
                <td colspan="5" style="padding: 10px; border: 1px solid #58595B; text-align: center; font-weight: bold; font-size: 13px;">🎯 مجموع کل پورسانت دریافتی</td>
                <td style="padding: 10px; border: 1px solid #58595B; text-align: left; font-weight: bold; font-size: 13px;">${totalCommission.toLocaleString('fa-IR')} ریال</td>
              </tr>
            </tfoot>
          </table>
          ` : `
          <div style="background: #FBCC0A; padding: 20px; border-radius: 6px; text-align: center; color: #58595B; border: 2px solid #58595B;">
            <div style="font-size: 40px; margin-bottom: 10px;">📋</div>
            <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">هیچ پورسانتی ثبت نشده</h4>
            <p style="margin: 0; font-size: 12px; line-height: 1.4;">
              برای این کارمند در دوره جاری هیچ پورسانتی محاسبه و ثبت نشده است.
            </p>
          </div>
          `}
        </div>

        <!-- فوتر -->
        <div style="margin-top: 25px; padding-top: 15px; border-top: 2px solid #FBCC0A; text-align: center; color: #58595B; font-size: 10px;">
          <p style="margin: 3px 0;">📄 این فیش به صورت خودکار تولید شده است</p>
          <p style="margin: 3px 0;">📅 تاریخ تولید: ${new Date().toLocaleString('fa-IR')} | 📋 شماره صفحه: ۱</p>
          <p style="margin: 3px 0; font-weight: bold; color: #FBCC0A; background: #58595B; padding: 3px 10px; border-radius: 4px; display: inline-block;">🏢 شرکت Hi Architect - سیستم مدیریت پروژه</p>
        </div>
      </div>
    `
  }

  // فقط در محیط browser نمایش داده شود
  if (!isClient) {
    return null
  }

  return (
    <Button 
      onClick={handleDownloadPdf} 
      variant="outline"
      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 ml-2 animate-spin rounded-full border-2 border-blue-700 border-t-transparent"></div>
          در حال تولید...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          دریافت فیش حقوقی
        </>
      )}
    </Button>
  )
}
