"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProjectIncomeDialog } from "@/components/dialogs/project-income-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProjectTaxDialog } from "@/components/dialogs/project-tax-dialog"
import { formatNumber } from "@/lib/utils"

interface Project {
  _id: string
  name: string
  hasIncome?: boolean
  totalIncome: number
}

interface ProjectIncome {
  _id: string
  projectId: string
  totalIncome: number
  purchaseProfit?: number
  collaborationProfit?: number
  salesProfit?: number
  designProfit?: number
  contractingProfit?: number
  consultationProfit?: number
}

interface SystemExpenses {
  _id?: string
  staffSalary: number
  officeCosts: number
  maintenanceCosts: number
  workspaceUpgrade: number
  toolsUpgrade: number
  advertisingCosts: number
  digitalDevelopment: number
  paperworkCosts: number
  eventCosts: number
}

export default function SystemTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectIncomes, setProjectIncomes] = useState<ProjectIncome[]>([])
  const [systemShares, setSystemShares] = useState<Record<string, number>>({})
  const [expenses, setExpenses] = useState<SystemExpenses>({
    staffSalary: 0,
    officeCosts: 0,
    maintenanceCosts: 0,
    workspaceUpgrade: 0,
    toolsUpgrade: 0,
    advertisingCosts: 0,
    digitalDevelopment: 0,
    paperworkCosts: 0,
    eventCosts: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false)
  const { toast } = useToast()
  const [taxDialogOpen, setTaxDialogOpen] = useState(false)
  const [projectTaxes, setProjectTaxes] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    fetchProjectTaxes()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت پروژه‌ها
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()
      if (!Array.isArray(projectsData)) {
        throw new Error("دریافت اطلاعات پروژه‌ها با خطا مواجه شد")
      }
      setProjects(projectsData)

      // دریافت درآمدهای پروژه‌ها
      const incomesResponse = await fetch("/api/project-incomes")
      const incomesData = await incomesResponse.json()
      if (!Array.isArray(incomesData)) {
        throw new Error("دریافت اطلاعات درآمد پروژه‌ها با خطا مواجه شد")
      }
      setProjectIncomes(incomesData)

      // دریافت درصدهای سیستم
      const percentagesResponse = await fetch("/api/system-percentages")
      const latestPercentages = await percentagesResponse.json()
      
      // محاسبه سهم سیستم برای هر درآمد
      const shares: Record<string, number> = {}
      if (!latestPercentages.error) {
        incomesData.forEach((income: ProjectIncome) => {
          const project = projectsData.find((p: Project) => p._id === income.projectId)
          // محاسبه سهم سیستم از کل درآمد پروژه
          let totalSystemShare = 0

          // محاسبه سهم سیستم برای هر بخش
          if ((income.purchaseProfit ?? 0) > 0) {
            totalSystemShare += ((income.purchaseProfit ?? 0) * latestPercentages.خرید) / 100
          }
          if ((income.collaborationProfit ?? 0) > 0) {
            totalSystemShare += ((income.collaborationProfit ?? 0) * latestPercentages.همکاری) / 100
          }
          if ((income.salesProfit ?? 0) > 0) {
            totalSystemShare += ((income.salesProfit ?? 0) * latestPercentages.فروش) / 100
          }
          if ((income.designProfit ?? 0) > 0) {
            totalSystemShare += ((income.designProfit ?? 0) * latestPercentages.طراحی) / 100
          }
          if ((income.contractingProfit ?? 0) > 0) {
            totalSystemShare += ((income.contractingProfit ?? 0) * latestPercentages.پیمانکاری) / 100
          }
          if ((income.consultationProfit ?? 0) > 0) {
            totalSystemShare += ((income.consultationProfit ?? 0) * latestPercentages.مشاوره) / 100
          }

          shares[income._id] = Math.round(totalSystemShare)
        })
        setSystemShares(shares)
      } else {
        toast({
          title: "هشدار",
          description: "درصدهای سیستم تنظیم نشده‌اند",
          variant: "destructive",
        })
      }

      // دریافت هزینه‌های سیستم
      const expensesResponse = await fetch("/api/system-expenses")
      const expensesData = await expensesResponse.json()
      if (expensesData && expensesData.length > 0) {
        setExpenses(expensesData[0])
      }
    } catch (error) {
      console.error("Error in fetchData:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectTaxes = async () => {
    try {
      const response = await fetch("/api/project-tax")
      if (!response.ok) throw new Error()
      const data = await response.json()
      setProjectTaxes(data)
    } catch {
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات مالیات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseChange = (key: keyof SystemExpenses, value: string) => {
    setExpenses({
      ...expenses,
      [key]: Number.parseInt(value) || 0,
    })
  }

  const saveExpenses = async () => {
    try {
      await fetch("/api/system-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...expenses,
          date: new Date().toISOString().split("T")[0],
        }),
      })

      toast({
        title: "موفق",
        description: "هزینه‌های سیستم با موفقیت ذخیره شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره هزینه‌های سیستم",
        variant: "destructive",
      })
    }
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setIsIncomeDialogOpen(true)
  }

  const handleUpdateTax = (project: any) => {
    setSelectedProject(project)
    setTaxDialogOpen(true)
  }

  const getTotalIncome = () => {
    return projectIncomes.reduce((sum, income) => sum + income.totalIncome, 0)
  }

  const getTotalSystemShare = () => {
    return Object.values(systemShares).reduce((sum, share) => sum + share, 0)
  }

  const getFinalIncome = () => {
    return getTotalIncome() - getTotalSystemShare()
  }

  const getTotalExpenses = () => {
    return Object.values(expenses).reduce((sum, value) => {
      return sum + (typeof value === "number" ? value : 0)
    }, 0)
  }

  const getProjectTax = (projectId: string) => {
    return projectTaxes.find((tax) => tax.projectId._id === projectId)
  }

  const getTotalSystemExpenses = () => {
    return Object.values(expenses).reduce((sum, value) => {
      return sum + (typeof value === "number" ? value : 0)
    }, 0)
  }

  const getProjectIncome = (projectId: string) => {
    return projectIncomes.find(income => income.projectId === projectId)
  }

  const calculateProjectTotalIncome = (income: ProjectIncome) => {
    if (!income) return 0
    return (
      (income.purchaseProfit || 0) +
      (income.collaborationProfit || 0) +
      (income.salesProfit || 0) +
      (income.designProfit || 0) +
      (income.contractingProfit || 0) +
      (income.consultationProfit || 0)
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>درآمدها و سهم سیستم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">مجموع درآمد:</span>
                <span className="font-medium tabular-nums">{getTotalIncome().toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">سهم سیستم:</span>
                <span className="font-medium tabular-nums">{getTotalSystemShare().toLocaleString()} ریال</span>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-2 mt-4">
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    هیچ پروژه‌ای یافت نشد
                  </div>
                ) : (
                  projects.map((project) => {
                    const income = projectIncomes.find((inc) => inc.projectId === project._id)
                    return (
                      <div key={project._id} className="grid grid-cols-1 gap-1 p-2 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">{project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {income && (
                                <span className="mr-2">
                                  درآمد: {income.totalIncome.toLocaleString()} ریال
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => handleProjectClick(project)}
                          >
                            {income ? 'ویرایش درآمد' : 'ثبت درآمد'}
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div>
          <Card className="shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">منابع هزینه کرد</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[420px]">
                <div className="space-y-3">
                  {Object.entries(expenses)
                    .filter(([key]) => key !== "_id")
                    .filter(([key]) => {
                      // فقط کلیدهایی که لیبل دارند نمایش داده شوند
                      const validLabels = [
                        "staffSalary",
                        "officeCosts",
                        "maintenanceCosts",
                        "workspaceUpgrade",
                        "toolsUpgrade",
                        "advertisingCosts",
                        "digitalDevelopment",
                        "paperworkCosts",
                        "eventCosts"
                      ]
                      return validLabels.includes(key)
                    })
                    .map(([key, value]) => {
                      const label = {
                        staffSalary: "حقوق پرسنل",
                        officeCosts: "هزینه‌های جاری دفتر",
                        maintenanceCosts: "تعمیرات و بازسازی",
                        workspaceUpgrade: "ارتقا فضا کار",
                        toolsUpgrade: "ارتقای ابزار کار",
                        advertisingCosts: "تبلیغات و محتوا",
                        digitalDevelopment: "توسعه دیجیتال",
                        paperworkCosts: "اسناد کاغذی",
                        eventCosts: "نمایشگاه‌ها"
                      }[key as keyof SystemExpenses]

                      return (
                        <div key={key} className="grid grid-cols-3 gap-3 items-center bg-muted/30 p-2 rounded-lg">
                          <label className="col-span-2 text-sm">{label}</label>
                          <Input
                            type="number"
                            className="text-left dir-ltr h-8 text-sm"
                            value={value as number}
                            onChange={(e) => handleExpenseChange(key as keyof SystemExpenses, e.target.value)}
                          />
                        </div>
                      )
                    })}

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center text-lg font-medium text-primary/80">
                      <span>جمع کل هزینه‌ها:</span>
                      <span className="tabular-nums">{getTotalExpenses().toLocaleString()} ریال</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <Button className="w-full mt-4 h-9" onClick={saveExpenses}>
                ذخیره تغییرات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* بخش مالیات پروژه‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>سهم پروژه‌ها از هزینه‌های سیستم (محاسبه خودکار)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {projects.map((project) => {
              const income = getProjectIncome(project._id)
              const totalIncome = calculateProjectTotalIncome(income)
              const allProjectsIncome = projectIncomes.reduce((sum, inc) => sum + calculateProjectTotalIncome(inc), 0)
              const expenseShare = allProjectsIncome > 0 
                ? Math.round((totalIncome / allProjectsIncome) * 100) 
                : 0

              return (
                <div key={project._id} className="bg-muted/30 px-6 py-4 rounded-xl text-center w-[200px]">
                  <div className="text-2xl font-bold text-yellow-500 mb-2">{expenseShare}%</div>
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatNumber(Math.round((getTotalSystemExpenses() * expenseShare) / 100))} تومان
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            سهم هر پروژه از هزینه‌های سیستم به صورت خودکار بر اساس نسبت درآمد آن به کل درآمدها محاسبه می‌شود
          </p>
        </CardContent>
      </Card>

      {selectedProject && (
        <ProjectIncomeDialog
          project={selectedProject}
          open={isIncomeDialogOpen}
          onOpenChange={setIsIncomeDialogOpen}
          onSave={fetchData}
        />
      )}

      {selectedProject && (
        <ProjectTaxDialog
          isOpen={taxDialogOpen}
          onClose={() => {
            setTaxDialogOpen(false)
            setSelectedProject(null)
          }}
          project={selectedProject}
          onSuccess={() => {
            fetchProjectTaxes()
            fetchData()
          }}
        />
      )}
    </div>
  )
}
