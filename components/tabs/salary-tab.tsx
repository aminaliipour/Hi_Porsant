"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmployeeSalaryDialog } from "@/components/dialogs/employee-salary-dialog"
import { Plus } from "lucide-react"

interface TeamMember {
  _id: string
  fullName: string
  position: string
}

interface GuestReferral {
  _id: string
  fullName: string
  referralFee: number
  description?: string
  dateAdded: string
}

export default function SalaryTab() {
  const [employees, setEmployees] = useState<TeamMember[]>([])
  const [guests, setGuests] = useState<GuestReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null)
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false)
  const [guestFormData, setGuestFormData] = useState({
    fullName: "",
    referralFee: 0,
    description: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // دریافت کارمندان
      const employeesResponse = await fetch("/api/team-members")
      const employeesData = await employeesResponse.json()
      setEmployees(employeesData)

      // دریافت افراد مهمان
      const guestsResponse = await fetch("/api/guest-referrals")
      const guestsData = await guestsResponse.json()
      setGuests(guestsData)
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

  const handleEmployeeClick = (employee: TeamMember) => {
    setSelectedEmployee(employee)
    setIsEmployeeDialogOpen(true)
  }

  const handleGuestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGuestFormData({
      ...guestFormData,
      [name]: name === "referralFee" ? Number.parseInt(value) || 0 : value,
    })
  }

  const handleAddGuest = async () => {
    if (!guestFormData.fullName.trim()) {
      toast({
        title: "خطا",
        description: "نام و نام خانوادگی نمی‌تواند خالی باشد",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/guest-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...guestFormData,
          dateAdded: new Date().toISOString().split("T")[0],
        }),
      })

      if (!response.ok) {
        throw new Error("خطا در ایجاد فرد مهمان")
      }

      const newGuest = await response.json()
      setGuests([...guests, newGuest])
      setGuestFormData({
        fullName: "",
        referralFee: 0,
        description: "",
      })
      setIsAddGuestDialogOpen(false)

      toast({
        title: "موفق",
        description: "فرد مهمان با موفقیت اضافه شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ایجاد فرد مهمان",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const response = await fetch(`/api/guest-referrals/${guestId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("خطا در حذف فرد مهمان")
      }

      setGuests(guests.filter((guest) => guest._id !== guestId))
      toast({
        title: "موفق",
        description: "فرد مهمان با موفقیت حذف شد",
      })
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در حذف فرد مهمان",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* بخش کارمندان */}
      <Card>
        <CardHeader>
          <CardTitle>کارمندان</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <span>{employee.fullName}</span>
                  <span className="text-sm text-muted-foreground">{employee.position}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* بخش افراد مهمان */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>افراد مهمان</CardTitle>
          <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="ml-2 h-4 w-4" />
                افزودن فرد مهمان
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>افزودن فرد مهمان</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName">نام و نام خانوادگی</label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="نام و نام خانوادگی"
                    value={guestFormData.fullName}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="referralFee">هزینه ارجاع (ریال)</label>
                  <Input
                    id="referralFee"
                    name="referralFee"
                    type="number"
                    placeholder="هزینه ارجاع"
                    value={guestFormData.referralFee}
                    onChange={handleGuestInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description">توضیحات</label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="توضیحات"
                    value={guestFormData.description}
                    onChange={handleGuestInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddGuestDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleAddGuest}>افزودن</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {guests.map((guest) => (
                <div key={guest._id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div>{guest.fullName}</div>
                    <div className="text-sm text-muted-foreground">{guest.referralFee.toLocaleString()} ریال</div>
                    {guest.description && <div className="text-xs text-muted-foreground mt-1">{guest.description}</div>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteGuest(guest._id)}>
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <EmployeeSalaryDialog
          employee={selectedEmployee}
          open={isEmployeeDialogOpen}
          onOpenChange={setIsEmployeeDialogOpen}
        />
      )}
    </div>
  )
}
