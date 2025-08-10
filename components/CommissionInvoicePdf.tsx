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
  isActive?: boolean // وضعیت فعال/غیرفعال
}

interface CommissionInvoicePdfProps {
  fullName: string
  position?: string
  assignments: CommissionAssignment[]
  totalCommission: number
  baseSalary?: number
  additions?: number
  deductions?: number
  description?: string // فیلد توضیحات اضافه شد
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
  description = "", // فیلد توضیحات اضافه شد
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
      tempDiv.style.width = '750px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Morabba, Arial, sans-serif'
      tempDiv.style.direction = 'rtl'
      tempDiv.style.textRendering = 'optimizeLegibility' // بهبود رندر متن
      ;(tempDiv.style as any).webkitFontSmoothing = 'antialiased' // نرم‌تر کردن فونت
      document.body.appendChild(tempDiv)

      // تبدیل HTML به canvas با کیفیت بالاتر
      const canvas = await html2canvas(tempDiv, {
        scale: 1.8, // افزایش کیفیت از 1.5 به 1.8
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 750,
        height: tempDiv.scrollHeight,
        logging: false,
        imageTimeout: 0,
        onclone: (cloned) => {
          // اطمینان از بارگیری فونت‌ها
          cloned.querySelectorAll('*').forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              htmlEl.style.fontFamily = 'Morabba, Arial, sans-serif';
            }
          });
        }
      })

      // حذف div موقت
      document.body.removeChild(tempDiv)

      // ایجاد PDF با فشرده‌سازی بهینه
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      // ایجاد PDF با تنظیمات بهینه
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })
      let position = 0

      // استفاده از JPEG با کیفیت بالاتر
      const imageData = canvas.toDataURL('image/jpeg', 0.95) // افزایش کیفیت از 92% به 95%
      doc.addImage(imageData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // اضافه کردن صفحات بعدی در صورت نیاز
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imageData, 'JPEG', 0, position, imgWidth, imgHeight)
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
    
    // دریافت نام آرشیو فعال
    let archiveName = ''
    try {
      const stored = localStorage.getItem("activeArchive")
      if (stored) {
        const activeArchive = JSON.parse(stored)
        archiveName = activeArchive.name || ''
      }
    } catch {}
    
    // گروه‌بندی assignments بر اساس پروژه و بخش
    const groupedAssignments = assignments.reduce((acc, assignment) => {
      const key = `${assignment.projectName || 'نام پروژه مشخص نیست'} - ${assignment.sectionName || 'بخش مشخص نیست'}`
      
      if (!acc[key]) {
        acc[key] = {
          projectName: assignment.projectName || 'نام پروژه مشخص نیست',
          sectionName: assignment.sectionName || 'بخش مشخص نیست',
          items: [],
          totalCommission: 0
        }
      }
      
      acc[key].items.push(assignment)
      acc[key].totalCommission += assignment.commission
      
      return acc
    }, {} as Record<string, {
      projectName: string,
      sectionName: string,
      items: CommissionAssignment[],
      totalCommission: number
    }>)
    
    const totalPayment = baseSalary + additions + totalCommission - deductions

    return `
      <style>
        /* فونت‌های اصلی */
        @font-face {
          font-family: 'Morabba';
          src: url('/fonts/Morabba.ttf') format('truetype');
          font-weight: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Morabba';
          src: url('/fonts/Morabba Bold.ttf') format('truetype');
          font-weight: bold;
          font-display: swap;
        }
        
        body, * {
          font-family: 'Morabba', 'Tahoma', 'Arial', sans-serif !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      </style>
      <div style="width: 750px; min-height: 800px; background: white; font-family: 'Morabba', 'Tahoma', 'Arial', sans-serif; font-size: 12px; direction: rtl; padding: 12px; box-sizing: border-box;">
        
        <!-- هدر -->
        <div style="background: linear-gradient(135deg, #FBCC0A, #FDD835); padding: 15px; border-radius: 6px; margin-bottom: 15px; position: relative;">
          <div style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%);">
            <img src="/factor_logo.png" alt="لوگو" style="width: 200px; height: auto; max-height: 200px; object-fit: contain; border-radius: 4px;" />
          </div>
          <div style="text-align: right; padding-right: 12px;">
            <h1 style="color:rgb(42, 41, 41); font-size: 25px; margin: 0 0 5px 0; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">فیش حقوق و دستمزد${archiveName ? ` - ${archiveName}` : ''}</h1>
            <h2 style="color:rgb(42, 42, 42); font-size: 15px; margin: 0; font-weight: normal; font-family: 'Morabba', Arial, sans-serif;">شرکت Hi Architect</h2>
          </div>
        </div>

        <!-- اطلاعات کارمند -->
        <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; margin-bottom: 15px; border-right: 3px solid #FBCC0A;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">
                نام و نام خانوادگی: <span style="color: #58595B; margin-right: 8px; font-family: 'Morabba', Arial, sans-serif;">${fullName}</span>
              </p>
              ${position ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">سمت: ${position}</p>` : ''}
            </div>
            <div style="text-align: left; color: #58595B; font-size: 10px; font-family: 'Morabba', Arial, sans-serif;">
              تاریخ صدور: ${currentDate}
            </div>
          </div>
        </div>

        <!-- خلاصه مالی -->
        <div style="margin-bottom: 15px;">
          <h3 style="color: #58595B; font-size: 15px; margin-bottom: 10px; border-bottom: 2px solid #FBCC0A; padding-bottom: 2px; font-family: 'Morabba', Arial, sans-serif;">خلاصه مالی</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: 'Morabba', Arial, sans-serif;">
            <tr style="background: #FBCC0A;">
              <td style="padding: 8px; border: 1px solid #58595B; font-weight: bold; text-align: center; vertical-align: middle; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">💰 حقوق پایه (مبلغ ثابت ماهانه)</td>
              <td style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; color: #58595B; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">${baseSalary.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; border: 1px solid #58595B; font-weight: bold; text-align: center; vertical-align: middle; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">➕ اضافات (پاداش و مزایا)</td>
              <td style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; color: #58595B; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">${additions.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: #FBCC0A;">
              <td style="padding: 8px; border: 1px solid #58595B; font-weight: bold; text-align: center; vertical-align: middle; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">🎯 مجموع پورسانت (سهم از پروژه‌ها)</td>
              <td style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; color: #58595B; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">${totalCommission.toLocaleString('fa-IR')} ریال</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 8px; border: 1px solid #58595B; font-weight: bold; text-align: center; vertical-align: middle; color: #58595B; font-family: 'Morabba', Arial, sans-serif;">➖ کسورات (بیمه، مالیات و سایر)</td>
              <td style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; color: #58595B; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">${deductions.toLocaleString('fa-IR')} ریال</td>
            </tr>
          </table>
          
          <!-- توضیحات -->
          ${description ? `
          <div style="margin: 15px 0;">
            <h3 style="color: #58595B; font-size: 14px; margin-bottom: 8px; border-bottom: 2px solid #FBCC0A; padding-bottom: 2px; font-family: 'Morabba', Arial, sans-serif;">📝 توضیحات</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; border-right: 3px solid #FBCC0A; color: #58595B; font-family: 'Morabba', Arial, sans-serif; line-height: 1.6; font-size: 12px;">
              ${description.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}
          
          <div style="background: white; color: #58595B; padding: 10px; border-radius: 5px; text-align: center; border: 2px solid #FBCC0A;">
            <span style="font-size: 15px; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">💵 جمع کل دریافتی: ${totalPayment.toLocaleString('fa-IR')} ریال</span>
          </div>
        </div>

        <!-- جزئیات پورسانت -->
        <div>
          <h3 style="color: #58595B; font-size: 15px; margin-bottom: 10px; border-bottom: 2px solid #FBCC0A; padding-bottom: 2px; font-family: 'Morabba', Arial, sans-serif;">🏗️ جزئیات محاسبه پورسانت</h3>
          
          ${assignments.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'Morabba', Arial, sans-serif;">
            <thead>
              <tr style="background: #58595B; color: #FBCC0A;">
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; width: 8%; font-family: 'Morabba', Arial, sans-serif;">ردیف</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; width: 35%; font-family: 'Morabba', Arial, sans-serif;">نام پروژه</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; width: 20%; font-family: 'Morabba', Arial, sans-serif;">بخش</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; width: 22%; font-family: 'Morabba', Arial, sans-serif;">آیتم‌های پورسانت</th>
                <th style="padding: 8px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; width: 15%; font-family: 'Morabba', Arial, sans-serif;">جمع پورسانت (ریال)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(groupedAssignments).map((group, index) => {
                // جمع‌آوری تمام آیتم‌های فعال این بخش
                const activeItems = group.items.filter(item => item.isActive !== false)
                
                // حذف آیتم‌های تکراری با استفاده از Set
                const uniqueItemNames = [...new Set(activeItems.map(item => item.itemName || item.fieldName || 'آیتم نامشخص'))]
                const itemNames = uniqueItemNames.join(' + ')
                
                const totalCommission = activeItems.reduce((sum, item) => sum + item.commission, 0)
                
                return `
                  <tr style="background: white; color: #58595B;">
                    <td style="padding: 6px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">${(index + 1).toLocaleString('fa-IR')}</td>
                    <td style="padding: 6px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: 600; font-family: 'Morabba', Arial, sans-serif;">${group.projectName}</td>
                    <td style="padding: 6px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: 500; font-family: 'Morabba', Arial, sans-serif;">${group.sectionName}</td>
                    <td style="padding: 6px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: 500; font-family: 'Morabba', Arial, sans-serif; font-size: 10px;">${itemNames || 'آیتم‌های غیرفعال'}</td>
                    <td style="padding: 6px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; color: #2563eb; font-family: 'Morabba', Arial, sans-serif;">${totalCommission.toLocaleString('fa-IR')}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background: white; color: #58595B; border: 2px solid #FBCC0A;">
                <td colspan="4" style="padding: 10px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; font-size: 13px; font-family: 'Morabba', Arial, sans-serif;">🎯 مجموع کل پورسانت دریافتی</td>
                <td style="padding: 10px; border: 1px solid #58595B; text-align: center; vertical-align: middle; font-weight: bold; font-size: 13px; color: #2563eb; font-family: 'Morabba', Arial, sans-serif;">${totalCommission.toLocaleString('fa-IR')} ریال</td>
              </tr>
            </tfoot>
          </table>
          ` : `
          <div style="background: #FBCC0A; padding: 15px; border-radius: 5px; text-align: center; color: #58595B; border: 2px solid #58595B;">
            <div style="font-size: 35px; margin-bottom: 8px;">📋</div>
            <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; font-family: 'Morabba', Arial, sans-serif;">هیچ پورسانتی ثبت نشده</h4>
            <p style="margin: 0; font-size: 11px; line-height: 1.4; font-family: 'Morabba', Arial, sans-serif;">
              برای این کارمند در دوره جاری هیچ پورسانتی محاسبه و ثبت نشده است.
            </p>
          </div>
          `}
        </div>

        <!-- فوتر -->
        <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #FBCC0A; text-align: center; color: #58595B; font-size: 9px; font-family: 'Morabba', Arial, sans-serif;">
          <p style="margin: 2px 0; font-family: 'Morabba', Arial, sans-serif;">📅 تاریخ تولید: ${new Date().toLocaleString('fa-IR')} | 📋 شماره صفحه: ۱</p>
          <p style="margin: 2px 0; font-weight: bold; color:rgb(29, 28, 28); background: padding: 2px 8px; border-radius: 3px; display: inline-block; font-family: 'Morabba', Arial, sans-serif;">🏢 شرکت Hi Architect - سیستم مدیریت پروژه</p>
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
