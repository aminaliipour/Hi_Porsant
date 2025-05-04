"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface SectionField {
  name: string
  isActive: boolean
  assignedMembers: string[]
}

interface ProjectSection {
  _id: string
  projectId: string
  sectionName: string
}

interface TeamMember {
  _id: string
  fullName: string
}

interface SectionDetailsDialogProps {
  section: ProjectSection
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SectionDetailsDialog({ section, open, onOpenChange }: SectionDetailsDialogProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({})
  const [details, setDetails] = useState<Record<string, any>>({})

  const toggleFieldActive = async (field: string) => {
    const newActiveFields = { ...activeFields }
    newActiveFields[field] = !newActiveFields[field]
    setActiveFields(newActiveFields)

    // در صورت غیرفعال شدن فیلد، عضو مربوط به آن را هم حذف کن
    if (!newActiveFields[field]) {
      handleRemoveMember(field)
    }

    // به‌روزرسانی وضعیت فیلد در سرور
    await handleToggleField(field, newActiveFields[field])
  }

  const getFieldsForSection = (sectionName: string) => {
    return getFields()
  }

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت اعضای تیم
      const membersResponse = await fetch("/api/team-members")
      const membersData = await membersResponse.json()
      setMembers(membersData)

      // دریافت جزئیات بخش
      const endpoint = getEndpointForSection(section.sectionName)
      const detailsResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
      const detailsData = await detailsResponse.json()

      if (detailsData.length > 0) {
        const data = detailsData[0]
        
        // تنظیم وضعیت فعال/غیرفعال و اعضای انتخاب شده از روی details
        const newActiveFields: Record<string, boolean> = {}
        const newSelectedMembers: Record<string, string> = {}
        
        if (data.details) {
          Object.entries(data.details).forEach(([field, detail]: [string, any]) => {
            newActiveFields[field] = detail.isActive ?? true
            if (detail.assignedMemberId) {
              newSelectedMembers[field] = detail.assignedMemberId
            }
          })
        } else {
          // اگر details وجود نداشت، همه فیلدها را به صورت پیش‌فرض فعال کن
          getFieldsForSection(section.sectionName).forEach(field => {
            newActiveFields[field] = true
          })
        }

        setActiveFields(newActiveFields)
        setSelectedMembers(newSelectedMembers)
      }
    } catch (error) {
      console.error("Error fetching section details:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت اطلاعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getEndpointForSection = (sectionName: string) => {
    switch (sectionName) {
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

  const handleMemberChange = (field: string, memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [field]: memberId
    }))
  }

  const handleRemoveMember = (field: string) => {
    setSelectedMembers(prev => {
      const newMembers = { ...prev }
      delete newMembers[field]
      return newMembers
    })
  }

  const handleToggleField = async (field: string, isActive: boolean) => {
    const newDetails = { ...details }
    if (!newDetails[field]) newDetails[field] = {}
    newDetails[field].isActive = isActive

    setDetails(newDetails)

    try {
      const response = await fetch(`/api/${endpoint}/update-field-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: section._id,
          field,
          isActive
        }),
      })

      if (!response.ok) {
        throw new Error('خطا در به‌روزرسانی وضعیت فیلد')
      }

      // در صورت موفقیت، onSave را فراخوانی کن تا صفحه والد به‌روز شود
      if (onSave) onSave()

      toast({
        title: "موفق",
        description: `فیلد ${field} ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      })
    } catch (error) {
      console.error('Error updating field status:', error)
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت فیلد",
        variant: "destructive",
      })
    }
  }

  const getFields = () => {
    switch (section.sectionName) {
      case "طراحی":
        return [
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
        ]
      case "پیمانکاری":
        return ["فاصله زمانی", "سختی کار", "تحویل نهایی کار و آلبوم", "ارجاع توسط"]
      case "مشاوره":
        return ["بازدید", "پر کردن چک لیست", "مشاوره"]
      default:
        return []
    }
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

  const saveChanges = async () => {
    try {
      const endpoint = getEndpointForSection(section.sectionName)

      // Checking if details already exist for this section
      const checkResponse = await fetch(`/api/${endpoint}?sectionId=${section._id}`)
      const existingData = await checkResponse.json()

      let method = "POST"
      let url = `/api/${endpoint}`

      // Create the details object with both isActive status and assignedMembers
      const details = getFieldsForSection(section.sectionName).reduce((acc, field) => {
        acc[field] = {
          isActive: activeFields[field] ?? false,
          assignedMemberId: activeFields[field] ? selectedMembers[field] : null
        }
        return acc
      }, {} as Record<string, { isActive: boolean; assignedMemberId: string | null }>)

      const body = {
        sectionId: section._id,
        details,
      }

      // If details already exist, use PUT to update
      if (existingData && existingData.length > 0) {
        method = "PUT"
        url = `${url}/${existingData[0]._id}`
      }

      console.log('Saving section details:', JSON.stringify(body, null, 2)) // برای دیباگ

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("خطا در ذخیره تغییرات")
      }

      const savedData = await response.json()
      console.log('Saved data:', JSON.stringify(savedData, null, 2)) // برای دیباگ

      toast({
        title: "موفق",
        description: "تغییرات با موفقیت ذخیره شد",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving section details:", error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره تغییرات",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>جزئیات بخش {section.sectionName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-medium">جزئیات</h3>
                <Select onValueChange={handleAllFieldsMemberChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="انتخاب عضو برای همه" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.fullName}
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
                                  {member.fullName}
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
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={saveChanges}>ذخیره</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
