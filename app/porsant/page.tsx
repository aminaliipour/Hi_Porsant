"use client"

import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import PorsantPageContent from "./porsant-content"

export default function PorsantPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <PorsantPageContent />
        </Suspense>
    )
}
