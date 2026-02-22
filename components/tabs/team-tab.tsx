"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { MoreVertical, ClipboardList, User } from "lucide-react"
import { TeamMemberDetailsDialog } from "@/components/dialogs/team-member-details-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  cardNumber?: string
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
  const [isAssignmentsDialogOpen, setIsAssignmentsDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // دریافت آرشیو فعال از localStorage
    const stored = localStorage.getItem("activeArchive")
    let archiveId = ""
    if (stored) {
      try {
        archiveId = JSON.parse(stored)._id
      } catch { }
    }
    fetchMembers(archiveId)
  }, [])

  const fetchMembers = async (archiveId?: string) => {
    try {
      setLoading(true)
      let url = "/api/team-members"
      if (archiveId) url += `?archiveId=${archiveId}`
      const response = await fetch(url)
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
      // دریافت آرشیو فعال
      const stored = localStorage.getItem("activeArchive")
      let archiveId = ""
      if (stored) {
        try {
          archiveId = JSON.parse(stored)._id
        } catch { }
      }
      let url = `/api/team-members/${member._id}/assignments`
      if (archiveId) url += `?archiveId=${archiveId}`
      const response = await fetch(url)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">اعضای تیم</h2>
        {/* Add Member button removed */}
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
                          <User className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                          مشاهده جزئیات
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewAssignments(member)}
                          className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          <ClipboardList className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
                          وظایف اختصاص داده شده
                        </DropdownMenuItem>
                        {/* Delete and Edit removed */}
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
                    {member.cardNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">شماره کارت:</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{member.cardNumber}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/20 btn-hover"
                      onClick={() => handleViewAssignments(member)}
                    >
                      مشاهده وظایف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              هیچ عضوی در تیم وجود ندارد.
            </div>
          )}
        </div>
      )}

      {/* Add Dialog Removed */}

      {/* دیالوگ نمایش وظایف */}
      {selectedMember && (
        <Dialog open={isAssignmentsDialogOpen} onOpenChange={setIsAssignmentsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>وظایف اختصاص داده شده به {selectedMember.fullName}</DialogTitle>
            </DialogHeader>

            {loadingAssignments ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : assignments.length > 0 ? (
              <ScrollArea className="max-h-[calc(90vh-12rem)] pr-4">
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
              </ScrollArea>
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

      {/* دیالوگ جزئیات عضو - Keep strictly for viewing details if needed, or could remove. Keeping for now but it should be read-only if the dialog allows editing. Check dialog content? Assuming it displays info. */}
      {selectedMember && (
        <TeamMemberDetailsDialog
          member={selectedMember}
          open={isDetailsDialogOpen}
          onOpenChange={(open) => {
            setIsDetailsDialogOpen(open)
            if (!open) {
              setSelectedMember(null)
              // fetchMembers() // No need to refetch if read-only
            }
          }}
        />
      )}
    </div>
  )
}
