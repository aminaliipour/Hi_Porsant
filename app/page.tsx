"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ProjectsTab from "@/components/tabs/projects-tab"
import TeamTab from "@/components/tabs/team-tab"
import CommissionTab from "@/components/tabs/commission-tab"
import SystemTab from "@/components/tabs/system-tab"
import SalaryTab from "@/components/tabs/salary-tab"
import TaadolTab from "@/components/tabs/taadol-tab"

export default function Home() {
  const [activeTab, setActiveTab] = useState("projects")

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Tabs value={activeTab} className="w-full">
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
