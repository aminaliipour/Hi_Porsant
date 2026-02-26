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
import ReportTab from "@/components/tabs/report-tab"

export default function PorsantPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")
    const [activeTab, setActiveTab] = useState(tabParam || "projects")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is admin
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (!data.user || data.user.role !== "admin") {
                    router.replace("/dashboard")
                } else {
                    setLoading(false)
                }
            })
            .catch(() => router.replace("/dashboard"))
    }, [router])

    if (loading) {
        return <div className="flex h-full items-center justify-center">درحال بررسی دسترسی...</div>
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        params.set("tab", tab)
        router.replace("?" + params.toString(), { scroll: false })
    }

    return (
        <div className="h-full flex flex-col">
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
                    <TabsContent value="report">
                        <ReportTab />
                    </TabsContent>
                </Tabs>
            </MainLayout>
        </div>
    )
}
