"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"

const DashboardContent = dynamic(() => import("./dashboard-content"), {
    loading: () => <LoadingScreen />,
    ssr: false,
})

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <DashboardContent />
        </Suspense>
    )
}
