"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, Menu } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface HeaderProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<string | null>(null)

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

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    toast({
      title: "خروج موفق",
      description: "شما با موفقیت از سیستم خارج شدید",
    })
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
            <TabsList className="hidden md:grid grid-cols-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
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
          ) : (
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
            >
              ورود
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
