"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Project {
  _id: string
  name: string
  hasIncome?: boolean
}

interface ProjectSection {
  _id: string
  projectId: string
  sectionName: string
}

interface SectionItem {
  _id: string
  sectionId: string
  itemName: string
  details?: Record<string, { value: any; isActive: boolean }>
}

interface ProjectIncomeDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function ProjectIncomeDialog({ project, open, onOpenChange, onSave }: ProjectIncomeDialogProps) {
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [items, setItems] = useState<Record<string, SectionItem[]>>({})
  const [incomeValues, setIncomeValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({})
  const [sectionDetails, setSectionDetails] = useState<Record<string, any>>({})
  const { toast } = useToast()

  const [systemPercentages, setSystemPercentages] = useState({
    خرید: 0,
    همکاری: 0,
    فروش: 0,
    طراحی: 0,
    پیمانکاری: 0,
    مشاوره: 0
  })

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, project._id])

  // تابع کمکی برای بررسی اینکه آیا فیلد فعال است
  const isFieldActive = (sectionName: string, itemName: string | undefined, field: string) => {
    if (itemName) {
      const sectionItems = items[sections.find(s => s.sectionName === sectionName)?._id] || []
      const item = sectionItems.find(i => i.itemName === itemName)
      return item?.details?.[field]?.isActive !== false
    } else {
      const details = sectionDetails[sectionName]?.details
      return details?.[field]?.isActive !== false
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      // دریافت درصدهای سیستم
      const percentagesResponse = await fetch("/api/system-percentages")
      const latestPercentages = await percentagesResponse.json()
      if (!latestPercentages.error) {
        setSystemPercentages(latestPercentages)
      }

      // دریافت بخش‌های پروژه
      const sectionsResponse = await fetch(`/api/project-sections?projectId=${project._id}`)
      const sectionsData = await sectionsResponse.json()
      setSections(sectionsData)

      // دریافت آیتم‌ها و وضعیت فیلدها
      const itemsMap: Record<string, SectionItem[]> = {}
      const activeFieldsMap: Record<string, boolean> = {}
      const detailsMap: Record<string, any> = {}

      for (const section of sectionsData) {
        const endpoint = getEndpointForSection(section.sectionName)
        if (endpoint) {
          // دریافت جزئیات برای بخش‌های بدون آیتم
          if (["طراحی", "پیمانکاری", "مشاوره"].includes(section.sectionName)) {
            const detailsResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
            const detailsData = await detailsResponse.json()
            if (detailsData.length > 0) {
              detailsMap[section.sectionName] = detailsData[0]
            }
          }

          // دریافت آیتم‌ها برای بخش‌های دارای آیتم
          const itemsResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
          let itemsData = await itemsResponse.json()
          
          if (Array.isArray(itemsData)) {
            itemsData = itemsData.map((item: any) => {
              if (item.details) {
                Object.entries(item.details).forEach(([field, detail]: [string, any]) => {
                  const key = item.itemName ? 
                    `${section.sectionName}_${item.itemName}_${field}` : 
                    `${section.sectionName}_${field}`
                  activeFieldsMap[key] = detail.isActive !== false
                })
              }
              return {
                ...item,
                details: item.details || {},
              }
            })
          }
          itemsMap[section._id] = itemsData
        }
      }
      
      setItems(itemsMap)
      setActiveFields(activeFieldsMap)
      setSectionDetails(detailsMap)

      // دریافت مقادیر درآمد فعلی
      const incomeResponse = await fetch(`/api/project-incomes?projectId=${project._id}`)
      const incomeDataArr = await incomeResponse.json()
      const incomeData = Array.isArray(incomeDataArr) ? incomeDataArr[0] : incomeDataArr
      
      if (incomeData) {
        const values: Record<string, number> = {}
        if (incomeData.details) {
          Object.entries(incomeData.details).forEach(([key, detail]) => {
            const [sectionName, itemName, field] = key.split('_')
            if (typeof detail === 'object' && detail.value !== undefined && isFieldActive(sectionName, itemName, field)) {
              values[key] = detail.value
            }
          })
        }
        setIncomeValues(values)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // نمایش فقط فیلدهای فعال در بخش‌های بدون آیتم
  const getActiveFieldsForSection = (sectionName: string) => {
    return getFieldsForSection(sectionName).filter(field => 
      isFieldActive(sectionName, undefined, field)
    )
  }

  // فقط بخش‌های فعال را نمایش بده
  const activeSections = sections.filter((section) => section.isActive !== false)

  const calculateFinalValue = (sectionName: string, value: number) => {
    const percentage = systemPercentages[sectionName as keyof typeof systemPercentages] || 0
    return Math.round(value * (1 - percentage / 100))
  }

  const handleValueChange = (key: string, value: string) => {
    setIncomeValues({
      ...incomeValues,
      [key]: Number.parseInt(value) || 0,
    })
  }

  const saveIncome = async () => {
    try {
      const sectionTotals = {
        purchaseProfit: 0,
        designProfit: 0,
        collaborationProfit: 0,
        contractingProfit: 0,
        salesProfit: 0,
        consultationProfit: 0,
      }

      const details: Record<string, { value: number; isActive: boolean }> = {}

      // محاسبه مقادیر نهایی بخش‌های دارای آیتم
      const sectionsWithItems = ["خرید", "همکاری", "فروش"]
      for (const section of sections.filter((s) => sectionsWithItems.includes(s.sectionName))) {
        const sectionItems = items[section._id] || []

        for (const item of sectionItems) {
          const fields = getFieldsForSection(section.sectionName)

          for (const field of fields) {
            const key = `${section.sectionName}_${item.itemName}_${field}`
            const rawValue = incomeValues[key] || 0
            const finalValue = calculateFinalValue(section.sectionName, rawValue)
            // ذخیره مقدار اولیه و وضعیت فعال
            details[key] = {
              value: rawValue,
              isActive: (item.details?.[field]?.isActive ?? true)
            }
            
            if (section.sectionName === "خرید") {
              sectionTotals.purchaseProfit += finalValue
            } else if (section.sectionName === "همکاری") {
              sectionTotals.collaborationProfit += finalValue
            } else if (section.sectionName === "فروش") {
              sectionTotals.salesProfit += finalValue
            }
          }
        }
      }

      // محاسبه مقادیر نهایی بخش‌های بدون آیتم
      const sectionsWithoutItems = ["طراحی", "پیمانکاری", "مشاوره"]
      for (const section of sections.filter((s) => sectionsWithoutItems.includes(s.sectionName))) {
        const fields = getFieldsForSection(section.sectionName)
        const endpoint = getEndpointForSection(section.sectionName)
        
        // دریافت وضعیت فعال/غیرفعال فیلدها
        let fieldStates = {}
        try {
          const detailsResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
          const detailsData = await detailsResponse.json()
          if (detailsData.length > 0) {
            fieldStates = detailsData[0].details || {}
          }
        } catch (error) {
          console.error('Error fetching field states:', error)
        }

        for (const field of fields) {
          const key = `${section.sectionName}_${field}`
          const rawValue = incomeValues[key] || 0
          const finalValue = calculateFinalValue(section.sectionName, rawValue)
          
          // بررسی وضعیت فعال/غیرفعال فیلد
          let isActive = true
          if (fieldStates[field]) {
            isActive = fieldStates[field].isActive !== false
          }

          // ذخیره مقدار اولیه و وضعیت فعال
          details[key] = {
            value: isActive ? rawValue : 0,
            isActive
          }

          if (isActive) {
            if (section.sectionName === "طراحی") {
              sectionTotals.designProfit += finalValue
            } else if (section.sectionName === "پیمانکاری") {
              sectionTotals.contractingProfit += finalValue
            } else if (section.sectionName === "مشاوره") {
              sectionTotals.consultationProfit += finalValue
            }
          }
        }
      }

      // ذخیره اطلاعات درآمد
      const response = await fetch("/api/project-incomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project._id,
          ...sectionTotals,
          details,
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ذخیره اطلاعات درآمد")
      }

      toast({
        title: "موفق",
        description: "اطلاعات درآمد با موفقیت ذخیره شد",
      })

      if (onSave) {
        onSave()
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving income:", error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات درآمد",
        variant: "destructive",
      })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">منابع ورودی - {project.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6 pr-4">
              {/* بخش‌های دارای آیتم */}
              {sections
                .filter((section) => ["خرید", "همکاری", "فروش"].includes(section.sectionName))
                .map((section) => (
                  <Card key={section._id} className="shadow-sm border-muted/30">
                    <CardHeader className="py-4 bg-muted/5">
                      <CardTitle className="text-lg font-medium">
                        {section.sectionName} (درصد سیستم: {systemPercentages[section.sectionName as keyof typeof systemPercentages]}%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-6">
                        {(items[section._id] || []).map((item) => (
                          <div key={item._id} className="space-y-4">
                            <h4 className="font-medium text-sm bg-muted/20 p-2 rounded-md">■ {item.itemName || "(بدون نام)"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getFieldsForSection(section.sectionName)
                                .filter(field => isFieldActive(section.sectionName, item.itemName, field))
                                .map((field) => {
                                  const key = `${section.sectionName}_${item.itemName}_${field}`
                                  const value = incomeValues[key] || 0
                                  const finalValue = calculateFinalValue(section.sectionName, value)
                                  
                                  return (
                                    <div key={field} className="flex flex-col space-y-1">
                                      <div className="flex items-center bg-muted/10 rounded-lg p-2">
                                        <label className="w-1/2 text-sm text-muted-foreground">{field}:</label>
                                        <Input
                                          type="number"
                                          className="w-1/2 h-8 text-sm focus-visible:ring-1"
                                          value={value}
                                          onChange={(e) => handleValueChange(key, e.target.value)}
                                        />
                                      </div>
                                      <div className="text-xs text-blue-500 text-left pl-2">
                                        پس از کسر {systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: {finalValue.toLocaleString()} ریال
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* بخش‌های بدون آیتم */}
              {sections
                .filter((section) => ["طراحی", "پیمانکاری", "مشاوره"].includes(section.sectionName))
                .map((section) => (
                  <Card key={section._id} className="shadow-sm border-muted/30">
                    <CardHeader className="py-4 bg-muted/5">
                      <CardTitle className="text-lg font-medium">
                        {section.sectionName} (درصد سیستم: {systemPercentages[section.sectionName as keyof typeof systemPercentages]}%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getActiveFieldsForSection(section.sectionName)
                          .map((field) => {
                            const key = `${section.sectionName}_${field}`
                            const value = incomeValues[key] || 0
                            const finalValue = calculateFinalValue(section.sectionName, value)
                            return (
                              <div key={field} className="flex flex-col space-y-1">
                                <div className="flex items-center bg-muted/10 rounded-lg p-2">
                                  <label className="w-1/2 text-sm text-muted-foreground">{field}:</label>
                                  <Input
                                    type="number"
                                    className="w-1/2 h-8 text-sm focus-visible:ring-1"
                                    value={value}
                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                  />
                                </div>
                                <div className="text-xs text-blue-500 text-left pl-2">
                                  پس از کسر {systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: {finalValue.toLocaleString()} ریال
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-28">
            انصراف
          </Button>
          <Button onClick={saveIncome} className="w-28">
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
