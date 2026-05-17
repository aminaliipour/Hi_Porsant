"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NumberInput } from "@/components/number-input"
import { CommissionInvoicePdf } from "@/components/CommissionInvoicePdf"
import { Switch } from "@/components/ui/switch"
import { AdditionsDialog } from "./additions-dialog"
import { DeductionsDialog } from "./deductions-dialog"

interface TeamMember {
  _id: string
  fullName: string
  position: string
}

interface UserAssignment {
  projectName: string
  sectionName: string
  itemName?: string
  fieldName: string
  commission: number
  income: number
  weight: number
  systemPercent: number
  isActive: boolean // وضعیت فعال/غیرفعال
}

interface EmployeeSalaryDialogProps {
  employee: TeamMember
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeSalaryDialog({ employee, open, onOpenChange }: EmployeeSalaryDialogProps) {
  const [assignments, setAssignments] = useState<UserAssignment[]>([])
  const [baseSalaryAmount, setBaseSalaryAmount] = useState(133911989) // مقدار قابل تغییر حقوق پایه
  const [insuranceDeduction, setInsuranceDeduction] = useState(true) // کسر بیمه به صورت پیش‌فرض فعال
  const [salary, setSalary] = useState({
    baseSalary: 0,
    additions: [] as Array<{title: string, amount: number}>, // تفصیلی شد
    deductions: [] as Array<{title: string, amount: number}>, // تفصیلی شد
    taxDeduction: 0, // کسر 7% مالیات اضافه شد
    description: "", // فیلد توضیحات اضافه شد
    isPorsanti: false, // حالت پورسانتی
    salary1: 0, // حقوق اول
    salary2: 0, // حقوق دوم
    salary1Base: 133911989, // مبلغ حقوق پایه - هر شخص مبلغ خودش را دارد
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissionStates, setCommissionStates] = useState<Record<string, boolean>>({}) // state برای toggle ها
  const { toast } = useToast()

  useEffect(() => {
    if (open && employee?._id) {
      fetchData()
    }
  }, [open, employee?._id])

  // محاسبه خودکار حقوق اول و دوم هنگام تغییر مبلغ پایه یا وضعیت بیمه
  useEffect(() => {
    if (salary.isPorsanti && assignments.length > 0) {
      const totalIncome = getTotalCommission()
      const calculated = calculatePorsantiSalaries(totalIncome)
      
      // فقط اگر مقادیر تغییر کرده باشند، state را آپدیت کن
      if (calculated.salary1 !== salary.salary1 || calculated.salary2 !== salary.salary2) {
        setSalary(prev => ({
          ...prev,
          salary1: calculated.salary1,
          salary2: calculated.salary2,
          salary1Base: baseSalaryAmount,
        }))
      }
    }
  }, [baseSalaryAmount, insuranceDeduction])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // دریافت archiveId فعال
      let archiveId = ""
      const stored = localStorage.getItem("activeArchive")
      if (stored) {
        try { archiveId = JSON.parse(stored)._id } catch {}
      }

      // دریافت پورسانت‌ها فقط برای آرشیو فعال
      let commissionsUrl = `/api/user-commissions/${employee._id}`
      if (archiveId) commissionsUrl += `?archiveId=${archiveId}`
      const commissionsResponse = await fetch(commissionsUrl)
      if (!commissionsResponse.ok) {
        throw new Error("خطا در دریافت پورسانت‌ها")
      }
      const commissionsData = await commissionsResponse.json()
      if (Array.isArray(commissionsData)) {
        setAssignments(commissionsData)
        
        // تنظیم state های toggle ها
        const states: Record<string, boolean> = {}
        commissionsData.forEach((assignment: UserAssignment, index: number) => {
          const key = `${assignment.projectName}_${assignment.sectionName}_${assignment.itemName || ""}_${assignment.fieldName}_${index}`
          states[key] = assignment.isActive ?? true // اگر isActive تعریف نشده، پیش‌فرض true
        })
        setCommissionStates(states)
      } else {
        setAssignments([])
        setCommissionStates({})
      }

      // دریافت اطلاعات حقوق فقط برای آرشیو فعال
      let salaryUrl = `/api/employee-salaries?employeeId=${employee._id}`
      if (archiveId) salaryUrl += `&archiveId=${archiveId}`
      const salaryResponse = await fetch(salaryUrl)
      if (!salaryResponse.ok) {
        throw new Error("خطا در دریافت اطلاعات حقوق")
      }
      const salaryData = await salaryResponse.json()
      console.log("Fetched salary data:", salaryData)
      if (Array.isArray(salaryData) && salaryData.length > 0) {
        const latestSalary = salaryData[0]
        console.log("Latest salary:", latestSalary)
        
        // اگر پورسانتی فعال است و مقادیر salary1 و salary2 ذخیره شده است، از همان استفاده کن
        // در غیر این صورت، دوباره محاسبه کن
        let salary1Value = latestSalary.salary1 || 0
        let salary2Value = latestSalary.salary2 || 0
        
        if (latestSalary.isPorsanti && (!latestSalary.salary1 || !latestSalary.salary2)) {
          // اگر پورسانتی فعال است ولی مقادیر ذخیره نشده، دوباره محاسبه کن
          const totalIncome = getTotalCommission()
          const calculated = calculatePorsantiSalaries(totalIncome)
          salary1Value = calculated.salary1
          salary2Value = calculated.salary2
        }
        
        // بارگذاری مبلغ حقوق پایه و وضعیت کسر بیمه از دیتابیس
        const loadedSalary1Base = latestSalary.salary1Base || 133911989
        const loadedInsuranceDeduction = latestSalary.insuranceDeduction ?? true
        setBaseSalaryAmount(loadedSalary1Base)
        setInsuranceDeduction(loadedInsuranceDeduction)
        
        setSalary({
          baseSalary: latestSalary.baseSalary || 0,
          additions: Array.isArray(latestSalary.additions) ? latestSalary.additions : [],
          deductions: Array.isArray(latestSalary.deductions) ? latestSalary.deductions : [],
          taxDeduction: latestSalary.taxDeduction || Math.round((latestSalary.baseSalary || 0) * 0.07), // محاسبه 7%
          description: latestSalary.description || "", // فیلد توضیحات اضافه شد
          isPorsanti: latestSalary.isPorsanti || false,
          salary1: salary1Value,
          salary2: salary2Value,
          salary1Base: loadedSalary1Base, // بارگذاری مبلغ حقوق پایه
        })
      } else {
        setSalary({
          baseSalary: 0,
          additions: [],
          deductions: [],
          taxDeduction: 0, // کسر 7% مالیات اضافه شد
          description: "", // فیلد توضیحات اضافه شد
          isPorsanti: false,
          salary1: 0,
          salary2: 0,
          salary1Base: 133911989, // مقدار پیش‌فرض
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "خطا در دریافت اطلاعات")
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculatePorsantiSalaries = (totalIncome: number) => {
    const salary1Base = baseSalaryAmount
    const salary1Insurance = insuranceDeduction ? Math.round(salary1Base * 0.07) : 0
    const salary1 = salary1Base - salary1Insurance
    
    let salary2 = 0
    if (totalIncome > salary1Base) {
      salary2 = totalIncome - salary1Base
    }
    
    return { salary1, salary2, salary1Base }
  }

  const handleSalaryChange = (field: string, value: number | string | boolean) => {
    console.log(`Salary field ${field} changed to:`, value)
    setSalary(prev => {
      const newSalary = {
        ...prev,
        [field]: value,
      }
      
      // اگر حقوق پایه تغییر کرد، 7% آن را محاسبه کن
      if (field === 'baseSalary' && typeof value === 'number') {
        newSalary.taxDeduction = Math.round(value * 0.07)
      }
      
      // اگر حالت پورسانتی فعال شد یا غیرفعال شد، حقوق اول و دوم را محاسبه کن
      if (field === 'isPorsanti') {
        if (value === true) {
          const totalIncome = getTotalCommission()
          const { salary1, salary2 } = calculatePorsantiSalaries(totalIncome)
          newSalary.salary1 = salary1
          newSalary.salary2 = salary2
          newSalary.salary1Base = baseSalaryAmount // ذخیره مقدار فعلی
        } else {
          // اگر غیرفعال شد، صفر کن
          newSalary.salary1 = 0
          newSalary.salary2 = 0
        }
      }
      
      console.log("New salary state:", newSalary)
      return newSalary
    })
  }

  const handleCommissionToggle = (key: string, index: number) => {
    const newState = !commissionStates[key]
    setCommissionStates(prev => ({
      ...prev,
      [key]: newState
    }))

    // به‌روزرسانی assignment
    setAssignments(prev => prev.map((assignment, i) => 
      i === index ? { ...assignment, isActive: newState } : assignment
    ))
  }

  const getTotalCommission = () => {
    return assignments.reduce((sum, assignment) => {
      // فقط پورسانت‌های فعال را محاسبه کن
      return assignment.isActive !== false ? sum + assignment.commission : sum
    }, 0)
  }

  const getTotalPayment = () => {
    const totalAdditions = salary.additions.reduce((sum, item) => sum + item.amount, 0)
    const totalDeductions = salary.deductions.reduce((sum, item) => sum + item.amount, 0)
    
    if (salary.isPorsanti) {
      // در حالت پورسانتی: حقوق اول + حقوق دوم + اضافات - کسورات
      return salary.salary1 + salary.salary2 + totalAdditions - totalDeductions
    } else {
      // حالت عادی
      return salary.baseSalary + totalAdditions + getTotalCommission() - totalDeductions - salary.taxDeduction
    }
  }

  const saveSalary = async () => {
    console.log("Save salary called with:", salary)
    // دریافت archiveId فعال
    let archiveId = ""
    const stored = localStorage.getItem("activeArchive")
    if (stored) {
      try { archiveId = JSON.parse(stored)._id } catch {}
    }
    if (!archiveId) {
      toast({
        title: "خطا",
        description: "آرشیو فعال انتخاب نشده است!",
        variant: "destructive",
      })
      return
    }
    try {
      // ذخیره حقوق پایه
      console.log("Sending salary data:", {
        employeeId: employee._id,
        baseSalary: salary.baseSalary,
        additions: salary.additions,
        deductions: salary.deductions,
        description: salary.description,
        archiveId,
      })
      
      const response = await fetch("/api/employee-salaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee._id,
          baseSalary: salary.baseSalary,
          additions: salary.additions,
          deductions: salary.deductions,
          taxDeduction: salary.taxDeduction, // کسر 7% اضافه شد
          description: salary.description, // فیلد توضیحات اضافه شد
          isPorsanti: salary.isPorsanti, // حالت پورسانتی
          salary1: salary.salary1, // حقوق اول
          salary2: salary.salary2, // حقوق دوم
          salary1Base: salary.salary1Base, // مبلغ حقوق پایه - هر شخص مبلغ خودش
          insuranceDeduction: insuranceDeduction, // وضعیت کسر بیمه
          archiveId,
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ذخیره اطلاعات حقوق")
      }

      const savedData = await response.json()
      console.log("Saved salary data:", savedData)

      // ذخیره حالت toggle های پورسانت‌ها
      const commissionStatesResponse = await fetch("/api/user-commissions/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee._id,
          archiveId,
          commissionStates: assignments.map((assignment, index) => ({
            projectName: assignment.projectName,
            sectionName: assignment.sectionName,
            itemName: assignment.itemName || "",
            fieldName: assignment.fieldName,
            isActive: assignment.isActive !== false
          }))
        }),
      })

      if (!commissionStatesResponse.ok) {
        console.warn("خطا در ذخیره حالت پورسانت‌ها")
      }

      toast({
        title: "موفق",
        description: "اطلاعات حقوق با موفقیت ذخیره شد",
      })
      await fetchData() // اطلاعات جدید را واکشی کن
      onOpenChange(false) // دیالوگ را ببند
    } catch (error) {
      console.error("Error saving salary:", error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات حقوق",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>حقوق و مزایای {employee?.fullName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-4">
            <span>در حال بارگذاری...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-6 p-2">
              <Card>
                <CardHeader>
                  <CardTitle>حقوق پایه و مزایا</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* سوئیچ پورسانتی */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div>
                      <label className="font-medium text-lg">حالت پورسانتی</label>
                      <p className="text-sm text-gray-600">
                        فعال‌سازی محاسبه حقوق بر اساس سیستم پورسانتی
                      </p>
                    </div>
                    <Switch
                      checked={salary.isPorsanti}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const totalIncome = getTotalCommission()
                          const { salary1, salary2 } = calculatePorsantiSalaries(totalIncome)
                          setSalary(prev => ({
                            ...prev,
                            isPorsanti: true,
                            salary1,
                            salary2,
                            salary1Base: baseSalaryAmount, // ذخیره مقدار فعلی
                          }))
                        } else {
                          setSalary(prev => ({
                            ...prev,
                            isPorsanti: false,
                            salary1: 0,
                            salary2: 0
                          }))
                        }
                      }}
                    />
                  </div>

                  {/* فیلد ورودی حقوق پایه - فقط در حالت پورسانتی */}
                  {salary.isPorsanti && (
                    <div className="space-y-2 p-4 border rounded-lg bg-purple-50">
                      <label className="font-medium">مبلغ حقوق پایه:</label>
                      <NumberInput
                        value={baseSalaryAmount.toString()}
                        onChange={(value) => {
                          const numValue = typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0
                          setBaseSalaryAmount(numValue)
                          // محاسبه مجدد حقوق اول و دوم
                          const totalIncome = getTotalCommission()
                          const { salary1, salary2 } = calculatePorsantiSalaries(totalIncome)
                          setSalary(prev => ({
                            ...prev,
                            salary1,
                            salary2,
                            salary1Base: numValue, // ذخیره در state برای ارسال به دیتابیس
                          }))
                        }}
                        placeholder="مبلغ حقوق پایه"
                      />
                    </div>
                  )}

                  {/* سوئیچ کسر بیمه - فقط در حالت پورسانتی */}
                  {salary.isPorsanti && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                      <div>
                        <label className="font-medium text-lg">کسر بیمه (7%)</label>
                        <p className="text-sm text-gray-600">
                          کسر 7% بیمه از حقوق پایه
                        </p>
                      </div>
                      <Switch
                        checked={insuranceDeduction}
                        onCheckedChange={(checked) => {
                          setInsuranceDeduction(checked)
                          // محاسبه مجدد حقوق اول و دوم
                          const totalIncome = getTotalCommission()
                          const { salary1, salary2 } = calculatePorsantiSalaries(totalIncome)
                          setSalary(prev => ({
                            ...prev,
                            salary1,
                            salary2,
                            salary1Base: baseSalaryAmount, // حفظ مقدار فعلی
                          }))
                        }}
                      />
                    </div>
                  )}

