"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NumberInput } from "@/components/number-input"

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
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

      // دریافت پورسانت‌ها
      const commissionsResponse = await fetch(`/api/user-commissions/${employee._id}`)
      if (!commissionsResponse.ok) {
        throw new Error("خطا در دریافت پورسانت‌ها")
      }
      const commissionsData = await commissionsResponse.json()
      
      if (Array.isArray(commissionsData)) {
        setAssignments(commissionsData)
      } else {
        console.error("Invalid commissions data format:", commissionsData)
        setAssignments([])
      }

      // دریافت اطلاعات حقوق
      const salaryResponse = await fetch(`/api/employee-salaries?employeeId=${employee._id}`)
      if (!salaryResponse.ok) {
        throw new Error("خطا در دریافت اطلاعات حقوق")
      }
      
      const salaryData = await salaryResponse.json()

      if (Array.isArray(salaryData) && salaryData.length > 0) {
        const latestSalary = salaryData[0]
        setSalary({
          baseSalary: latestSalary.baseSalary || 0,
          additions: latestSalary.additions || 0,
          deductions: latestSalary.deductions || 0,
        })
      } else {
        setSalary({
          baseSalary: 0,
          additions: 0,
          deductions: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
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

  const handleSalaryChange = (field: string, value: string) => {
    setSalary(prev => ({
      ...prev,
      [field]: Number.parseInt(value) || 0,
    }))
  }

  const getTotalCommission = () => {
    return assignments.reduce((sum, assignment) => sum + assignment.commission, 0)
  }

  const getTotalPayment = () => {
    return salary.baseSalary + salary.additions + getTotalCommission() - salary.deductions
  }

  const saveSalary = async () => {
    try {
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
          date: new Date().toISOString().split("T")[0],
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ذخیره اطلاعات حقوق")
      }

      toast({
        title: "موفق",
        description: "اطلاعات حقوق با موفقیت ذخیره شد",
      })
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
                      {assignments.map((assignment, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{assignment.projectName}</p>
                            <p className="text-sm text-gray-500">
                              {assignment.sectionName} {assignment.itemName && `- ${assignment.itemName}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              درآمد: {new Intl.NumberFormat('fa-IR').format(assignment.income)} ریال
                            </p>
                            <p className="text-sm text-gray-500">
                              پورسانت: {assignment.weight}% | سهم سیستم: {assignment.systemPercent}% | سهم نهایی: {(assignment.weight * (100 - assignment.systemPercent) / 100).toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-green-600">
                              {new Intl.NumberFormat('fa-IR').format(assignment.commission)} ریال
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button onClick={saveSalary}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
