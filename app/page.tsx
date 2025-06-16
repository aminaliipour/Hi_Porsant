"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ProjectsTab from "@/components/tabs/projects-tab"
import TeamTab from "@/components/tabs/team-tab"
import CommissionTab from "@/components/tabs/commission-tab"
import SystemTab from "@/components/tabs/system-tab"
import SalaryTab from "@/components/tabs/salary-tab"
import TaadolTab from "@/components/tabs/taadol-tab"
import LoginPage from "@/components/login-page"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "projects")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // تغییر تب و ثبت در query string
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("tab", tab)
    router.replace("?" + params.toString(), { scroll: false })
  }

  useEffect(() => {
    // بررسی وضعیت احراز هویت از localStorage
    if (typeof window !== "undefined") {
      const authStatus = localStorage.getItem("isAuthenticated") === "true"
      setIsAuthenticated(authStatus)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    setIsAuthenticated(false)
  }

  // در حال بارگذاری
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBCC0A]/20 to-[#58595B]/10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#58595B]">
          <div className="w-6 h-6 border-2 border-[#58595B]/30 border-t-[#FBCC0A] rounded-full animate-spin"></div>
          <span className="text-lg">در حال بارگذاری...</span>
        </div>
      </div>
    )
  }

  // نمایش صفحه لاگین
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  // نمایش برنامه اصلی
  return (
    <MainLayout activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="commission">
          <CommissionTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
        <TabsContent value="salary">
          <SalaryTab />
        </TabsContent>
        <TabsContent value="taadol">
          <TaadolTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}
