"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ProjectsTab from "@/components/tabs/projects-tab"
import TeamTab from "@/components/tabs/team-tab"
import CommissionTab from "@/components/tabs/commission-tab"
import SystemTab from "@/components/tabs/system-tab"
import SalaryTab from "@/components/tabs/salary-tab"
import TaadolTab from "@/components/tabs/taadol-tab"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "projects")

  // تغییر تب و ثبت در query string
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("tab", tab)
    router.replace("?" + params.toString(), { scroll: false })
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={handleTabChange}>
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
