"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmployeeSalaryDialog } from "@/components/dialogs/employee-salary-dialog"
import { Plus, Upload } from "lucide-react"

interface TeamMember {
  _id: string
  fullName: string
  position: string
}

interface GuestReferral {
  _id: string
  fullName: string
  referralFee: number
  description?: string
  dateAdded: string
}

export default function SalaryTab() {
  const [employees, setEmployees] = useState<TeamMember[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<TeamMember[]>([])
  const [guests, setGuests] = useState<GuestReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null)
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false)
  const [guestFormData, setGuestFormData] = useState({
    fullName: "",
    referralFee: 0,
    description: "",
  })
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ current: 0, total: 0 })
  const { toast } = useToast()

  useEffect(() => {
    // دریافت آرشیو فعال از localStorage
    const stored = localStorage.getItem("activeArchive")
    let archiveId = ""
    if (stored) {
      try {
        archiveId = JSON.parse(stored)._id
      } catch {}
    }
    fetchData(archiveId)
  }, [])

  const fetchData = async (archiveId?: string) => {
    try {
      setLoading(true)
      // دریافت کارمندان و مهمانان بر اساس آرشیو فعال (در صورت نیاز)
      let employeesUrl = "/api/team-members"
      let guestsUrl = "/api/guest-referrals"
      if (archiveId) {
        employeesUrl += `?archiveId=${archiveId}`
        guestsUrl += `?archiveId=${archiveId}`
      }
      const employeesResponse = await fetch(employeesUrl)
      const employeesData = await employeesResponse.json()
      setEmployees(employeesData)

      // فیلتر کردن کارمندانی که مقادیر غیرصفر دارند
      await filterEmployeesWithNonZeroValues(employeesData, archiveId)

      const guestsResponse = await fetch(guestsUrl)
      const guestsData = await guestsResponse.json()
      setGuests(guestsData)
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // تابع بررسی اینکه آیا کاربر مقادیر غیرصفر دارد یا نه
  const hasNonZeroValues = (member: any) => {
    const baseSalary = member.baseSalary || 0;
    const commission = member.commission || 0;
    const totalAdditions = member.additions?.reduce((sum: number, addition: any) => sum + (addition.amount || 0), 0) || 0;
    const totalDeductions = member.deductions?.reduce((sum: number, deduction: any) => sum + (deduction.amount || 0), 0) || 0;
    
    // اگر هر یک از مقادیر غیرصفر باشد، true برگردان
    return baseSalary > 0 || commission > 0 || totalAdditions > 0 || totalDeductions > 0;
  }

  // فیلتر کردن کارمندان با مقادیر غیرصفر
  const filterEmployeesWithNonZeroValues = async (employeesData: TeamMember[], archiveId?: string) => {
    try {
      const employeesWithData = await Promise.all(
        employeesData.map(async (employee) => {
          // دریافت حقوق کارمند
          const salaryUrl = archiveId 
            ? `/api/all-salaries?archiveId=${archiveId}`
            : '/api/all-salaries'
          
          const salaryResponse = await fetch(salaryUrl)
          let employeeSalary = null
          if (salaryResponse.ok) {
            const allSalaries = await salaryResponse.json()
            employeeSalary = allSalaries.find((salary: any) => 
              salary.employeeId?.toString() === employee._id?.toString()
            )
          }

          // دریافت پورسانت کارمند
          const commissionUrl = archiveId 
            ? `/api/user-commissions/${employee._id}?archiveId=${archiveId}`
            : `/api/user-commissions/${employee._id}`
          
          const commissionResponse = await fetch(commissionUrl)
          let totalCommission = 0
          if (commissionResponse.ok) {
            const commissions = await commissionResponse.json()
            totalCommission = commissions
              .filter((c: any) => c.isActive !== false)
              .reduce((sum: number, c: any) => sum + (c.commission || 0), 0)
          }

          return {
            ...employee,
            baseSalary: employeeSalary?.baseSalary || 0,
            commission: totalCommission,
            additions: employeeSalary?.additions || [],
            deductions: employeeSalary?.deductions || []
          }
        })
      )

      // فیلتر کردن کارمندان با مقادیر غیرصفر
      const filtered = employeesWithData.filter(hasNonZeroValues)
      setFilteredEmployees(filtered)

    } catch (error) {
      console.error('Error filtering employees:', error)
      setFilteredEmployees(employeesData) // در صورت خطا، همه کارمندان را نشان بده
    }
  }

  const handleEmployeeClick = (employee: TeamMember) => {
    setSelectedEmployee(employee)
    setIsEmployeeDialogOpen(true)
  }

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGuestFormData({
      ...guestFormData,
      [name]: name === "referralFee" ? Number.parseInt(value) || 0 : value,
    })
  }

  const handleAddGuest = async () => {
    if (!guestFormData.fullName.trim()) {
      toast({
        title: "خطا",
        description: "نام و نام خانوادگی نمی‌تواند خالی باشد",
        variant: "destructive",
      })
      return
    }

    // دریافت archiveId فعال
    let archiveId = ""
    const stored = localStorage.getItem("activeArchive")
    if (stored) {
      try { archiveId = JSON.parse(stored)._id } catch {}
    }

    try {
      const response = await fetch("/api/guest-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...guestFormData,
          dateAdded: new Date().toISOString().split("T")[0],
          archiveId, // اضافه شد
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ایجاد فرد مهمان")
      }

      const newGuest = await response.json()
      setGuests([...guests, newGuest])
      setGuestFormData({
        fullName: "",
        referralFee: 0,
        description: "",
      })
      setIsAddGuestDialogOpen(false)

      toast({
        title: "موفق",
        description: "فرد مهمان با موفقیت اضافه شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد فرد مهمان",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guest-referrals/${guestId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("خطا در حذف فرد مهمان")
      }

      setGuests(guests.filter((guest) => guest._id !== guestId))
      toast({
        title: "موفق",
        description: "فرد مهمان با موفقیت حذف شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف فرد مهمان",
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadPayslips = async () => {
    if (filteredEmployees.length === 0) {
      toast({
        title: "خطا",
        description: "هیچ کارمندی برای آپلود فیش حقوقی یافت نشد",
        variant: "destructive",
      })
      return
    }

    const confirmUpload = window.confirm(
      `آیا از آپلود فیش حقوقی برای ${filteredEmployees.length} کارمند مطمئن هستید؟`
    )
    
    if (!confirmUpload) return

    setIsBulkUploading(true)
    setBulkUploadProgress({ current: 0, total: filteredEmployees.length })

    let successCount = 0
    let failureCount = 0
    const failures: string[] = []

    try {
      // دریافت archiveId فعال
      let archiveId = ""
      const stored = localStorage.getItem("activeArchive")
      if (stored) {
        try { archiveId = JSON.parse(stored)._id } catch {}
      }

      for (let i = 0; i < filteredEmployees.length; i++) {
        const employee = filteredEmployees[i]
        setBulkUploadProgress({ current: i + 1, total: filteredEmployees.length })

        try {
          // دریافت اطلاعات کامل کارمند برای ایجاد فیش حقوقی
          const salaryUrl = archiveId 
            ? `/api/all-salaries?archiveId=${archiveId}`
            : '/api/all-salaries'
          
          const salaryResponse = await fetch(salaryUrl)
          let employeeSalary = { baseSalary: 0, additions: [], deductions: [], taxDeduction: 0, description: "" }
          if (salaryResponse.ok) {
            const allSalaries = await salaryResponse.json()
            const foundSalary = allSalaries.find((salary: any) => 
              salary.employeeId?.toString() === employee._id?.toString()
            )
            if (foundSalary) {
              employeeSalary = foundSalary
            }
          }

          // دریافت پورسانت کارمند
          const commissionUrl = archiveId 
            ? `/api/user-commissions/${employee._id}?archiveId=${archiveId}`
            : `/api/user-commissions/${employee._id}`
          
          const commissionResponse = await fetch(commissionUrl)
          let totalCommission = 0
          let assignments = []
          if (commissionResponse.ok) {
            const commissions = await commissionResponse.json()
            assignments = commissions
            totalCommission = commissions
              .filter((c: any) => c.isActive !== false)
              .reduce((sum: number, c: any) => sum + (c.commission || 0), 0)
          }

          // ایجاد PDF و آپلود
          await generateAndUploadPayslip(employee, employeeSalary, totalCommission, assignments)
          successCount++

        } catch (error) {
          console.error(`خطا در آپلود فیش ${employee.fullName}:`, error)
          failureCount++
          failures.push(employee.fullName)
        }

        // تاخیر کوتاه بین درخواست‌ها برای جلوگیری از اشباع سرور
        await new Promise(resolve => setTimeout(resolve, 500))
      }

    } catch (error) {
      console.error('خطا در آپلود گروهی:', error)
    } finally {
      setIsBulkUploading(false)
      setBulkUploadProgress({ current: 0, total: 0 })
      
      // نمایش نتیجه
      const successMessage = `${successCount} فیش حقوقی با موفقیت آپلود شد`
      const failureMessage = failureCount > 0 ? `\n${failureCount} مورد ناموفق: ${failures.join(', ')}` : ''
      
      if (successCount > 0) {
        toast({
          title: "آپلود گروهی تکمیل شد",
          description: successMessage + failureMessage,
        })
      } else {
        toast({
          title: "خطا در آپلود گروهی",
          description: "هیچ فیش حقوقی آپلود نشد" + failureMessage,
          variant: "destructive",
        })
      }
    }
  }

  const generateAndUploadPayslip = async (employee: any, salary: any, commission: number, assignments: any[]) => {
    // Dynamic import libraries
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import("html2canvas"),
      import("jspdf")
    ])
    const html2canvas = html2canvasModule.default
    const jsPDF = jsPDFModule.default

    // ایجاد HTML محتوای فیش حقوقی
    const createPayslipHtml = () => {
      const totalAdditions = salary.additions?.reduce((sum: number, addition: any) => sum + (addition.amount || 0), 0) || 0
      const totalDeductions = salary.deductions?.reduce((sum: number, deduction: any) => sum + (deduction.amount || 0), 0) || 0
      const finalSalary = (salary.baseSalary || 0) + commission + totalAdditions - totalDeductions - (salary.taxDeduction || 0)

      return `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'IRANSansWeb', Arial, sans-serif; direction: rtl; text-align: right; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .employee-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            .salary-table th { background: #007bff; color: white; }
            .total-row { background: #e9ecef; font-weight: bold; }
            .final-amount { background: #28a745; color: white; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">فیش حقوقی</div>
            <div>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</div>
          </div>
          
          <div class="employee-info">
            <strong>نام و نام خانوادگی:</strong> ${employee.fullName}<br>
            <strong>سمت:</strong> ${employee.position}
          </div>

          <table class="salary-table">
            <tr><th>شرح</th><th>مبلغ (ریال)</th></tr>
            <tr><td>حقوق پایه</td><td>${(salary.baseSalary || 0).toLocaleString()}</td></tr>
            <tr><td>پورسانت</td><td>${commission.toLocaleString()}</td></tr>
            ${salary.additions?.map((addition: any) => 
              `<tr><td>${addition.title}</td><td>${addition.amount.toLocaleString()}</td></tr>`
            ).join('') || ''}
            <tr class="total-row"><td>جمع کل دریافتی</td><td>${((salary.baseSalary || 0) + commission + totalAdditions).toLocaleString()}</td></tr>
            ${salary.deductions?.map((deduction: any) => 
              `<tr><td>${deduction.title} (کسر)</td><td>${deduction.amount.toLocaleString()}</td></tr>`
            ).join('') || ''}
            ${(salary.taxDeduction || 0) > 0 ? `<tr><td>کسر مالیات</td><td>${salary.taxDeduction.toLocaleString()}</td></tr>` : ''}
            <tr class="total-row"><td>جمع کل کسورات</td><td>${(totalDeductions + (salary.taxDeduction || 0)).toLocaleString()}</td></tr>
            <tr class="final-amount"><td>مبلغ قابل پرداخت</td><td>${finalSalary.toLocaleString()}</td></tr>
          </table>

          ${salary.description ? `<div><strong>توضیحات:</strong> ${salary.description}</div>` : ''}
        </body>
        </html>
      `
    }

    // ایجاد HTML برای تبدیل به PDF
    const htmlContent = createPayslipHtml()

    // ایجاد div موقت در DOM
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = '794px' // A4 width in px
    tempDiv.style.fontFamily = 'IRANSansWeb, Arial, sans-serif'
    tempDiv.style.fontSize = '14px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.color = '#000'
    tempDiv.style.background = '#fff'
    tempDiv.style.padding = '40px'

    document.body.appendChild(tempDiv)

    try {
      // تبدیل به canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      // ایجاد PDF
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      doc.addImage(imageData, 'JPEG', 0, 0, imgWidth, imgHeight)

      // تبدیل PDF به base64
      const pdfData = doc.output('datauristring')
      
      // نام فایل
      const fileName = `فیش-حقوقی-${employee.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`

      // ارسال به API برای آپلود
      const response = await fetch('/api/upload-payslip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee._id,
          pdfData,
          fileName
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'خطا در آپلود فایل')
      }

    } finally {
      // حذف div موقت
      document.body.removeChild(tempDiv)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* بخش کارمندان */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>کارمندان</CardTitle>
          <Button 
            onClick={handleBulkUploadPayslips}
            disabled={isBulkUploading || filteredEmployees.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {isBulkUploading ? (
              <>
                <div className="w-4 h-4 ml-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                آپلود گروهی ({bulkUploadProgress.current}/{bulkUploadProgress.total})
              </>
            ) : (
              <>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                آپلود همه فیش‌ها
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <span>{employee.fullName}</span>
                  <span className="text-sm text-muted-foreground">{employee.position}</span>
                </div>
              ))}
              {filteredEmployees.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  هیچ کارمندی با مقادیر غیرصفر یافت نشد
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* بخش افراد مهمان */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>افراد مهمان</CardTitle>
          <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="ml-2 h-4 w-4" />
                افزودن فرد مهمان
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزودن فرد مهمان</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName">نام و نام خانوادگی</label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="نام و نام خانوادگی"
                    value={guestFormData.fullName}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="referralFee">هزینه ارجاع (ریال)</label>
                  <Input
                    id="referralFee"
                    name="referralFee"
                    type="number"
                    placeholder="هزینه ارجاع"
                    value={guestFormData.referralFee}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description">توضیحات</label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="توضیحات"
                    value={guestFormData.description}
                    onChange={handleGuestInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddGuestDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleAddGuest}>افزودن</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {guests.map((guest) => (
                <div key={guest._id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div>{guest.fullName}</div>
                    <div className="text-sm text-muted-foreground">{guest.referralFee.toLocaleString()} ریال</div>
                    {guest.description && <div className="text-xs text-muted-foreground mt-1">{guest.description}</div>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteGuest(guest._id)}>
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmployeeSalaryDialog
          employee={selectedEmployee}
          open={isEmployeeDialogOpen}
          onOpenChange={setIsEmployeeDialogOpen}
        />
      )}
    </div>
  )
}
