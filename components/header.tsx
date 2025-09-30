"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Menu, Edit2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
    toast({ title: "انتقال انجام شد!", description: "پروژه‌های غیرتکراری به آرشیو انتخابی منتقل شدند." })
    window.location.reload()
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
    <header className="bg-background border-b sticky top-0 z-40 shadow-sm">
      <div className="container flex h-14 sm:h-16 items-center px-2 sm:px-4 py-2 sm:py-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Menu className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 sm:w-72">
                <div className="flex flex-col space-y-2 mt-4">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "ghost"}
                      className="justify-start text-sm"
                      onClick={() => {
                        setActiveTab(tab.value)
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Image src="/logo.png" alt="HiPorsant Logo" width={32} height={32} className="sm:w-10 sm:h-10 rounded-md shadow-sm" />
          <h1 className="text-sm sm:text-xl font-bold text-yellow-600 dark:text-yellow-400 hidden xs:block">HiPorsant</h1>
        </div>
        {/* Center Tabs */}
        <div className="flex-1 flex justify-center">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl justify-center gap-1 lg:gap-2">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900 rounded-lg text-xs lg:text-sm px-2 lg:px-3"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {/* User Info and Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* دکمه خروج از سیستم */}
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut size={14} className="sm:size-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">خروج از سیستم</span>
              <span className="sm:hidden">خروج</span>
            </Button>
          )}
          
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <User size={16} className="text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium">{user}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hidden sm:flex text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : null}
          <div className="scale-75 sm:scale-100">
            <ModeToggle />
          </div>
        </div>
      </div>
      {/* Archive Section زیر لوگو */}
      <div className="container flex flex-col items-start gap-2 pb-2 px-2 sm:px-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-initial sm:min-w-[120px] justify-between text-xs sm:text-sm"
            onClick={() => setShowArchiveSelect(true)}
          >
            <span className="truncate">{activeArchive ? activeArchive.name : "انتخاب آرشیو"}</span>
            <span className="ml-2">▼</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewArchive(true)} className="text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">آرشیو جدید</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>
      
      {/* Archive Selection Dialog */}
      {showArchiveSelect && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg max-h-[90vh] sm:max-h-[500px] overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-bold">انتخاب آرشیو</h2>
            </div>
            <div className="max-h-60 sm:max-h-80 overflow-y-auto">
              {/* گزینه بدون آرشیو */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 font-medium border-b border-gray-100 dark:border-gray-800"
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
              {archives.map((archive) => (
                <div
                  key={archive._id}
                  className={`flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-b border-gray-100 dark:border-gray-800 ${
                    activeArchive && activeArchive._id === archive._id 
                      ? "bg-yellow-100 dark:bg-yellow-800/40 border-l-4 border-l-yellow-500" 
                      : ""
                  }`}
                >
                  <div
                    className="flex-1 flex items-center gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => {
                      setActiveArchive(archive)
                      localStorage.setItem("activeArchive", JSON.stringify(archive))
                      setShowArchiveSelect(false)
                      window.location.reload()
                    }}
                  >
                    <span className="text-lg sm:text-xl">
                      {activeArchive && activeArchive._id === archive._id ? "✅" : "📁"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm sm:text-base truncate ${activeArchive && activeArchive._id === archive._id ? "text-yellow-700 dark:text-yellow-300" : ""}`}>
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
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
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
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowArchiveSelect(false)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-sm"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Archive Dialog */}
      {showNewArchive && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
            <h2 className="font-bold mb-3 text-base sm:text-lg">ایجاد آرشیو جدید</h2>
            <input
              className="w-full mb-3 p-2 sm:p-3 border rounded text-sm sm:text-base"
              placeholder="نام آرشیو (مثلاً خرداد 1404)"
              value={newArchive.name}
              onChange={e => setNewArchive({ ...newArchive, name: e.target.value })}
            />
            <div className="flex gap-2 mb-3">
              <input
                className="w-1/2 p-2 sm:p-3 border rounded text-sm sm:text-base"
                type="number"
                placeholder="ماه"
                value={newArchive.month || ""}
                onChange={e => setNewArchive({ ...newArchive, month: +e.target.value })}
              />
              <input
                className="w-1/2 p-2 sm:p-3 border rounded text-sm sm:text-base"
                type="number"
                placeholder="سال"
                value={newArchive.year || ""}
                onChange={e => setNewArchive({ ...newArchive, year: +e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNewArchive} className="text-sm">ایجاد</Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewArchive(false)} className="text-sm">انصراف</Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Archive Dialog */}
      {editArchive && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
            <h2 className="font-bold mb-3 text-base sm:text-lg">ویرایش آرشیو</h2>
            <input
              className="w-full mb-3 p-2 sm:p-3 border rounded text-sm sm:text-base"
              placeholder="نام آرشیو"
              value={editArchiveData.name}
              onChange={e => setEditArchiveData({ ...editArchiveData, name: e.target.value })}
            />
            <div className="flex gap-2 mb-3">
              <input
                className="w-1/2 p-2 sm:p-3 border rounded text-sm sm:text-base"
                type="number"
                placeholder="ماه"
                value={editArchiveData.month || ""}
                onChange={e => setEditArchiveData({ ...editArchiveData, month: +e.target.value })}
              />
              <input
                className="w-1/2 p-2 sm:p-3 border rounded text-sm sm:text-base"
                type="number"
                placeholder="سال"
                value={editArchiveData.year || ""}
                onChange={e => setEditArchiveData({ ...editArchiveData, year: +e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdateArchive} className="text-sm">ذخیره</Button>
              <Button size="sm" variant="outline" onClick={() => setEditArchive(null)} className="text-sm">انصراف</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
