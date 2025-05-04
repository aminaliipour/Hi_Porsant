"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface TeamMember {
  _id: string
  fullName: string
  position: string
  fatherName: string
  nationalCode: string
  phoneNumber: string
  email?: string
  education?: string
  address?: string
}

interface Assignment {
  projectName: string
  sectionName: string
  itemName?: string
  fieldName: string
}

interface TeamMemberDetailsDialogProps {
  member: TeamMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TeamMemberDetailsDialog({ member, open, onOpenChange }: TeamMemberDetailsDialogProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [memberData, setMemberData] = useState<TeamMember>({
    _id: "",
    fullName: "",
    position: "",
    fatherName: "",
    nationalCode: "",
    phoneNumber: "",
    email: "",
    education: "",
    address: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && member) {
      setMemberData(member)
      fetchAssignments()
    }
  }, [open, member]) // Removing setMemberData and fetchAssignments from dependencies

  const fetchAssignments = async () => {
    if (!member || !member._id) return

    try {
      console.log("Fetching assignments for member:", member._id) // اضافه کردن log
      setLoading(true)
      const response = await fetch(`/api/team-members/${member._id}/assignments`)
      
      console.log("Response status:", response.status) // اضافه کردن log
      
      if (!response.ok) {
        throw new Error("خطا در دریافت وظایف اختصاص داده شده")
      }
      
      const data = await response.json()
      console.log("Received assignments data:", data) // اضافه کردن log
      setAssignments(data)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت وظایف اختصاص داده شده",
        variant: "destructive",
      })
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMemberData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    try {
      if (!memberData.fullName || !memberData.position || !memberData.nationalCode || !memberData.phoneNumber) {
        toast({
          title: "خطا",
          description: "لطفاً فیلدهای ضروری را تکمیل کنید",
          variant: "destructive",
        })
        return
      }

      const url = memberData._id ? `/api/team-members/${memberData._id}` : "/api/team-members"
      const method = memberData._id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "خطا در ذخیره اطلاعات")
      }

      toast({
        title: "موفق",
        description: memberData._id ? "اطلاعات با موفقیت بروزرسانی شد" : "عضو جدید با موفقیت اضافه شد",
      })

      setIsEditing(false)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره اطلاعات",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (memberData._id ? "ویرایش اطلاعات" : "افزودن عضو جدید") : `مشخصات ${memberData.fullName}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="p-1 space-y-4">
            {/* مشخصات فردی */}
            <Card>
              <CardContent className="pt-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm">نام و نام خانوادگی *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={memberData.fullName}
                        onChange={handleInputChange}
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-sm">سمت *</Label>
                      <Input
                        id="position"
                        name="position"
                        value={memberData.position}
                        onChange={handleInputChange}
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="fatherName" className="text-sm">نام پدر *</Label>
                        <Input
                          id="fatherName"
                          name="fatherName"
                          value={memberData.fatherName}
                          onChange={handleInputChange}
                          className="h-9"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nationalCode" className="text-sm">کد ملی *</Label>
                        <Input
                          id="nationalCode"
                          name="nationalCode"
                          value={memberData.nationalCode}
                          onChange={handleInputChange}
                          className="h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm">شماره تماس *</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={memberData.phoneNumber}
                          onChange={handleInputChange}
                          className="h-9"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm">ایمیل</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={memberData.email}
                          onChange={handleInputChange}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education" className="text-sm">تحصیلات</Label>
                      <Input
                        id="education"
                        name="education"
                        value={memberData.education}
                        onChange={handleInputChange}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm">آدرس</Label>
                      <Input
                        id="address"
                        name="address"
                        value={memberData.address}
                        onChange={handleInputChange}
                        className="h-9"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">نام و نام خانوادگی:</span>
                      <span>{memberData.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">سمت:</span>
                      <span>{memberData.position}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">نام پدر:</span>
                      <span>{memberData.fatherName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">کد ملی:</span>
                      <span>{memberData.nationalCode}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="text-muted-foreground">شماره تماس:</span>
                      <span>{memberData.phoneNumber}</span>
                    </div>
                    {memberData.email && (
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-muted-foreground">ایمیل:</span>
                        <span>{memberData.email}</span>
                      </div>
                    )}
                    {memberData.education && (
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-muted-foreground">تحصیلات:</span>
                        <span>{memberData.education}</span>
                      </div>
                    )}
                    {memberData.address && (
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-muted-foreground">آدرس:</span>
                        <span>{memberData.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* وظایف اختصاص داده شده */}
            {!isEditing && member && member._id && (
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-base font-medium mb-3">وظایف اختصاص داده شده</h3>
                  {loading ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      هیچ وظیفه‌ای اختصاص داده نشده است
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {assignments.map((assignment, index) => (
                          <div key={index} className="text-sm p-2 bg-muted/50 rounded-lg">
                            <div className="font-medium text-primary">پروژه: {assignment.projectName}</div>
                            <div className="text-muted-foreground mt-1">بخش: {assignment.sectionName}</div>
                            {assignment.itemName && (
                              <div className="text-muted-foreground mt-1">آیتم: {assignment.itemName}</div>
                            )}
                            <div className="text-muted-foreground mt-1">وظیفه: {assignment.fieldName}</div>
                            {index < assignments.length - 1 && <Separator className="my-2" />}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (member) {
                    setIsEditing(false)
                    setMemberData(member)
                  } else {
                    onOpenChange(false)
                  }
                }}
              >
                انصراف
              </Button>
              <Button size="sm" onClick={handleSave}>ذخیره</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                بستن
              </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>ویرایش</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
