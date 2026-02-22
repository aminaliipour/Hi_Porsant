import type { Metadata } from "next"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export const metadata: Metadata = {
    title: "Hi Architect | Dashboard",
    description: "Advanced Project Management System",
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-zinc-900/50" style={{ flexDirection: 'row' }}>
            <DashboardSidebar />
            <div className="flex flex-col flex-1 w-0 overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    {children}
                </main>
            </div>
        </div>
    )
}
