"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SystemPercentages {
  _id?: string
  خرید: number
  همکاری: number
  فروش: number
  طراحی: number
  پیمانکاری: number
  مشاوره: number
}

interface SectionWeight {
  _id?: string
  sectionName: string
  fieldName: string
  weight: number
}

export default function TaadolTab() {
  const [percentages, setPercentages] = useState<SystemPercentages>({
    خرید: 0,
    همکاری: 0,
    فروش: 0,
    طراحی: 0,
    پیمانکاری: 0,
    مشاوره: 0
  })

  const [sectionWeights, setSectionWeights] = useState<Record<string, Record<string, number>>>({})
  const [sectionTotals, setSectionTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [savingPercentages, setSavingPercentages] = useState(false)
  const [savingWeights, setSavingWeights] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت درصدهای سیستم
      const percentagesResponse = await fetch("/api/system-percentages")
      const latestPercentages = await percentagesResponse.json()
      
      if (!latestPercentages.error) {
        setPercentages({
          خرید: latestPercentages.خرید || 0,
          همکاری: latestPercentages.همکاری || 0,
          فروش: latestPercentages.فروش || 0,
          طراحی: latestPercentages.طراحی || 0,
          پیمانکاری: latestPercentages.پیمانکاری || 0,
          مشاوره: latestPercentages.مشاوره || 0,
        })
      }

      // دریافت وزن‌های بخش‌ها
      const weightsResponse = await fetch("/api/section-weights")
      const weightsData = await weightsResponse.json()

      // تبدیل آرایه به ساختار مورد نیاز
      const weightsMap: Record<string, Record<string, number>> = {}
      const totalsMap: Record<string, number> = {}

      weightsData.forEach((weight: SectionWeight) => {
        if (!weightsMap[weight.sectionName]) {
          weightsMap[weight.sectionName] = {}
          totalsMap[weight.sectionName] = 0
        }

        weightsMap[weight.sectionName][weight.fieldName] = weight.weight
        totalsMap[weight.sectionName] += weight.weight
      })

      setSectionWeights(weightsMap)
      setSectionTotals(totalsMap)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات سیستم تعادل",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePercentageChange = (key: keyof SystemPercentages, value: number) => {
    const newPercentages = { ...percentages }
    newPercentages[key] = value
    setPercentages(newPercentages)
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
    const fieldShare = (fieldWeight / sectionTotal) * (percentages[sectionName as keyof SystemPercentages] || 0)
    return Number(fieldShare.toFixed(1))
  }

  const savePercentages = async () => {
    try {
      setSavingPercentages(true)
      // ذخیره درصدهای سیستم
      const percentagesResponse = await fetch("/api/system-percentages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(percentages),
      })

      if (!percentagesResponse.ok) {
        throw new Error('خطا در ذخیره درصدهای سیستم')
      }

      await fetchData() // بارگذاری مجدد داده‌ها بعد از ذخیره موفق

      toast({
        title: "موفق",
        description: "درصدهای سیستم با موفقیت ذخیره شد",
      })
    } catch (error) {
      console.error('Error saving percentages:', error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره درصدهای سیستم",
        variant: "destructive",
      })
    } finally {
      setSavingPercentages(false)
    }
  }

  const saveWeights = async () => {
    try {
      setSavingWeights(true)
      // ذخیره وزن‌های بخش‌ها
      const weights: { sectionName: string; fieldName: string; weight: number }[] = []

      Object.entries(sectionWeights).forEach(([sectionName, fields]) => {
        Object.entries(fields).forEach(([fieldName, weight]) => {
          weights.push({
            sectionName,
            fieldName,
            weight,
          })
        })
      })

      const weightsResponse = await fetch("/api/section-weights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weights }),
      })

      if (!weightsResponse.ok) {
        throw new Error('خطا در ذخیره وزن‌های بخش‌ها')
      }

      toast({
        title: "موفق",
        description: "وزن‌های بخش‌ها با موفقیت ذخیره شد",
      })
    } catch (error) {
      console.error('Error saving weights:', error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره وزن‌های بخش‌ها",
        variant: "destructive",
      })
    } finally {
      setSavingWeights(false)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // فقط بخش‌های فعال را نگه دار (در آینده اگر isActive اضافه شد)
  const allSections = ["خرید", "همکاری", "فروش", "طراحی", "پیمانکاری", "مشاوره"]
  // فرض: اگر پراپرتی isActive به بخش‌ها اضافه شود، اینجا فیلتر کن
  // const activeSections = allSections.filter(section => ...)
  const activeSections = allSections // فعلاً همه فعال هستند

  // تابع بازتوزیع وزن بین بخش‌های فعال
  const redistributeWeights = (weightsMap: Record<string, Record<string, number>>, deactivatedSection?: string) => {
    if (!deactivatedSection) return weightsMap
    const newWeights = { ...weightsMap }
    const removedWeights = newWeights[deactivatedSection]
    if (!removedWeights) return newWeights
    // مجموع وزن بخش غیرفعال
    const totalRemoved = Object.values(removedWeights).reduce((sum, w) => sum + w, 0)
    delete newWeights[deactivatedSection]
    // تعداد بخش‌های فعال باقی‌مانده
    const activeCount = Object.keys(newWeights).length
    if (activeCount === 0) return newWeights
    // پخش وزن حذف‌شده بین بقیه بخش‌ها
    Object.keys(newWeights).forEach(section => {
      Object.keys(newWeights[section]).forEach(field => {
        newWeights[section][field] += totalRemoved / (activeCount * Object.keys(newWeights[section]).length)
      })
    })
    return newWeights
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>درصد سیستم هر بخش</CardTitle>
          <Button 
            onClick={savePercentages} 
            disabled={savingPercentages}
            size="sm"
          >
            {savingPercentages ? "در حال ذخیره..." : "ذخیره درصدها"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {["خرید", "همکاری", "فروش", "طراحی", "پیمانکاری", "مشاوره"].map((section) => (
              <div key={section} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-lg font-medium">{section}</label>
                  <span className="text-lg font-bold">{percentages[section as keyof SystemPercentages]}%</span>
                </div>
                <Slider
                  value={[percentages[section as keyof SystemPercentages]]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handlePercentageChange(section as keyof SystemPercentages, values[0])}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>وزن‌دهی بخش‌ها</CardTitle>
          <Button 
            onClick={saveWeights} 
            disabled={savingWeights}
            size="sm"
          >
            {savingWeights ? "در حال ذخیره..." : "ذخیره وزن‌ها"}
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-8">
              {["خرید", "همکاری", "فروش", "طراحی", "پیمانکاری", "مشاوره"].map((sectionName) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
