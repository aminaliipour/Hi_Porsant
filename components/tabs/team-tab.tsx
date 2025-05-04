"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { MoreVertical, Trash, Edit, ClipboardList, Plus } from "lucide-react"
import { TeamMemberDetailsDialog } from "@/components/dialogs/team-member-details-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

export default function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAssignmentsDialogOpen, setIsAssignmentsDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [newMember, setNewMember] = useState({
    fullName: "",
    position: "",
    fatherName: "",
    nationalCode: "",
    phoneNumber: "",
    email: "",
    education: "",
    address: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/team-members")
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات اعضای تیم")
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Error fetching team members:", error)
      toast({
        title: "خطا",
        description: "خطا در دریافت لیست اعضای تیم",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDetailsDialogOpen(true)
  }

  const handleViewAssignments = async (member: TeamMember) => {
    try {
      setSelectedMember(member)
      setLoadingAssignments(true)
      setIsAssignmentsDialogOpen(true)

      const response = await fetch(`/api/team-members/${member._id}/assignments`)
      if (!response.ok) {
        throw new Error("خطا در دریافت وظایف اختصاص داده شده")
      }
      const data = await response.json()
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
      setLoadingAssignments(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/team-members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("خطا در حذف عضو تیم")
      }

      setMembers(members.filter((member) => member._id !== memberId))
      toast({
        title: "موفق",
        description: "عضو تیم با موفقیت حذف شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف عضو تیم",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewMember((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddMember = async () => {
    try {
      if (!newMember.fullName || !newMember.position || !newMember.nationalCode || !newMember.phoneNumber) {
        toast({
          title: "خطا",
          description: "لطفاً فیلدهای ضروری را تکمیل کنید",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/team-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMember),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "خطا در افزودن عضو تیم")
      }

      const addedMember = await response.json()
      setMembers([...members, addedMember])

      // پاک کردن فرم
      setNewMember({
        fullName: "",
        position: "",
        fatherName: "",
        nationalCode: "",
        phoneNumber: "",
        email: "",
        education: "",
        address: "",
      })

      setIsAddDialogOpen(false)

      toast({
        title: "موفق",
        description: "عضو تیم با موفقیت اضافه شد",
      })
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "خطا در افزودن عضو تیم",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">اعضای تیم</h2>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 btn-hover"
        >
          <Plus className="ml-2 h-4 w-4" />
          افزودن عضو جدید
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length > 0 ? (
            members.map((member) => (
              <Card key={member._id} className="overflow-hidden border-gray-200 dark:border-gray-700 card-hover">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">{member.fullName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.position}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(member)}
                          className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          <Edit className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                          مشاهده جزئیات
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewAssignments(member)}
                          className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          <ClipboardList className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
                          وظایف اختصاص داده شده
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                          onClick={() => handleDeleteMember(member._id)}
                        >
                          <Trash className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">کد ملی:</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{member.nationalCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">شماره تماس:</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{member.phoneNumber}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/20 btn-hover"
                      onClick={() => handleViewDetails(member)}
                    >
                      مشاهده جزئیات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              هیچ عضوی در تیم وجود ندارد. برای افزودن عضو جدید روی دکمه "افزودن عضو جدید" کلیک کنید.
            </div>
          )}
        </div>
      )}

      {/* دیالوگ افزودن عضو جدید */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl" aria-describedby="team-dialog-description">
          <p id="team-dialog-description" className="sr-only">This dialog provides details about the team.</p>
          <DialogHeader>
            <DialogTitle>افزودن عضو جدید</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
              <Input id="fullName" name="fullName" value={newMember.fullName} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">سمت *</Label>
              <Input id="position" name="position" value={newMember.position} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName">نام پدر *</Label>
              <Input
                id="fatherName"
                name="fatherName"
                value={newMember.fatherName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalCode">کد ملی *</Label>
              <Input
                id="nationalCode"
                name="nationalCode"
                value={newMember.nationalCode}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">شماره تماس *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={newMember.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" name="email" type="email" value={newMember.email} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">تحصیلات</Label>
              <Input id="education" name="education" value={newMember.education} onChange={handleInputChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">آدرس</Label>
              <Input id="address" name="address" value={newMember.address} onChange={handleInputChange} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleAddMember}>افزودن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ نمایش وظایف */}
      {selectedMember && (
        <Dialog open={isAssignmentsDialogOpen} onOpenChange={setIsAssignmentsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>وظایف اختصاص داده شده به {selectedMember.fullName}</DialogTitle>
            </DialogHeader>

            {loadingAssignments ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">پروژه:</span>
                          <span>{assignment.projectName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">بخش:</span>
                          <span>{assignment.sectionName}</span>
                        </div>
                        {assignment.itemName && (
                          <div className="flex justify-between">
                            <span className="font-medium">آیتم:</span>
                            <span>{assignment.itemName}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">فیلد:</span>
                          <span>{assignment.fieldName}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">هیچ وظیفه‌ای به این عضو اختصاص داده نشده است.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignmentsDialogOpen(false)}>
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* دیالوگ جزئیات عضو */}
      {selectedMember && (
        <TeamMemberDetailsDialog
          member={selectedMember}
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            setIsDetailsDialogOpen(open)
            if (!open) {
              setSelectedMember(null)
              fetchMembers()
            }
          }}
        />
      )}
    </div>
  )
}
