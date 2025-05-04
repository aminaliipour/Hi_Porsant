"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Project {
  _id: string
  name: string
}

interface SectionWeight {
  sectionName: string
  fieldName: string
  weight: number
}

interface ProjectCommissionDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProjectSection {
  _id: string
  sectionName: string
  isActive: boolean
}

interface SectionItem {
  name: string
  fields: string[]
}

export function ProjectCommissionDialog({ project, open, onOpenChange }: ProjectCommissionDialogProps) {
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [income, setIncome] = useState<Record<string, any>>({})
  const [weights, setWeights] = useState<SectionWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionDetails, setSectionDetails] = useState<Record<string, any>>({})
  const [totalAmount, setTotalAmount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, project._id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت بخش‌های پروژه
      const sectionsResponse = await fetch(`/api/project-sections?projectId=${project._id}`)
      const sectionsData = await sectionsResponse.json()
      setSections(sectionsData)

      // دریافت اطلاعات درآمد پروژه
      const incomeResponse = await fetch(`/api/project-incomes?projectId=${project._id}`)
      const incomeData = await incomeResponse.json()

      if (incomeData.length > 0) {
        setIncome(incomeData[0])
      } else {
        setLoading(false)
        return
      }

      // دریافت وزن‌های بخش‌ها
      const weightsResponse = await fetch("/api/section-weights")
      const weightsData = await weightsResponse.json()
      if (Array.isArray(weightsData)) {
        setWeights(weightsData)
      } else {
        toast({
          title: "هشدار",
          description: "وزن‌های بخش‌ها تنظیم نشده‌اند",
          variant: "default",
        })
      }

      // دریافت جزئیات هر بخش
      const details: Record<string, any> = {}
      for (const section of sectionsData) {
        if (["طراحی", "پیمانکاری", "مشاوره"].includes(section.sectionName)) {
          const endpoint = getEndpointForSection(section.sectionName)
          try {
            const detailsResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
            const detailsData = await detailsResponse.json()
            if (detailsData.length > 0) {
              details[section.sectionName] = detailsData[0]
            }
          } catch (error) {
            console.error('Error fetching section details:', error)
          }
        }
      }
      setSectionDetails(details)

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

  const getFieldsForSection = (sectionName: string) => {
    const sections: Record<string, string[]> = {
      خرید: ["متراژ", "استعلام قیمت", "هماهنگی با نصاب", "بودجه", "سفارش", "تحویل باربری", "گرفتن فاکتور نهایی"],
      همکاری: [
        "بازدید",
        "ابعاد و اندازه",
        "براورد مالی",
        "برآورد زمانی",
        "قرارداد",
        "گرفتن بودجه",
        "تهیه جنس",
        "نظارت بر اجرای درست",
        "گرفتن فاکتور نهایی",
        "تحویل نهایی پروژه",
      ],
      فروش: ["متراژ", "۳ سطح پیشنهاد", "هماهنگی زمان و اندازه با نصاب", "گرفتن موجودی", "بودجه", "سفارش", "تحویل بار"],
      طراحی: [
        "برداشت میدانی",
        "ترسیم وضع موجود",
        "طراحی اولیه",
        "نقشه نهایی 2d",
        "نقشه آماده 3d(نما-مقطع-پلان-روف-محوطه)",
        "3D Modeling",
        "3D Rendering & Animation",
        "نقشه اجرایی فاز ۱",
        "نقشه اجرایی فاز ۲",
        "آلبوم عکس و نقشه",
      ],
      پیمانکاری: ["فاصله زمانی", "سختی کار", "تحویل نهایی کار و آلبوم", "ارجاع توسط"],
      مشاوره: ["بازدید", "پر کردن چک لیست", "مشاوره"],
    }
    return sections[sectionName] || []
  }

  // اصلاح تابع getActiveFields برای پشتیبانی بهتر از آیتم‌ها
  const getActiveFields = (sectionName: string, itemName: string = "") => {
    const fields = getFieldsForSection(sectionName)
    if (!fields) return []

    return fields.filter(field => {
      const key = itemName ? `${sectionName}_${itemName}_${field}` : `${sectionName}_${field}`
      return income.details[key]?.isActive !== false
    })
  }

  // اصلاح تابع getDistributedWeight برای محاسبه دقیق‌تر وزن‌ها
  const getDistributedWeight = (sectionName: string, itemName: string = "", activeFields: string[]) => {
    const sectionWeights = weights.filter(w => w.sectionName === sectionName)
    
    // فیلتر کردن فیلدهای مربوط به بخش فعلی
    const relevantWeights = sectionWeights.filter(w => activeFields.includes(w.fieldName))
    
    // جمع وزن‌های اولیه فیلدهای فعال
    let activeWeightsSum = 0
    const originalWeights = new Map()
    
    for (const weight of relevantWeights) {
      originalWeights.set(weight.fieldName, weight.weight / 100) // تبدیل به درصد
      activeWeightsSum += weight.weight / 100 // تبدیل به درصد
    }

    // اگر هیچ وزن فعالی نداریم، صفر برمی‌گردانیم
    if (activeWeightsSum === 0) {
      return () => 0
    }

    // محاسبه مجموع کل وزن‌های اولیه (شامل غیرفعال‌ها)
    const totalOriginalWeight = sectionWeights.reduce((sum, w) => sum + (w.weight / 100), 0) // تبدیل به درصد

    // محاسبه وزن‌های جدید با حفظ نسبت
    const redistributedWeights = new Map()
    for (const field of activeFields) {
      const originalWeight = originalWeights.get(field) || 0
      // توزیع وزن‌های غیرفعال به نسبت وزن اولیه هر فیلد فعال
      const newWeight = (originalWeight / activeWeightsSum) * totalOriginalWeight
      redistributedWeights.set(field, newWeight)
    }

    // برگرداندن تابعی که وزن هر فیلد را برمی‌گرداند
    return (field: string) => {
      return redistributedWeights.get(field) || 0
    }
  }

  const getEndpointForSection = (sectionName: string) => {
    switch (sectionName) {
      case "خرید":
        return "purchase-details"
      case "همکاری":
        return "collaboration-details"
      case "فروش":
        return "sale-details"
      case "طراحی":
        return "design-details"
      case "پیمانکاری":
        return "contracting-details"
      case "مشاوره":
        return "consultation-details"
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>پورسانت پروژه: {project.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !income.details ? (
          <div className="text-center py-8">
            هیچ درآمدی برای این پروژه ثبت نشده است
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-6">
                {/* بخش‌های دارای آیتم */}
                {["خرید", "همکاری", "فروش"].map((sectionName) => {
                  const section = sections.find(s => s.sectionName === sectionName)
                  if (!section || section.isActive === false) return null

                  const sectionItems = new Set()
                  
                  // جمع‌آوری آیتم‌های فعال
                  for (const key in income.details) {
                    if (key.startsWith(`${sectionName}_`)) {
                      const parts = key.split("_")
                      if (parts.length >= 3 && income.details[key].isActive !== false) {
                        sectionItems.add(parts[1])
                      }
                    }
                  }

                  if (sectionItems.size === 0) return null

                  return (
                    <Card key={sectionName}>
                      <CardHeader>
                        <CardTitle>{sectionName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {Array.from(sectionItems).map((item: unknown) => {
                          const itemName = String(item)
                          const activeFields = getActiveFields(sectionName, itemName)
                          if (activeFields.length === 0) return null

                          const distributedWeight = getDistributedWeight(sectionName, "", activeFields)
                          let itemTotal = 0

                          return (
                            <div key={itemName} className="space-y-4">
                              <h4 className="font-medium text-primary">{itemName}</h4>
                              <div className="space-y-2 pr-4">
                                {activeFields.map((field) => {
                                  const key = `${sectionName}_${itemName}_${field}`
                                  const value = income.details[key]?.value || 0
                                  const weight = distributedWeight(field)
                                  const weightedValue = Math.round(value * weight)
                                  itemTotal += weightedValue
                                  return (
                                    <div key={field} className="flex justify-between items-center">
                                      <span>{field}:</span>
                                      <span>{weightedValue.toLocaleString()} ریال (وزن: {(weight * 100).toFixed(1)}٪)</span>
                                    </div>
                                  )
                                })}
                                <div className="flex justify-between font-medium text-amber-600 pt-2">
                                  <span>جمع {itemName}:</span>
                                  <span>{itemTotal.toLocaleString()} ریال</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}

                {/* بخش‌های بدون آیتم */}
                {["طراحی", "پیمانکاری", "مشاوره"].map((sectionName) => {
                  // چک کردن فعال بودن بخش
                  const section = sections.find(s => s.sectionName === sectionName)
                  if (!section || section.isActive === false) return null;

                  if (!sectionDetails[sectionName]) return null

                  const activeFields = getActiveFields(sectionName)
                  if (activeFields.length === 0) return null

                  const distributedWeight = getDistributedWeight(sectionName, "", activeFields)
                  let sectionTotal = 0

                  return (
                    <Card key={sectionName}>
                      <CardHeader>
                        <CardTitle>{sectionName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {activeFields.map((field) => {
                          const key = `${sectionName}_${field}`
                          const value = income.details[key]?.value || 0
                          const weight = distributedWeight(field)
                          const weightedValue = Math.round(value * weight)
                          sectionTotal += weightedValue
                          return (
                            <div key={field} className="flex justify-between items-center">
                              <span>{field}:</span>
                              <span>
                                {weightedValue.toLocaleString()} ریال (وزن: {(weight * 100).toFixed(1)}%)
                              </span>
                            </div>
                          )
                        })}
                        <div className="flex justify-between font-medium text-primary pt-2">
                          <span>جمع بخش:</span>
                          <span>{sectionTotal.toLocaleString()} ریال</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
            
            <div className="flex-shrink-0 mt-4">
              <Separator className="mb-4" />
              <div className="py-4 px-2 bg-secondary/10 rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>جمع کل پورسانت:</span>
                  <span className="text-primary">
                    {Object.entries(income.details || {})
                      .reduce((total, [key, value]: [string, any]) => {
                        if (value.isActive !== false && value.value) {
                          const sectionName = key.split('_')[0]
                          const field = key.split('_').pop()
                          const section = sections.find(s => s.sectionName === sectionName)
                          if (section && section.isActive !== false) {
                            const activeFields = getActiveFields(sectionName)
                            const distributedWeight = getDistributedWeight(sectionName, "", activeFields)
                            const weight = distributedWeight(field)
                            return total + Math.round(value.value * weight)
                          }
                        }
                        return total
                      }, 0)
                      .toLocaleString()} ریال
                  </span>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  بستن
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
