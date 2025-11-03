"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CustomTaadolPercentages {
  خرید: number
  همکاری: number
  فروش: number
  طراحی: number
  پیمانکاری: number
  مشاوره: number
}

interface SectionWeight {
  sectionName: string
  fieldName: string
  weight: number
}

interface Project {
  _id: string
  name: string
  archiveId?: string | null
  useCustomTaadol?: boolean
  customTaadolPercentages?: CustomTaadolPercentages
  customSectionWeights?: SectionWeight[]
}

interface CustomTaadolDialogProps {
  project: Project | null
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function CustomTaadolDialog({ project, open, onClose, onUpdate }: CustomTaadolDialogProps) {
  const [percentages, setPercentages] = useState<CustomTaadolPercentages>({
    خرید: 0,
    همکاری: 0,
    فروش: 0,
    طراحی: 0,
    پیمانکاری: 0,
    مشاوره: 0
  })
  
  const [sectionWeights, setSectionWeights] = useState<Record<string, Record<string, number>>>({})
  const [sectionTotals, setSectionTotals] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [systemPercentages, setSystemPercentages] = useState<CustomTaadolPercentages>({
    خرید: 0,
    همکاری: 0,
    فروش: 0,
    طراحی: 0,
    پیمانکاری: 0,
    مشاوره: 0
  })
  const [systemWeights, setSystemWeights] = useState<Record<string, Record<string, number>>>({})
  const { toast } = useToast()

  // بارگذاری درصدهای سیستم و وزن‌های سیستم
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        // دریافت درصدهای سیستم
        const percentagesResponse = await fetch("/api/system-percentages")
        const systemPercentagesData = await percentagesResponse.json()
        if (!systemPercentagesData.error) {
          setSystemPercentages(systemPercentagesData)
        }

        // دریافت وزن‌های سیستم
        const weightsResponse = await fetch("/api/section-weights")
        const weightsData = await weightsResponse.json()
        if (weightsData && !weightsData.error) {
          const weightsMap: Record<string, Record<string, number>> = {}
          weightsData.forEach((weight: any) => {
            if (!weightsMap[weight.sectionName]) {
              weightsMap[weight.sectionName] = {}
            }
            weightsMap[weight.sectionName][weight.fieldName] = weight.weight
          })
          setSystemWeights(weightsMap)
        }
      } catch (error) {
        console.error('Error fetching system data:', error)
      }
    }

    if (open) {
      fetchSystemData()
    }
  }, [open])

  useEffect(() => {
    if (project && Object.keys(systemPercentages).length > 0 && systemPercentages.خرید !== undefined) {
      // بارگذاری درصدها
      const hasCustomPercentages = project.customTaadolPercentages && 
        Object.values(project.customTaadolPercentages).some(val => val > 0)
      
      if (hasCustomPercentages) {
        setPercentages({
          خرید: project.customTaadolPercentages!.خرید || 0,
          همکاری: project.customTaadolPercentages!.همکاری || 0,
          فروش: project.customTaadolPercentages!.فروش || 0,
          طراحی: project.customTaadolPercentages!.طراحی || 0,
          پیمانکاری: project.customTaadolPercentages!.پیمانکاری || 0,
          مشاوره: project.customTaadolPercentages!.مشاوره || 0
        })
      } else {
        // اگر مقادیر اختصاصی وجود ندارد یا همه صفر هستند، از مقادیر سیستم استفاده کن
        setPercentages({
          خرید: systemPercentages.خرید || 0,
          همکاری: systemPercentages.همکاری || 0,
          فروش: systemPercentages.فروش || 0,
          طراحی: systemPercentages.طراحی || 0,
          پیمانکاری: systemPercentages.پیمانکاری || 0,
          مشاوره: systemPercentages.مشاوره || 0
        })
      }

      // بارگذاری وزن‌ها
      const weightsMap: Record<string, Record<string, number>> = {}
      const totalsMap: Record<string, number> = {}

      const hasCustomWeights = project.customSectionWeights && 
        project.customSectionWeights.length > 0 &&
        project.customSectionWeights.some(w => w.weight > 0)

      if (hasCustomWeights) {
        project.customSectionWeights!.forEach((weight) => {
          if (!weightsMap[weight.sectionName]) {
            weightsMap[weight.sectionName] = {}
            totalsMap[weight.sectionName] = 0
          }
          weightsMap[weight.sectionName][weight.fieldName] = weight.weight
          totalsMap[weight.sectionName] += weight.weight
        })
      } else if (Object.keys(systemWeights).length > 0) {
        // اگر وزن‌های اختصاصی وجود ندارد یا همه صفر هستند، از وزن‌های سیستم استفاده کن
        Object.keys(systemWeights).forEach((sectionName) => {
          weightsMap[sectionName] = { ...systemWeights[sectionName] }
          totalsMap[sectionName] = Object.values(systemWeights[sectionName]).reduce((sum, weight) => sum + weight, 0)
        })
      }

      setSectionWeights(weightsMap)
      setSectionTotals(totalsMap)
    }
  }, [project, systemPercentages, systemWeights])

  const handlePercentageChange = (key: keyof CustomTaadolPercentages, value: number) => {
    setPercentages(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleWeightChange = (sectionName: string, fieldName: string, value: number) => {
    const newWeights = { ...sectionWeights }
    
    if (!newWeights[sectionName]) {
      newWeights[sectionName] = {}
    }

    const oldValue = newWeights[sectionName][fieldName] || 0
    newWeights[sectionName][fieldName] = value

    // محاسبه مجموع وزن‌های هر بخش
    const newTotal = Object.values(newWeights[sectionName]).reduce((sum, weight) => sum + weight, 0)

    // بررسی مجموع وزن‌ها
    if (newTotal > 100) {
      // برگرداندن به مقدار قبلی
      newWeights[sectionName][fieldName] = oldValue
      toast({
        title: "خطا",
        description: `مجموع وزن‌های بخش ${sectionName} نمی‌تواند بیشتر از 100 باشد`,
        variant: "destructive",
      })
      return
    }

    setSectionWeights(newWeights)

    // بروزرسانی مجموع‌ها
    const newTotals = { ...sectionTotals, [sectionName]: newTotal }
    setSectionTotals(newTotals)
  }

  const calculateSystemShare = (sectionName: string, fieldWeight: number) => {
    const sectionTotal = sectionTotals[sectionName] || 0
    if (sectionTotal === 0) return 0

    // محاسبه سهم از کل درصد سیستم
    const fieldShare = (fieldWeight / sectionTotal) * (percentages[sectionName as keyof CustomTaadolPercentages] || 0)
    return Number(fieldShare.toFixed(1))
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

  const handleSave = async () => {
    if (!project) return

    try {
      setSaving(true)

      // تبدیل وزن‌ها به آرایه
      const weights: SectionWeight[] = []
      Object.entries(sectionWeights).forEach(([sectionName, fields]) => {
        Object.entries(fields).forEach(([fieldName, weight]) => {
          weights.push({
            sectionName,
            fieldName,
            weight,
          })
        })
      })

      const payload = {
        customTaadolPercentages: percentages,
        customSectionWeights: weights
      }

      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "خطا در ذخیره تنظیمات")
      }

      await response.json()

      toast({
        title: "موفق",
        description: "سیستم تعادل مخصوص پروژه ذخیره شد",
      })

      onUpdate()
      onClose()
    } catch (error) {
      console.error("Error saving custom taadol:", error)
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطا در ذخیره تنظیمات",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const sections = ["خرید", "همکاری", "فروش", "طراحی", "پیمانکاری", "مشاوره"] as const

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            سیستم تعادل مخصوص پروژه: {project?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="percentages" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="percentages">درصد بخش‌ها</TabsTrigger>
            <TabsTrigger value="weights">وزن‌دهی فیلدها</TabsTrigger>
          </TabsList>

          <TabsContent value="percentages" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6 py-4 px-4">
                {sections.map((section) => (
                  <div key={section} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{section}</span>
                      <span className="text-lg font-bold">{percentages[section] || 0}%</span>
                    </div>
                    <Slider
                      dir="ltr"
                      min={0}
                      max={100}
                      step={1}
                      value={[percentages[section] || 0]}
                      className="flex-1"
                      onValueChange={(values) => handlePercentageChange(section, values[0])}
                    />
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="weights" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-8 py-4 px-4">
                {sections.map((sectionName) => (
                  <div key={sectionName} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">{sectionName}</h3>
                      <span className="text-sm font-medium">مجموع: {sectionTotals[sectionName] || 0}%</span>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      {getFieldsForSection(sectionName).map((fieldName) => {
                        const fieldWeight = sectionWeights[sectionName]?.[fieldName] || 0
                        const systemShare = calculateSystemShare(sectionName, fieldWeight)
                        
                        return (
                          <div key={`${sectionName}-${fieldName}`} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <label className="text-sm">{fieldName}</label>
                                <div className="text-xs text-muted-foreground">
                                  سهم از سیستم: {systemShare}%
                                </div>
                              </div>
                              <span className="text-sm font-medium">{fieldWeight}%</span>
                            </div>
                            <Slider
                              dir="ltr"
                              value={[fieldWeight]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(values) => handleWeightChange(sectionName, fieldName, values[0])}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            لغو
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
