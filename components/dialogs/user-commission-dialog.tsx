"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeamMember {
  _id: string
  fullName: string
  position: string
}

interface UserCommissionDialogProps {
  member: TeamMember
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Commission {
  projectId: string
  projectName: string
  sectionName: string
  itemName: string
  fieldName: string
  income: number
  weight: number
  systemPercent: number
  commission: number
}

interface GroupedSection {
  name: string
  tasks: Array<{
    itemName: string
    fieldName: string
    income: number
    weight: number
    systemPercent: number
    commission: number
  }>
}

interface GroupedProject {
  projectName: string
  sections: GroupedSection[]
}

interface GroupedCommissions {
  [projectId: string]: GroupedProject
}

export function UserCommissionDialog({ member, open, onOpenChange }: UserCommissionDialogProps) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    if (open && member) {
      fetchCommissionData()
    }
  }, [open, member])

  const fetchCommissionData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/user-commissions/${member._id}`)
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات پورسانت')
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('فرمت داده‌های دریافتی نامعتبر است')
      }
      setCommissions(data)
    } catch (error) {
      console.error('Error fetching commission data:', error)
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات')
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات پورسانت",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const groupCommissionsByProject = (commissions: Commission[]): GroupedCommissions => {
    return commissions.reduce((acc: GroupedCommissions, commission) => {
      if (!acc[commission.projectId]) {
        acc[commission.projectId] = {
          projectName: commission.projectName,
          sections: []
        }
      }

      const project = acc[commission.projectId]
      let section = project.sections.find(s => s.name === commission.sectionName)
      
      if (!section) {
        section = {
          name: commission.sectionName,
          tasks: []
        }
        project.sections.push(section)
      }

      const task = {
        itemName: commission.itemName || commission.fieldName,
        fieldName: commission.fieldName,
        income: commission.income,
        weight: commission.weight,
        systemPercent: commission.systemPercent,
        commission: commission.commission
      }

      // اضافه کردن تسک فقط اگر پورسانت یا وزن بیشتر از صفر باشد
      if (task.commission > 0 || task.weight > 0) {
        section.tasks.push(task)
      }

      return acc
    }, {})
  }

  const groupedCommissions = groupCommissionsByProject(commissions)
  const totalCommission = commissions.reduce((sum, c) => sum + c.commission, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>جزئیات پورسانت {member?.fullName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center پ-4">
            <span>در حال بارگذاری...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : commissions.length === 0 ? (
          <div className="text-center پ-4">
            <p>هیچ پورسانتی برای این کاربر ثبت نشده است</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4 پ-2">
              {Object.entries(groupedCommissions).map(([projectId, project]) => (
                <Card key={projectId}>
                  <CardHeader>
                    <CardTitle>{project.projectName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {project.sections.map((section, sectionIdx) => (
                        <div key={sectionIdx}>
                          <h4 className="font-medium mb-2">{section.name}</h4>
                          <div className="space-y-2">
                            {section.tasks.map((task, taskIdx) => (
                              <div key={taskIdx} className="flex justify-between items-center border-b pb-2">
                                <div>
                                  <p className="font-medium">{task.itemName}</p>
                                  <p className="text-sm text-gray-500">
                                    درآمد: {new Intl.NumberFormat('fa-IR').format(task.income)} ریال
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    پورسانت: {task.weight}% | سهم سیستم: {task.systemPercent}% | سهم نهایی: {(task.weight * (100 - task.systemPercent) / 100).toFixed(2)}%
                                  </p>
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-green-600">
                                    {new Intl.NumberFormat('fa-IR').format(task.commission)} ریال
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card>
                <CardContent className="پ-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>مجموع کل پورسانت:</span>
                    <span className="text-green-600">{new Intl.NumberFormat('fa-IR').format(totalCommission)} ریال</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
