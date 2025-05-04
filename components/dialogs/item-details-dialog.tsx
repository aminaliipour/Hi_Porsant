"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface TeamMember {
  _id: string
  fullName: string
  position: string
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
  details?: Record<string, { isActive: boolean }>
}

interface ItemDetailsDialogProps {
  section: ProjectSection
  item: SectionItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FieldDetail {
  isActive: boolean
}

export function ItemDetailsDialog({ section, item, open, onOpenChange }: ItemDetailsDialogProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string>>({})
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, item._id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت اعضای تیم
      const membersResponse = await fetch("/api/team-members")
      const membersData = await membersResponse.json()
      setMembers(membersData)

      // دریافت جزئیات آیتم
      const endpoint = getEndpointForSection(section.sectionName)
      const response = await fetch(`/api/${endpoint}/${item._id}`)

      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات آیتم")
      }

      const data = await response.json()
      setName(data.itemName || "")

      // تنظیم اعضای انتخاب شده
      if (data.assignedMembers) {
        setSelectedMembers(data.assignedMembers)
      }

      // تنظیم وضعیت فعال/غیرفعال فیلدها
      const initialActiveFields: Record<string, boolean> = {}
      if (data.details) {
        Object.entries(data.details as Record<string, FieldDetail>).forEach(([field, detail]) => {
          initialActiveFields[field] = detail.isActive !== false
        })
      } else {
        // اگر details وجود نداشت، همه فیلدها را به صورت پیش‌فرض فعال کن
        getFieldsForSection(section.sectionName).forEach(field => {
          initialActiveFields[field] = true
        })
      }
      setActiveFields(initialActiveFields)

    } catch (error) {
      console.error("خطا در دریافت اطلاعات:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات آیتم",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      default:
        return ""
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleMemberChange = (field: string, memberId: string) => {
    if (!activeFields[field]) return
    setSelectedMembers(prev => ({
      ...prev,
      [field]: memberId
    }))
  }

  const handleAllFieldsMemberChange = (memberId: string) => {
    if (!memberId) return
    const newSelectedMembers: Record<string, string> = {}
    getFieldsForSection(section.sectionName).forEach(field => {
      if (activeFields[field]) {
        newSelectedMembers[field] = memberId
      }
    })
    setSelectedMembers(newSelectedMembers)
  }

  const handleRemoveMember = (field: string) => {
    setSelectedMembers(prev => {
      const newMembers = { ...prev }
      delete newMembers[field]
      return newMembers
    })
  }

  const toggleFieldActive = (field: string) => {
    setActiveFields(prev => {
      const newState = { ...prev }
      newState[field] = !prev[field]
      
      // اگر فیلد غیرفعال شد، عضو مربوط به آن را هم حذف کن
      if (!newState[field] && selectedMembers[field]) {
        handleRemoveMember(field)
      }
      
      return newState
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "خطا",
        description: "نام آیتم نمی‌تواند خالی باشد",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const endpoint = getEndpointForSection(section.sectionName)

      // ساخت شیء details با وضعیت فعال/غیرفعال برای هر فیلد
      const details: Record<string, { isActive: boolean }> = {}
      getFieldsForSection(section.sectionName).forEach(field => {
        details[field] = {
          isActive: activeFields[field] ?? true
        }
      })

      const response = await fetch(`/api/${endpoint}/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName: name,
          assignedMembers: selectedMembers,
          details
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ذخیره تغییرات")
      }

      toast({
        title: "موفق",
        description: "تغییرات با موفقیت ذخیره شد",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving item details:", error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره تغییرات",
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
    }

    return sections[sectionName] || []
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>جزئیات آیتم {item.itemName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="itemName">نام آیتم</Label>
                <Input id="itemName" value={name} onChange={handleNameChange} />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">اعضای تیم</h3>
                  <Select onValueChange={handleAllFieldsMemberChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="انتخاب عضو برای همه" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.fullName} ({member.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {getFieldsForSection(section.sectionName).map((field) => (
                  <Card key={field}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">{field}</CardTitle>
                      <Switch
                        checked={activeFields[field] ?? true}
                        onCheckedChange={() => toggleFieldActive(field)}
                      />
                    </CardHeader>
                    <CardContent>
                      {activeFields[field] && (
                        <>
                          {selectedMembers[field] ? (
                            <div className="flex items-center justify-between">
                              <div>
                                عضو انتخاب شده: {members.find((m) => m._id === selectedMembers[field])?.fullName || "نامشخص"}
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(field)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Select onValueChange={(value) => handleMemberChange(field, value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب عضو" />
                              </SelectTrigger>
                              <SelectContent>
                                {members.map((member) => (
                                  <SelectItem key={member._id} value={member._id}>
                                    {member.fullName} ({member.position})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
