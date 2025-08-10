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
  const [salary, setSalary] = useState({
    baseSalary: 0,
    additions: 0,
    deductions: 0,
    description: "", // فیلد توضیحات اضافه شد
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
        setSalary({
          baseSalary: latestSalary.baseSalary || 0,
          additions: latestSalary.additions || 0,
          deductions: latestSalary.deductions || 0,
          description: latestSalary.description || "", // فیلد توضیحات اضافه شد
        })
      } else {
        setSalary({
          baseSalary: 0,
          additions: 0,
          deductions: 0,
          description: "", // فیلد توضیحات اضافه شد
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

  const handleSalaryChange = (field: string, value: number | string) => {
    console.log(`Salary field ${field} changed to:`, value)
    setSalary(prev => {
      const newSalary = {
        ...prev,
        [field]: value,
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
    return salary.baseSalary + salary.additions + getTotalCommission() - salary.deductions
  }

  const saveSalary = async () => {
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
          description: salary.description, // فیلد توضیحات اضافه شد
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>حقوق پایه:</label>
                      <NumberInput
                        value={salary.baseSalary.toString()}
                        onChange={(value) => handleSalaryChange("baseSalary", value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>اضافات:</label>
                      <NumberInput
                        value={salary.additions.toString()}
                        onChange={(value) => handleSalaryChange("additions", value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label>کسورات:</label>
                      <NumberInput
                        value={salary.deductions.toString()}
                        onChange={(value) => handleSalaryChange("deductions", value)}
                      />
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
            baseSalary={salary.baseSalary}
            additions={salary.additions}
            deductions={salary.deductions}
            description={salary.description} // فیلد توضیحات اضافه شد
            onComplete={() => {
              toast({
                title: "موفق",
                description: "فیش حقوقی با موفقیت دانلود شد",
              })
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