                  {salary.isPorsanti ? (
                    // نمایش حقوق اول و دوم برای حالت پورسانتی
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-green-50">
                        <label className="font-medium text-lg block mb-2">حقوق اول</label>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">مبلغ پایه:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('fa-IR').format(baseSalaryAmount)} ریال
                            </span>
                          </div>
                          {insuranceDeduction && (
                            <div className="flex justify-between text-red-600">
                              <span className="text-sm">کسر بیمه (7%):</span>
                              <span className="font-medium">
                                {new Intl.NumberFormat('fa-IR').format(Math.round(baseSalaryAmount * 0.07))} ریال
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-green-300">
                            <span className="font-bold">حقوق اول خالص:</span>
                            <span className="font-bold text-green-700">
                              {new Intl.NumberFormat('fa-IR').format(salary.salary1)} ریال
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-yellow-50">
                        <label className="font-medium text-lg block mb-2">حقوق دوم</label>
                        {getTotalCommission() < baseSalaryAmount ? (
                          <div className="text-center py-2 text-orange-600">
                            <p className="font-medium">مجموع درآمد کمتر از حقوق پایه است</p>
                            <p className="text-sm mt-1">
                              کمبود: {new Intl.NumberFormat('fa-IR').format(baseSalaryAmount - getTotalCommission())} ریال
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">مجموع درآمد:</span>
                              <span className="font-medium">
                                {new Intl.NumberFormat('fa-IR').format(getTotalCommission())} ریال
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">منهای حقوق پایه:</span>
                              <span className="font-medium">
                                {new Intl.NumberFormat('fa-IR').format(baseSalaryAmount)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-yellow-300">
                              <span className="font-bold">حقوق دوم:</span>
                              <span className="font-bold text-yellow-700">
                                {new Intl.NumberFormat('fa-IR').format(salary.salary2)} ریال
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // نمایش معمولی حقوق پایه
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label>حقوق پایه:</label>
                        <NumberInput
                          value={salary.baseSalary.toString()}
                          onChange={(value) => handleSalaryChange("baseSalary", value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-medium">اضافات (پاداش و مزایا):</label>
                      <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                        <div className="text-sm">
                          <span className="font-medium">تعداد آیتم‌ها: </span>
                          <span>{salary.additions.length}</span>
                          <br />
                          <span className="font-medium text-green-700">مجموع: </span>
                          <span className="text-green-700">
                            {new Intl.NumberFormat('fa-IR').format(salary.additions.reduce((sum, item) => sum + item.amount, 0))} ریال
                          </span>
                        </div>
                        <AdditionsDialog 
                          additions={salary.additions}
                          onAdditionsChange={(newAdditions) => {
                            console.log("Additions updated:", newAdditions)
                            setSalary({...salary, additions: newAdditions})
                          }}
                        >
                          <Button variant="outline" size="sm">
                            مدیریت اضافات
                          </Button>
                        </AdditionsDialog>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium">کسورات (بیمه، مالیات و سایر):</label>
                      <div className="flex items-center justify-between p-3 border rounded-md bg-red-50">
                        <div className="text-sm">
                          <span className="font-medium">تعداد آیتم‌ها: </span>
                          <span>{salary.deductions.length}</span>
                          <br />
                          <span className="font-medium text-red-700">مجموع: </span>
                          <span className="text-red-700">
                            {new Intl.NumberFormat('fa-IR').format(salary.deductions.reduce((sum, item) => sum + item.amount, 0))} ریال
                          </span>
                        </div>
                        <DeductionsDialog 
                          deductions={salary.deductions}
                          onDeductionsChange={(newDeductions) => {
                            console.log("Deductions updated:", newDeductions)
                            setSalary({...salary, deductions: newDeductions})
                          }}
                        >
                          <Button variant="outline" size="sm">
                            مدیریت کسورات
                          </Button>
                        </DeductionsDialog>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label>کسر 7% (بیمه):</label>
                      <div className="p-2 bg-red-50 rounded-md text-red-600 font-medium">
                        {new Intl.NumberFormat('fa-IR').format(salary.taxDeduction)} ریال
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label>مجموع پورسانت:</label>
                      <div className="p-2 bg-gray-50 rounded-md text-green-600 font-medium">
                        {new Intl.NumberFormat('fa-IR').format(getTotalCommission())} ریال
                      </div>
                    </div>
                  </div>

                  {/* قسمت توضیحات */}
                  <div className="space-y-2 mt-4">
                    <label>توضیحات:</label>
                    <Textarea
                      value={salary.description}
                      onChange={(e) => {
                        console.log("Description changed to:", e.target.value)
                        handleSalaryChange("description", e.target.value)
                      }}
                      placeholder="توضیحات مربوط به حقوق و مزایا..."
                      className="min-h-[100px]"
                    />
                    <div className="text-xs text-gray-500">
                      طول فعلی: {salary.description?.length || 0} کاراکتر
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">جمع کل دریافتی:</span>
                      <span className="font-bold text-lg text-green-600">
                        {new Intl.NumberFormat('fa-IR').format(getTotalPayment())} ریال
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {assignments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>جزئیات پورسانت‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignments.map((assignment, index) => {
                        const key = `${assignment.projectName}_${assignment.sectionName}_${assignment.itemName || ""}_${assignment.fieldName}_${index}`
                        const isActive = assignment.isActive !== false
                        
                        return (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{assignment.projectName}</p>
                                <p className="text-sm text-gray-500">
                                  {assignment.sectionName} {assignment.itemName && `- ${assignment.itemName}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  درآمد: {new Intl.NumberFormat('fa-IR').format(assignment.income)} ریال
                                </p>
                                <p className="text-sm text-gray-500">
                                  پورسانت: {assignment.weight}%
                                </p>
                              </div>
                              <div className="text-left">
                                <p className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                  {isActive 
                                    ? new Intl.NumberFormat('fa-IR').format(assignment.commission) 
                                    : '0'
                                  } ریال
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-medium">وضعیت محاسبه:</span>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleCommissionToggle(key, index)}
                                label={isActive ? "فعال" : "غیرفعال"}
                                size="small"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={saveSalary}>ذخیره</Button>
          <CommissionInvoicePdf
            fullName={employee.fullName}
            position={employee.position}
            assignments={assignments.filter(assignment => assignment.isActive !== false)} // فقط پورسانت‌های فعال
            totalCommission={getTotalCommission()}
            baseSalary={salary.isPorsanti ? salary.salary1Base : salary.baseSalary}
            additions={salary.additions}
            deductions={salary.deductions}
            taxDeduction={salary.isPorsanti ? (insuranceDeduction ? Math.round((salary.salary1Base || 0) * 0.07) : 0) : salary.taxDeduction} // در حالت پورسانتی از salary1Base استفاده کن
            isPorsanti={salary.isPorsanti}
            salary1={salary.salary1}
            salary2={salary.salary2}
            description={salary.description} // فیلد توضیحات اضافه شد
            employeeId={employee._id} // اضافه شد برای آپلود
            onComplete={() => {
              toast({
                title: "موفق",
                description: "عملیات با موفقیت انجام شد",
              })
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
