"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Project {
  _id: string
  name: string
  hasIncome?: boolean
}

interface ProjectSection {
  _id: string;
  projectId: string;
  sectionName: string;
  isActive?: boolean;
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
  const [calculationType, setCalculationType] = useState<Record<string, 'variable' | 'fixed'>>({})
  const [fixedValues, setFixedValues] = useState<Record<string, number>>({})
  const [inputValues, setInputValues] = useState<Record<string, string>>({}) // برای نگهداری value خام هنگام تایپ
  const [fixedInputValues, setFixedInputValues] = useState<Record<string, string>>({}) // برای مقادیر ثابت
  const { toast } = useToast()

  // تابع فرمت‌دهی اعداد با کاما (دستی)
  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    // تبدیل عدد به رشته و جدا کردن سه‌رقم‌ها با کاما
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // تابع حذف کاما و تبدیل به عدد
  const parseNumber = (str: string) => {
    if (!str || str.trim() === '') return 0
    // حذف کاما و کاراکترهای غیر عددی
    const cleanStr = str.replace(/[^\d.]/g, '')
    const result = parseFloat(cleanStr)
    return isNaN(result) ? 0 : result
  }

  const [systemPercentages, setSystemPercentages] = useState({
    خرید: 0,
    همکاری: 0,
    فروش: 0,
    طراحی: 0,
    پیمانکاری: 0,
    مشاوره: 0
  })

