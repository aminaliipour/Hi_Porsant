"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Menu, Edit2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

interface HeaderProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<string | null>(null)
  const [archives, setArchives] = useState<any[]>([])
  const [activeArchive, setActiveArchive] = useState<any>(null)
  const [showNewArchive, setShowNewArchive] = useState(false)
  const [newArchive, setNewArchive] = useState({ name: "", month: 0, year: 0 })
  const [editArchive, setEditArchive] = useState<any>(null)
  const [editArchiveData, setEditArchiveData] = useState({ name: "", month: 0, year: 0 })
  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState(false)
  const archiveDropdownRef = useRef<HTMLDivElement>(null)

  const tabs = [
    { value: "projects", label: "پروژه‌ها" },
    { value: "team", label: "تیم" },
    { value: "commission", label: "پورسانت" },
    { value: "system", label: "سیستم" },
    { value: "salary", label: "حقوق و مزایا" },
    { value: "taadol", label: "سیستم تعادل" },
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
  const copyCurrentDataToArchive = async (archive) => {
    // انتقال پروژه‌ها بدون تکرار
    const projectsRes = await fetch("/api/projects")
    const projects = await projectsRes.json()
    // دریافت پروژه‌های آرشیو مقصد
    const destRes = await fetch(`/api/projects?archiveId=${archive._id}`)
    const destProjects = await destRes.json()
    for (const p of projects) {
      const exists = destProjects.find(dp => dp.name === p.name)
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (archiveDropdownRef.current && !archiveDropdownRef.current.contains(event.target as Node)) {
        setArchiveDropdownOpen(false)
      }
    }
    if (archiveDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [archiveDropdownOpen])

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
      <div className="container flex h-16 items-center py-4">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-2">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Image src="/logo.png" alt="HiPorsant Logo" width={40} height={40} className="rounded-md shadow-sm" />
          <h1 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">HiPorsant</h1>
        </div>
        {/* Center Tabs */}
        <div className="flex-1 flex justify-center">
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
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <User size={16} className="text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium">{user}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : null}
          <ModeToggle />
        </div>
      </div>
      {/* Archive Section زیر لوگو */}
      <div className="container flex flex-col items-start gap-2 pb-2">
        <div className="flex items-center gap-2" ref={archiveDropdownRef}>
          <Button
            size="sm"
            variant="outline"
            className="min-w-[120px] justify-between"
            onClick={() => setArchiveDropdownOpen((v) => !v)}
          >
            {activeArchive ? activeArchive.name : "انتخاب آرشیو"}
            <span className="ml-2">▼</span>
          </Button>
          {archiveDropdownOpen && (
            <div className="absolute mt-12 bg-white dark:bg-gray-900 border rounded shadow-lg z-50 w-64 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-100"
                 style={{ maxHeight: '320px', overflowY: 'auto', width: '320px' }}>
              <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 font-bold border-b"
                onClick={() => {
                  setActiveArchive(null)
                  localStorage.removeItem("activeArchive")
                  setArchiveDropdownOpen(false)
                  window.location.reload()
                }}
              >
                بدون آرشیو (خروج از آرشیو)
              </div>
              {archives.length === 0 && (
                <div className="p-4 text-center text-gray-400">آرشیوی وجود ندارد</div>
              )}
              {archives.map((a) => (
                <div
                  key={a._id}
                  className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/20 ${activeArchive && activeArchive._id === a._id ? "bg-yellow-50 dark:bg-yellow-800/40 font-bold" : ""}`}
                >
                  <span onClick={() => {
                    setActiveArchive(a)
                    localStorage.setItem("activeArchive", JSON.stringify(a))
                    setArchiveDropdownOpen(false)
                    window.location.reload()
                  }} style={{ flex: 1, cursor: "pointer" }}>
                    {a.name} <span className="text-xs text-gray-400">({a.month}/{a.year})</span>
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => handleEditArchive(a)} title="ویرایش" className="ml-1">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteArchive(a._id)} title="حذف" className="ml-1">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowNewArchive(true)}>
            آرشیو جدید
          </Button>
        </div>
      </div>
      {/* New Archive Dialog */}
      {showNewArchive && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-80">
            <h2 className="font-bold mb-2">ایجاد آرشیو جدید</h2>
            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="نام آرشیو (مثلاً خرداد 1404)"
              value={newArchive.name}
              onChange={e => setNewArchive({ ...newArchive, name: e.target.value })}
            />
            <div className="flex gap-2 mb-2">
              <input
                className="w-1/2 p-2 border rounded"
                type="number"
                placeholder="ماه"
                value={newArchive.month || ""}
                onChange={e => setNewArchive({ ...newArchive, month: +e.target.value })}
              />
              <input
                className="w-1/2 p-2 border rounded"
                type="number"
                placeholder="سال"
                value={newArchive.year || ""}
                onChange={e => setNewArchive({ ...newArchive, year: +e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleNewArchive}>ایجاد</Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewArchive(false)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Archive Dialog */}
      {editArchive && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-80">
            <h2 className="font-bold mb-2">ویرایش آرشیو</h2>
            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="نام آرشیو"
              value={editArchiveData.name}
              onChange={e => setEditArchiveData({ ...editArchiveData, name: e.target.value })}
            />
            <div className="flex gap-2 mb-2">
              <input
                className="w-1/2 p-2 border rounded"
                type="number"
                placeholder="ماه"
                value={editArchiveData.month || ""}
                onChange={e => setEditArchiveData({ ...editArchiveData, month: +e.target.value })}
              />
              <input
                className="w-1/2 p-2 border rounded"
                type="number"
                placeholder="سال"
                value={editArchiveData.year || ""}
                onChange={e => setEditArchiveData({ ...editArchiveData, year: +e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdateArchive}>ذخیره</Button>
              <Button size="sm" variant="outline" onClick={() => setEditArchive(null)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
