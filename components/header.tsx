"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Menu, Edit2, Trash2, Archive } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface HeaderProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  onLogout?: () => void;
}

export function Header({ activeTab, setActiveTab, onLogout }: HeaderProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<string | null>(null)
  const [archives, setArchives] = useState<any[]>([])
  const [activeArchive, setActiveArchive] = useState<any>(null)
  const [showNewArchive, setShowNewArchive] = useState(false)
  const [newArchive, setNewArchive] = useState({ name: "", month: 0, year: 0 })
  const [editArchive, setEditArchive] = useState<any>(null)
  const [editArchiveData, setEditArchiveData] = useState({ name: "", month: 0, year: 0 })
  const [showArchiveSelect, setShowArchiveSelect] = useState(false)

  const tabs = [
    { value: "projects", label: "پروژه‌ها" },
    { value: "team", label: "تیم" },
    { value: "commission", label: "پورسانت" },
    { value: "system", label: "سیستم" },
    { value: "salary", label: "حقوق و مزایا" },
    { value: "taadol", label: "سیستم تعادل" },
    { value: "report", label: "گزارش" },
  ]

  useEffect(() => {
    // بررسی وضعیت لاگین کاربر
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser).name)
    }
  }, [])

  useEffect(() => {
    fetch("/api/archives")
      .then((res) => res.json())
      .then((data) => setArchives(data))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    toast({
      title: "خروج موفق",
      description: "شما با موفقیت از سیستم خارج شدید",
    })
  }

  const handleArchiveChange = (id: string) => {
    const found = archives.find((a) => a._id === id)
    setActiveArchive(found)
    localStorage.setItem("activeArchive", JSON.stringify(found))
    window.location.reload()
  }

  const handleNewArchive = async () => {
    if (!newArchive.name || !newArchive.month || !newArchive.year) return
    const res = await fetch("/api/archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newArchive),
    })
    if (res.ok) {
      setShowNewArchive(false)
      const data = await res.json()
      setArchives([data, ...archives])
      setActiveArchive(data)
      localStorage.setItem("activeArchive", JSON.stringify(data))
      // ریست داده‌های قبلی (پاک کردن کش و ریفرش کامل)
      localStorage.removeItem("projects")
      localStorage.removeItem("teamMembers")
      localStorage.removeItem("guestReferrals")
      localStorage.removeItem("systemExpenses")
      localStorage.removeItem("projectIncomes")
      localStorage.removeItem("projectTaxes")
      window.location.reload()
    }
  }

  const handleEditArchive = (archive: any) => {
    setEditArchive(archive)
    setEditArchiveData({ name: archive.name, month: archive.month, year: archive.year })
  }

  const handleUpdateArchive = async () => {
    if (!editArchive) return
    const res = await fetch("/api/archives", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: editArchive._id, ...editArchiveData }),
    })
    if (res.ok) {
      const updated = await res.json()
      setArchives(archives.map(a => a._id === updated._id ? updated : a))
      if (activeArchive && activeArchive._id === updated._id) {
        setActiveArchive(updated)
        localStorage.setItem("activeArchive", JSON.stringify(updated))
      }
      setEditArchive(null)
    }
  }

  // تابع ذخیره آرشیو فعلی با داده‌های موجود
  const saveCurrentAsArchive = async () => {
    // ساخت آرشیو جدید برای اردیبهشت 1404
    const archiveRes = await fetch("/api/archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "اردیبهشت 1404", month: 2, year: 1404 }),
    })
    if (!archiveRes.ok) return toast({ title: "خطا", description: "خطا در ایجاد آرشیو" })
    const archive = await archiveRes.json()
    // گرفتن همه داده‌های فعلی (پروژه‌ها و ...)
    // فرض: پروژه‌ها و سایر داده‌ها در localStorage یا state هستند و باید با archiveId جدید ذخیره شوند
    // اینجا فقط نمونه کد برای پروژه‌ها آورده شده است
    const projectsRes = await fetch("/api/projects")
    const projects = await projectsRes.json()
    for (const p of projects) {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, archiveId: archive._id }),
      })
    }
    // سایر داده‌ها (team-members و ...) را هم به همین صورت ذخیره کنید
    toast({ title: "آرشیو شد!", description: "داده‌های فعلی به عنوان آرشیو اردیبهشت 1404 ذخیره شدند." })
    setArchives([archive, ...archives])
  }

  // انتقال پروژه‌ها و اعضای تیم فعلی به آرشیو انتخابی
  const copyCurrentDataToArchive = async (archive: any) => {
    try {
      // انتقال پروژه‌ها بدون تکرار
      const projectsRes = await fetch("/api/projects")
      const projects = await projectsRes.json()
      // دریافت پروژه‌های آرشیو مقصد
      const destRes = await fetch(`/api/projects?archiveId=${archive._id}`)
      const destProjects = await destRes.json()
      for (const p of projects) {
        const exists = destProjects.find((dp: any) => dp.name === p.name)
        if (!exists) {
          await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: p.name, archiveId: archive._id }),
          })
        }
      }

      // انتقال حقوق‌های کارکنان
      const salariesRes = await fetch("/api/all-salaries")
      const salaries = await salariesRes.json()
      for (const salary of salaries) {
        // بررسی اینکه آیا این حقوق قبلاً در آرشیو وجود دارد یا نه
        const existingSalaryRes = await fetch(`/api/employee-salaries?employeeId=${salary.employeeId}&archiveId=${archive._id}`)
        const existingSalaries = await existingSalaryRes.json()
        if (existingSalaries.length === 0) {
          await fetch("/api/employee-salaries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...salary, archiveId: archive._id }),
          })
        }
      }

      // انتقال پورسانت‌های کاربران
      const teamMembersRes = await fetch("/api/team-members")
      const teamMembers = await teamMembersRes.json()
      for (const member of teamMembers) {
        const commissionsRes = await fetch(`/api/user-commissions/${member._id}`)
        const commissions = await commissionsRes.json()
        if (commissions.length > 0) {
          // ارسال وضعیت پورسانت‌ها برای آرشیو جدید
          await fetch("/api/user-commissions/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: member._id,
              archiveId: archive._id,
              commissionStates: commissions.map((c: any) => ({
                projectName: c.projectName,
                sectionName: c.sectionName,
                itemName: c.itemName,
                fieldName: c.fieldName,
                isActive: c.isActive
              }))
            }),
          })
        }
      }

      toast({ title: "انتقال انجام شد!", description: "داده‌ها به آرشیو انتخابی منتقل شدند." })
      window.location.reload()
    } catch (error) {
      console.error("Error copying data to archive:", error)
      toast({ title: "خطا", description: "خطا در انتقال داده‌ها", variant: "destructive" })
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("activeArchive")
    if (stored && stored !== "undefined") {
      try {
        setActiveArchive(JSON.parse(stored))
      } catch {
        setActiveArchive(null)
      }
    } else {
      setActiveArchive(null)
    }
  }, [archives])

  // حذف آرشیو
  const handleDeleteArchive = async (archiveId: string) => {
    if (!window.confirm("آیا از حذف این آرشیو مطمئن هستید؟")) return;
    const res = await fetch(`/api/archives?id=${archiveId}`, { method: "DELETE" })
    if (res.ok) {
      setArchives(archives.filter(a => a._id !== archiveId))
      if (activeArchive && activeArchive._id === archiveId) {
        setActiveArchive(null)
        localStorage.removeItem("activeArchive")
        window.location.reload()
      }
    }
  }

  return (
    <header className="bg-background border-b sticky top-0 z-40 shadow-sm supports-[backdrop-filter]:bg-background/90 backdrop-blur">
      <div className="container flex h-14 md:h-16 items-center py-2 md:py-4 gap-3 md:gap-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-2 mt-4">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => {
                        setActiveTab(tab.value)
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setShowArchiveSelect(true)}
                    className="justify-start"
                  >
                    مدیریت آرشیو
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {/* Mobile quick archive */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setShowArchiveSelect(true)}
            title="آرشیوها"
          >
            <Archive className="h-5 w-5" />
          </Button>
          <Image src="/logo.png" alt="HiPorsant Logo" width={40} height={40} className="rounded-md shadow-sm" />
          <h1 className="text-lg md:text-xl font-bold text-yellow-600 dark:text-yellow-400">HiPorsant</h1>
        </div>
        {/* Center Tabs */}
        <div className="flex-1 hidden md:flex justify-center">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl justify-center gap-2">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900 rounded-lg"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {/* User Info and Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* دکمه خروج از سیستم */}
          {onLogout && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={onLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 md:hidden"
                title="خروج"
              >
                <LogOut size={18} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hidden md:inline-flex"
              >
                <LogOut size={16} className="ml-2" />
                خروج از سیستم
              </Button>
            </>
          )}
          
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <User size={16} className="text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium truncate max-w-[120px]">{user}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400 md:hidden"
                title="خروج"
              >
                <LogOut size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hidden md:inline-flex text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : null}
          <ModeToggle />
        </div>
      </div>
      {/* Archive Section زیر لوگو */}
      <div className="hidden md:flex container flex-col items-start gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="min-w-[120px] justify-between"
            onClick={() => setShowArchiveSelect(true)}
          >
            {activeArchive ? activeArchive.name : "انتخاب آرشیو"}
            <span className="ml-2">▼</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewArchive(true)}>
            آرشیو جدید
          </Button>
        </div>
      </div>
      
      {/* Archive Selection Dialog */}
      <Dialog open={showArchiveSelect} onOpenChange={setShowArchiveSelect}>
        <DialogContent className="max-w-[90vw] md:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <DialogTitle className="text-lg font-bold">انتخاب آرشیو</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="px-3 py-2">
              {/* گزینه بدون آرشیو */}
              <div
                className="flex items-center justify-between px-4 py-3 mb-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-medium border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                onClick={() => {
                  setActiveArchive(null)
                  localStorage.removeItem("activeArchive")
                  setShowArchiveSelect(false)
                  window.location.reload()
                }}
              >
                <span>🚫 بدون آرشیو (خروج از آرشیو)</span>
              </div>
              
              {/* لیست آرشیوها */}
              {archives.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">📁</div>
                  <div>آرشیوی وجود ندارد</div>
                </div>
              )}
              <div className="space-y-2 pb-2">
                {archives.map((archive) => (
                  <div
                    key={archive._id}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border rounded-lg transition-colors ${
                      activeArchive && activeArchive._id === archive._id 
                        ? "bg-yellow-100 dark:bg-yellow-800/40 border-yellow-500 shadow-sm" 
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className="flex-1 flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        setActiveArchive(archive)
                        localStorage.setItem("activeArchive", JSON.stringify(archive))
                        setShowArchiveSelect(false)
                        window.location.reload()
                      }}
                    >
                      <span className="text-xl">
                        {activeArchive && activeArchive._id === archive._id ? "✅" : "📁"}
                      </span>
                      <div>
                        <div className={`font-medium ${activeArchive && activeArchive._id === archive._id ? "text-yellow-700 dark:text-yellow-300" : ""}`}>
                          {archive.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {archive.month}/{archive.year}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditArchive(archive)
                          setShowArchiveSelect(false)
                        }} 
                        title="ویرایش"
                        className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <Edit2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteArchive(archive._id)
                          setShowArchiveSelect(false)
                        }} 
                        title="حذف"
                        className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowArchiveSelect(false)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Archive Dialog */}
      <Dialog open={showNewArchive} onOpenChange={setShowNewArchive}>
        <DialogContent className="max-w-[90vw] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-bold">ایجاد آرشیو جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نام آرشیو</Label>
              <Input
                placeholder="مثلاً خرداد 1404"
                value={newArchive.name}
                onChange={e => setNewArchive({ ...newArchive, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>ماه</Label>
                <Input
                  type="number"
                  placeholder="ماه"
                  value={newArchive.month || ""}
                  onChange={e => setNewArchive({ ...newArchive, month: +e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>سال</Label>
                <Input
                  type="number"
                  placeholder="سال"
                  value={newArchive.year || ""}
                  onChange={e => setNewArchive({ ...newArchive, year: +e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewArchive(false)}>انصراف</Button>
            <Button onClick={handleNewArchive}>ایجاد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Archive Dialog */}
      <Dialog open={!!editArchive} onOpenChange={(open) => !open && setEditArchive(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-bold">ویرایش آرشیو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نام آرشیو</Label>
              <Input
                placeholder="نام آرشیو"
                value={editArchiveData.name}
                onChange={e => setEditArchiveData({ ...editArchiveData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>ماه</Label>
                <Input
                  type="number"
                  placeholder="ماه"
                  value={editArchiveData.month || ""}
                  onChange={e => setEditArchiveData({ ...editArchiveData, month: +e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>سال</Label>
                <Input
                  type="number"
                  placeholder="سال"
                  value={editArchiveData.year || ""}
                  onChange={e => setEditArchiveData({ ...editArchiveData, year: +e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditArchive(null)}>انصراف</Button>
            <Button onClick={handleUpdateArchive}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