  const [sectionWeights, setSectionWeights] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    if (open) {
      fetchData()
      fetchSectionWeights()
    } else {
      // هنگام بسته شدن دیالوگ، فقط state های موقت ورودی را پاک کن
      // مقادیر اصلی (fixedValues) را پاک نکن تا هنگام باز شدن مجدد، نمایش داده شوند
      setInputValues({})
      setFixedInputValues({})
    }
  }, [open, project._id])

  // دریافت درصد تعادل (وزن) فیلدها
  const fetchSectionWeights = async () => {
    try {
      const response = await fetch("/api/section-weights")
      const weightsData = await response.json()
      console.log("Raw weights data:", weightsData)
      
      if (weightsData && !weightsData.error) {
        // تبدیل آرایه به ساختار مورد نیاز
        const weightsMap: Record<string, Record<string, number>> = {}
        
        weightsData.forEach((weight: any) => {
          if (!weightsMap[weight.sectionName]) {
            weightsMap[weight.sectionName] = {}
          }
          weightsMap[weight.sectionName][weight.fieldName] = weight.weight
        })
        
        console.log("Processed weights map:", weightsMap)
        setSectionWeights(weightsMap)
      }
    } catch (error) {
      console.error('Error fetching section weights:', error)
    }
  }

  // دریافت درصد تعادل یک فیلد خاص
  const getFieldWeight = (sectionName: string, fieldName: string) => {
    const weight = sectionWeights[sectionName]?.[fieldName]
    
    // اگر وزن تعریف نشده یا صفر است، مقدار پیش‌فرض 10 درصد را برگردان
    if (weight === undefined || weight === 0) {
      console.warn(`Weight not found for ${sectionName} -> ${fieldName}, using default 10%`)
      return 10
    }
    
    return weight
  }

  // تابع کمکی برای بررسی اینکه آیا فیلد فعال است
  const isFieldActive = (sectionName: string, itemName: string | undefined, field: string) => {
    if (itemName) {
      const sectionItems = items[sections.find((s: ProjectSection) => s.sectionName === sectionName)?._id || ""] || [];
      const item = sectionItems.find((i: SectionItem) => i.itemName === itemName)
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
      
      console.log("Fetched income data:", incomeData)
      
      if (incomeData) {
        const values: Record<string, number> = {}
        if (incomeData.details) {
          Object.entries(incomeData.details).forEach(([key, detail]) => {
            if (typeof detail === "object" && detail !== null && "value" in detail && typeof detail.value === "number") {
              values[key] = detail.value
            }
          })
        }
        setIncomeValues(values)

        // بازیابی نوع محاسبه (ثابت/متغیر)
        if (incomeData.calculationType) {
          console.log("Retrieved calculationType:", incomeData.calculationType)
          setCalculationType(incomeData.calculationType)
        }

        // بازیابی مقادیر ثابت
        if (incomeData.fixedValues) {
          console.log("Retrieved fixedValues:", incomeData.fixedValues)
          setFixedValues(incomeData.fixedValues)
          
          // آماده‌سازی fixedInputValues برای نمایش مقادیر ثابت در فیلدهای input
          const formattedFixedInputs: Record<string, string> = {}
          Object.entries(incomeData.fixedValues).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              formattedFixedInputs[key] = formatNumber(value)
            }
          })
          console.log("Formatted fixedInputValues:", formattedFixedInputs)
          setFixedInputValues(formattedFixedInputs)
        }
        
        // تمیزسازی state های موقت برای نمایش درست (فقط inputValues)
        setInputValues({})
      } else {
        // اگر هیچ داده‌ای وجود نداشت، state ها را خالی کن
        setIncomeValues({})
        setCalculationType({})
        setFixedValues({})
        setInputValues({})
        setFixedInputValues({})
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
  const activeSections = sections.filter((section: ProjectSection) => section.isActive !== false)

  const calculateFinalValue = (sectionName: string, value: number, isFromFixedCalculation: boolean = false) => {
    // اگر مقدار از محاسبه ثابت آمده، دیگه درصد سیستم کم نکن
    if (isFromFixedCalculation) {
      return value
    }
    
    const percentage = systemPercentages[sectionName as keyof typeof systemPercentages] || 0
    return Math.round(value * (1 - percentage / 100))
  }

  const handleValueChange = (key: string, value: string) => {
    // پاک کردن کاما و حروف غیر عددی
    const numericOnly = value.replace(/[^\d]/g, '')
    
    // تبدیل به عدد
    const numericValue = numericOnly === '' ? 0 : parseFloat(numericOnly)
    
    // فرمت کردن با کاما برای نمایش (دستی)
    const formattedValue = numericValue === 0 ? '' : formatNumber(numericValue)
    
    // ذخیره مقدار فرمت شده برای نمایش
    setInputValues({
      ...inputValues,
      [key]: formattedValue,
    })
    
    // ذخیره مقدار عددی خالص
    setIncomeValues({
      ...incomeValues,
      [key]: numericValue,
    })
  }

  const handleValueBlur = (key: string) => {
    // هنگام از دست دادن focus، مقدار نهایی فرمت شده را نگه دار
    const currentValue = incomeValues[key] || 0
    if (currentValue > 0) {
      setInputValues({
        ...inputValues,
        [key]: formatNumber(currentValue)
      })
    } else {
      // اگر مقدار صفر است، فیلد را خالی کن
      const newInputValues = { ...inputValues }
      delete newInputValues[key]
      setInputValues(newInputValues)
    }
  }

  const handleCalculationTypeChange = (sectionName: string, type: 'variable' | 'fixed') => {
    console.log(`Changing calculation type for ${sectionName} to ${type}`)
    
    setCalculationType(prev => {
      const newType = {
        ...prev,
        [sectionName]: type
      }
      console.log("New calculationType state:", newType)
      return newType
    })
    
    // اگر به متغیر تغییر کرد، مقدار ثابت را پاک کن
    if (type === 'variable') {
      setFixedValues(prev => {
        const newValues = { ...prev }
        delete newValues[sectionName]
        console.log("Cleared fixedValues for variable type:", newValues)
        return newValues
      })
      
      // همچنین fixedInputValues را نیز پاک کن
      setFixedInputValues(prev => {
        const newValues = { ...prev }
        delete newValues[sectionName]
        return newValues
      })
    }
  }

  const handleFixedValueChange = (sectionName: string, value: string) => {
    console.log(`Changing fixed value for ${sectionName} to ${value}`)
    
    // پاک کردن کاما و حروف غیر عددی
    const numericOnly = value.replace(/[^\d]/g, '')
    
    // تبدیل به عدد
    const numericValue = numericOnly === '' ? 0 : parseFloat(numericOnly)
    
    console.log(`Parsed numeric value: ${numericValue}`)
    
    // فرمت کردن با کاما برای نمایش (دستی)
    const formattedValue = numericValue === 0 ? '' : formatNumber(numericValue)
    
    // ذخیره مقدار فرمت شده برای نمایش
    setFixedInputValues({
      ...fixedInputValues,
      [sectionName]: formattedValue,
    })
    
    // ذخیره مقدار عددی خالص
    setFixedValues(prev => {
      const newValues = {
        ...prev,
        [sectionName]: numericValue
      }
      console.log("Updated fixedValues:", newValues)
      return newValues
    })

    // پر کردن خودکار همه فیلدهای فعال همان لحظه
    if (numericValue > 0) {
      const systemPercentage = systemPercentages[sectionName as keyof typeof systemPercentages] || 0
      const finalFixedValue = Math.round(numericValue * (1 - systemPercentage / 100))
      
      console.log(`Auto-filling fields for ${sectionName} with finalValue: ${finalFixedValue}`)
      
      // پیدا کردن بخش مربوطه
      const section = sections.find(s => s.sectionName === sectionName)
      if (!section) return
      
      const newIncomeValues = { ...incomeValues }
      
      // برای بخش‌های دارای آیتم
      if (["خرید", "همکاری", "فروش"].includes(sectionName)) {
        const sectionItems = items[section._id] || []
        const activeItems = sectionItems.filter(item => 
          getFieldsForSection(sectionName).some(field => 
            item.details?.[field]?.isActive !== false
          )
        )
        
        if (activeItems.length > 0) {
          for (const item of activeItems) {
            const fields = getFieldsForSection(sectionName)
            for (const field of fields) {
              const key = `${sectionName}_${item.itemName}_${field}`
              const isFieldActiveValue = item.details?.[field]?.isActive !== false
              
              if (isFieldActiveValue) {
                newIncomeValues[key] = finalFixedValue
                console.log(`Auto-set field ${key} to:`, finalFixedValue)
              }
            }
          }
        }
      }
      // برای بخش‌های بدون آیتم
      else if (["طراحی", "پیمانکاری", "مشاوره"].includes(sectionName)) {
        const fields = getFieldsForSection(sectionName)
        const activeFields = fields.filter(field => 
          isFieldActive(sectionName, undefined, field)
        )
        
        for (const field of activeFields) {
          const key = `${sectionName}_${field}`
          newIncomeValues[key] = finalFixedValue
          console.log(`Auto-set field ${key} to:`, finalFixedValue)
        }
      }
      
      // به‌روزرسانی state
      setIncomeValues(newIncomeValues)
    } else {
      // اگر مقدار صفر شد، فیلدها را صفر کن
      const section = sections.find(s => s.sectionName === sectionName)
      if (!section) return
      
      const newIncomeValues = { ...incomeValues }
      
      // برای بخش‌های دارای آیتم
      if (["خرید", "همکاری", "فروش"].includes(sectionName)) {
        const sectionItems = items[section._id] || []
        for (const item of sectionItems) {
          const fields = getFieldsForSection(sectionName)
          for (const field of fields) {
            const key = `${sectionName}_${item.itemName}_${field}`
            newIncomeValues[key] = 0
          }
        }
      }
      // برای بخش‌های بدون آیتم
      else if (["طراحی", "پیمانکاری", "مشاوره"].includes(sectionName)) {
        const fields = getFieldsForSection(sectionName)
        for (const field of fields) {
          const key = `${sectionName}_${field}`
          newIncomeValues[key] = 0
        }
      }
      
      setIncomeValues(newIncomeValues)
    }
  }

  const handleFixedValueBlur = (sectionName: string) => {
    // هنگام از دست دادن focus، مقدار را format کن
    const currentValue = fixedValues[sectionName] || 0
    if (currentValue > 0) {
      // تنظیم مقدار format شده در input برای نمایش بهتر
      setFixedInputValues(prev => ({
        ...prev,
        [sectionName]: formatNumber(currentValue)
      }))
    }
    
    // برای حالت ثابت، فیلدها فقط برای نمایش هستند و مقدار ثابت مستقیماً به عنوان درآمد بخش محاسبه می‌شود
    // پس نیازی به تغییر incomeValues نیست
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

      // مقادیر خام (قبل از کسر درصد سیستم)
      const rawSectionTotals = {
        rawPurchaseProfit: 0,
        rawDesignProfit: 0,
        rawCollaborationProfit: 0,
        rawContractingProfit: 0,
        rawSalesProfit: 0,
        rawConsultationProfit: 0,
      }

      const details: Record<string, { value: number; isActive: boolean }> = {}

      // محاسبه مقادیر ثابت
      const fixedSections: Record<string, number> = {}
      sections.forEach(section => {
        if (calculationType[section.sectionName] === 'fixed') {
          fixedSections[section.sectionName] = fixedValues[section.sectionName] || 0
        }
      })

      // محاسبه مقادیر نهایی بخش‌های دارای آیتم
      const sectionsWithItems = ["خرید", "همکاری", "فروش"]
      for (const section of sections.filter((s) => sectionsWithItems.includes(s.sectionName))) {
        const sectionItems = items[section._id] || []

        // ذخیره همه فیلدها بدون توجه به نوع محاسبه
        for (const item of sectionItems) {
          const fields = getFieldsForSection(section.sectionName)

          for (const field of fields) {
            const key = `${section.sectionName}_${item.itemName}_${field}`
            const rawValue = incomeValues[key] || 0
            const isFieldActiveValue = item.details?.[field]?.isActive ?? true
            
            // ذخیره مقدار (حتی اگر صفر باشد)
            details[key] = {
              value: rawValue,
              isActive: isFieldActiveValue
            }
          }
        }

        // محاسبه درآمد بخش بر اساس نوع محاسبه
        if (calculationType[section.sectionName] === 'fixed') {
          // در حالت ثابت: مقدار ثابت به عنوان مقدار خام
          const fixedAmount = fixedValues[section.sectionName] || 0
          const systemPercentage = systemPercentages[section.sectionName as keyof typeof systemPercentages] || 0
          const finalFixedValue = fixedAmount * (1 - systemPercentage / 100)
          
          console.log(`Fixed calculation for ${section.sectionName}:`, {
            fixedAmount,
            systemPercentage,
            finalFixedValue
          })
          
          // قرار دادن مقدار نهایی در همه فیلدهای فعال (بدون تقسیم)
          const activeItems = sectionItems.filter(item => 
            getFieldsForSection(section.sectionName).some(field => 
              item.details?.[field]?.isActive !== false
            )
          )
          
          if (activeItems.length > 0) {
            console.log(`Setting finalFixedValue (${finalFixedValue}) in all active fields for ${section.sectionName}`)
            
            // قرار دادن مقدار نهایی در همه فیلدهای فعال
            for (const item of activeItems) {
              const fields = getFieldsForSection(section.sectionName)
              for (const field of fields) {
                const key = `${section.sectionName}_${item.itemName}_${field}`
                const isFieldActiveValue = item.details?.[field]?.isActive !== false
                
                if (isFieldActiveValue) {
                  // قرار دادن مقدار نهایی (بدون تقسیم) در فیلد فعال
                  details[key] = {
                    value: Math.round(finalFixedValue),
                    isActive: isFieldActiveValue
                  }
                  console.log(`Set field ${key} to full value:`, Math.round(finalFixedValue))
                }
              }
            }
          }
          
          if (section.sectionName === "خرید") {
            rawSectionTotals.rawPurchaseProfit = fixedAmount // مقدار خام
            sectionTotals.purchaseProfit = finalFixedValue // مقدار نهایی
          } else if (section.sectionName === "همکاری") {
            rawSectionTotals.rawCollaborationProfit = fixedAmount
            sectionTotals.collaborationProfit = finalFixedValue
          } else if (section.sectionName === "فروش") {
            rawSectionTotals.rawSalesProfit = fixedAmount
            sectionTotals.salesProfit = finalFixedValue
          }
        } else {
          // در حالت متغیر: مجموع فیلدهای فعال
          let sectionRawTotal = 0
          let sectionFinalTotal = 0
          
          for (const item of sectionItems) {
            const fields = getFieldsForSection(section.sectionName)
            for (const field of fields) {
              const key = `${section.sectionName}_${item.itemName}_${field}`
              const rawValue = incomeValues[key] || 0
              const isFieldActiveValue = item.details?.[field]?.isActive ?? true
              
              if (isFieldActiveValue) {
                sectionRawTotal += rawValue // مقدار خام
                const finalValue = calculateFinalValue(section.sectionName, rawValue)
                sectionFinalTotal += finalValue // مقدار نهایی
              }
            }
          }
          
          if (section.sectionName === "خرید") {
            rawSectionTotals.rawPurchaseProfit = sectionRawTotal
            sectionTotals.purchaseProfit = sectionFinalTotal
          } else if (section.sectionName === "همکاری") {
            rawSectionTotals.rawCollaborationProfit = sectionRawTotal
            sectionTotals.collaborationProfit = sectionFinalTotal
          } else if (section.sectionName === "فروش") {
            rawSectionTotals.rawSalesProfit = sectionRawTotal
            sectionTotals.salesProfit = sectionFinalTotal
          }
        }
      }

      // محاسبه مقادیر نهایی بخش‌های بدون آیتم
      const sectionsWithoutItems = ["طراحی", "پیمانکاری", "مشاوره"]
      for (const section of sections.filter((s) => sectionsWithoutItems.includes(s.sectionName))) {
        const fields = getFieldsForSection(section.sectionName)
        const endpoint = getEndpointForSection(section.sectionName)
        
        // دریافت وضعیت فعال/غیرفعال فیلدها
        let fieldStates: Record<string, { isActive: boolean }> = {}
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
          
          // بررسی وضعیت فعال/غیرفعال فیلد
          let isActive = true
          if (fieldStates[field]) {
            isActive = fieldStates[field].isActive !== false
          }

          // ذخیره همه مقادیر (حتی صفر) با وضعیت فعال/غیرفعال
          details[key] = {
            value: rawValue,
            isActive
          }
        }

        // محاسبه درآمد بخش بر اساس نوع محاسبه
        if (calculationType[section.sectionName] === 'fixed') {
          // در حالت ثابت: مقدار ثابت به عنوان مقدار خام
          const fixedAmount = fixedValues[section.sectionName] || 0
          const systemPercentage = systemPercentages[section.sectionName as keyof typeof systemPercentages] || 0
          const finalFixedValue = fixedAmount * (1 - systemPercentage / 100)
          
          // تقسیم مقدار نهایی بین فیلدهای فعال برای محاسبه پورسانت
          const activeFieldsForSection = fields.filter(field => {
            let isActive = true
            if (fieldStates[field]) {
              isActive = fieldStates[field].isActive !== false
            }
            return isActive
          })
          
          if (activeFieldsForSection.length > 0) {
            console.log(`Setting finalFixedValue (${finalFixedValue}) in all active fields for ${section.sectionName}`)
            
            // قرار دادن مقدار نهایی در همه فیلدهای فعال (بدون تقسیم)
            for (const field of activeFieldsForSection) {
              const key = `${section.sectionName}_${field}`
              
              // قرار دادن مقدار کامل در هر فیلد فعال
              details[key] = {
                value: Math.round(finalFixedValue),
                isActive: true
              }
              console.log(`Set field ${key} to full value:`, Math.round(finalFixedValue))
            }
          }
          
          if (section.sectionName === "طراحی") {
            rawSectionTotals.rawDesignProfit = fixedAmount // مقدار خام
            sectionTotals.designProfit = finalFixedValue // مقدار نهایی
          } else if (section.sectionName === "پیمانکاری") {
            rawSectionTotals.rawContractingProfit = fixedAmount
            sectionTotals.contractingProfit = finalFixedValue
          } else if (section.sectionName === "مشاوره") {
            rawSectionTotals.rawConsultationProfit = fixedAmount
            sectionTotals.consultationProfit = finalFixedValue
          }
        } else {
          // در حالت متغیر: مجموع فیلدهای فعال
          let sectionRawTotal = 0
          let sectionFinalTotal = 0
          
          for (const field of fields) {
            const key = `${section.sectionName}_${field}`
            const rawValue = incomeValues[key] || 0
            
            // بررسی وضعیت فعال/غیرفعال فیلد
            let isActive = true
            if (fieldStates[field]) {
              isActive = fieldStates[field].isActive !== false
            }

            if (isActive && rawValue > 0) {
              sectionRawTotal += rawValue // مقدار خام
              const finalValue = calculateFinalValue(section.sectionName, rawValue)
              sectionFinalTotal += finalValue // مقدار نهایی
            }
          }
          
          if (section.sectionName === "طراحی") {
            rawSectionTotals.rawDesignProfit = sectionRawTotal
            sectionTotals.designProfit = sectionFinalTotal
          } else if (section.sectionName === "پیمانکاری") {
            rawSectionTotals.rawContractingProfit = sectionRawTotal
            sectionTotals.contractingProfit = sectionFinalTotal
          } else if (section.sectionName === "مشاوره") {
            rawSectionTotals.rawConsultationProfit = sectionRawTotal
            sectionTotals.consultationProfit = sectionFinalTotal
          }
        }
      }

      // دریافت archiveId فعال
      const stored = localStorage.getItem("activeArchive")
      let archiveId = ""
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          archiveId = parsed._id
          console.log("Found archiveId:", archiveId)
        } catch (e) {
          console.error("Error parsing activeArchive:", e)
        }
      } else {
        console.warn("No activeArchive found in localStorage")
      }
      // ذخیره اطلاعات درآمد
      console.log("Sending calculationType:", calculationType)
      console.log("calculationType type:", typeof calculationType, "empty?", Object.keys(calculationType).length === 0)
      console.log("Sending fixedValues:", fixedValues)
      console.log("fixedValues type:", typeof fixedValues, "empty?", Object.keys(fixedValues).length === 0)
      console.log("Sending sectionTotals:", sectionTotals)
      console.log("Sending rawSectionTotals:", rawSectionTotals)
      
      const requestBody = {
        projectId: project._id,
        archiveId,
        ...sectionTotals,
        ...rawSectionTotals, // افزودن مقادیر خام
        details: {
          ...details,
          // ذخیره مقادیر خام در details برای اطمینان
          _rawTotals: rawSectionTotals
        },
        calculationType: calculationType, // ذخیره نوع محاسبه (ثابت/متغیر)
        fixedValues: fixedValues, // ذخیره مقادیر ثابت
      }
      
      console.log("Full request body:", requestBody)
      
      const response = await fetch("/api/project-incomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium">
                          {section.sectionName} (درصد سیستم: {systemPercentages[section.sectionName as keyof typeof systemPercentages]}%)
                        </CardTitle>
                        
                        <div className="flex items-center gap-4">
                          <RadioGroup
                            value={calculationType[section.sectionName] || 'variable'}
                            onValueChange={(value: 'variable' | 'fixed') => handleCalculationTypeChange(section.sectionName, value)}
                            className="flex items-center gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="variable" id={`variable-${section._id}`} />
                              <Label htmlFor={`variable-${section._id}`} className="text-sm">مقدار متغیر</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fixed" id={`fixed-${section._id}`} />
                              <Label htmlFor={`fixed-${section._id}`} className="text-sm">مقدار ثابت</Label>
                            </div>
                          </RadioGroup>
                          
                          {calculationType[section.sectionName] === 'fixed' && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">مقدار ثابت:</Label>
                              <Input
                                type="text"
                                className="w-32 h-8 text-sm"
                                value={fixedInputValues[section.sectionName] !== undefined ? fixedInputValues[section.sectionName] : formatNumber(fixedValues[section.sectionName] || 0)}
                                onChange={(e) => handleFixedValueChange(section.sectionName, e.target.value)}
                                onBlur={() => handleFixedValueBlur(section.sectionName)}
                                placeholder="مقدار ثابت"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-6">
                        {calculationType[section.sectionName] === 'fixed' && (
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium mb-2">
                              💡 مقدار ثابت: {formatNumber(fixedValues[section.sectionName] || 0)} ریال
                            </p>
                            <p className="text-sm text-gray-600">
                              پس از کسر {systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: <span className="font-bold text-green-600">
                                {formatNumber(Math.round((fixedValues[section.sectionName] || 0) * (1 - (systemPercentages[section.sectionName as keyof typeof systemPercentages] || 0) / 100)))} ریال
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              این مقدار به طور خودکار در همه فیلدهای فعال قرار داده شده است
                            </p>
                          </div>
                        )}
                        {(items[section._id] || []).map((item) => (
                          <div key={item._id} className="space-y-4">
                            <h4 className="font-medium text-sm bg-muted/20 p-2 rounded-md">■ {item.itemName || "(بدون نام)"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getFieldsForSection(section.sectionName)
                                .filter(field => isFieldActive(section.sectionName, item.itemName, field))
                                .map((field) => {
                                  const key = `${section.sectionName}_${item.itemName}_${field}`
                                  const value = incomeValues[key] || 0
                                  const finalValue = calculationType[section.sectionName] === 'fixed' 
                                    ? value 
                                    : calculateFinalValue(section.sectionName, value)
                                  
                                  return (
                                    <div key={field} className="flex flex-col space-y-1">
                                      <div className="flex items-center bg-muted/10 rounded-lg p-2">
                                        <label className="w-1/2 text-sm text-muted-foreground">{field}:</label>
                                        <Input
                                          type="text"
                                          className={`w-1/2 h-8 text-sm focus-visible:ring-1 ${
                                            calculationType[section.sectionName] === 'fixed' 
                                              ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium' 
                                              : ''
                                          }`}
                                          value={inputValues[key] !== undefined ? inputValues[key] : formatNumber(value)}
                                          onChange={(e) => handleValueChange(key, e.target.value)}
                                          onBlur={() => handleValueBlur(key)}
                                          placeholder={calculationType[section.sectionName] === 'fixed' ? 'خودکار' : '0'}
                                          readOnly={calculationType[section.sectionName] === 'fixed'}
                                        />
                                      </div>
                                      <div className="text-xs text-blue-500 text-left pl-2">
                                        {calculationType[section.sectionName] === 'fixed' 
                                          ? (
                                            <div>
                                              <div>مقدار: {formatNumber(finalValue)} ریال</div>
                                              <div className="text-green-600 font-medium">
                                                درصد پورسانت ({getFieldWeight(section.sectionName, field)}%): {formatNumber(Math.round(finalValue * getFieldWeight(section.sectionName, field) / 100))} ریال
                                              </div>
                                            </div>
                                          )
                                          : `پس از کسر ${systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: ${formatNumber(finalValue)} ریال`
                                        }
                                      </div>
                                    </div>                              )
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
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-medium">
                          {section.sectionName} (درصد سیستم: {systemPercentages[section.sectionName as keyof typeof systemPercentages]}%)
                        </CardTitle>
                        
                        <div className="flex items-center gap-4">
                          <RadioGroup
                            value={calculationType[section.sectionName] || 'variable'}
                            onValueChange={(value: 'variable' | 'fixed') => handleCalculationTypeChange(section.sectionName, value)}
                            className="flex items-center gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="variable" id={`variable-${section._id}`} />
                              <Label htmlFor={`variable-${section._id}`} className="text-sm">مقدار متغیر</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fixed" id={`fixed-${section._id}`} />
                              <Label htmlFor={`fixed-${section._id}`} className="text-sm">مقدار ثابت</Label>
                            </div>
                          </RadioGroup>
                          
                          {calculationType[section.sectionName] === 'fixed' && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">مقدار ثابت:</Label>
                              <Input
                                type="text"
                                className="w-32 h-8 text-sm"
                                value={fixedInputValues[section.sectionName] !== undefined ? fixedInputValues[section.sectionName] : formatNumber(fixedValues[section.sectionName] || 0)}
                                onChange={(e) => handleFixedValueChange(section.sectionName, e.target.value)}
                                onBlur={() => handleFixedValueBlur(section.sectionName)}
                                placeholder="مقدار ثابت"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {calculationType[section.sectionName] === 'fixed' && (
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium mb-2">
                              💡 مقدار ثابت: {formatNumber(fixedValues[section.sectionName] || 0)} ریال
                            </p>
                            <p className="text-sm text-gray-600">
                              پس از کسر {systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: <span className="font-bold text-green-600">
                                {formatNumber(Math.round((fixedValues[section.sectionName] || 0) * (1 - (systemPercentages[section.sectionName as keyof typeof systemPercentages] || 0) / 100)))} ریال
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              این مقدار به طور خودکار در همه فیلدهای فعال قرار داده شده است
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getActiveFieldsForSection(section.sectionName)
                          .map((field) => {
                            const key = `${section.sectionName}_${field}`
                            const value = incomeValues[key] || 0
                            const finalValue = calculationType[section.sectionName] === 'fixed' 
                              ? value 
                              : calculateFinalValue(section.sectionName, value)
                            return (
                              <div key={field} className="flex flex-col space-y-1">
                                <div className="flex items-center bg-muted/10 rounded-lg p-2">
                                  <label className="w-1/2 text-sm text-muted-foreground">{field}:</label>
                                  <Input
                                    type="text"
                                    className={`w-1/2 h-8 text-sm focus-visible:ring-1 ${
                                      calculationType[section.sectionName] === 'fixed' 
                                        ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium' 
                                        : ''
                                    }`}
                                    value={inputValues[key] !== undefined ? inputValues[key] : formatNumber(value)}
                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                    onBlur={() => handleValueBlur(key)}
                                    placeholder={calculationType[section.sectionName] === 'fixed' ? 'خودکار' : '0'}
                                    readOnly={calculationType[section.sectionName] === 'fixed'}
                                  />
                                </div>
                                <div className="text-xs text-blue-500 text-left pl-2">
                                  {calculationType[section.sectionName] === 'fixed' 
                                    ? (
                                      <div>
                                        <div>مقدار: {formatNumber(finalValue)} ریال</div>
                                        <div className="text-green-600 font-medium">
                                          درصد پورسانت ({getFieldWeight(section.sectionName, field)}%): {formatNumber(Math.round(finalValue * getFieldWeight(section.sectionName, field) / 100))} ریال
                                        </div>
                                      </div>
                                    )
                                    : `پس از کسر ${systemPercentages[section.sectionName as keyof typeof systemPercentages]}% سیستم: ${formatNumber(finalValue)} ریال`
                                  }
                                </div>
                              </div>
                            )
                          })}
                        </div>
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
