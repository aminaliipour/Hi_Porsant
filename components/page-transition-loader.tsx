"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { LoadingScreen } from './loading-screen'

export function PageTransitionLoader() {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Start loading when route changes
        const handleStart = () => {
            setIsLoading(true)
        }

        const handleStop = () => {
            // Add a small delay to ensure smooth transition
            setTimeout(() => setIsLoading(false), 300)
        }

        // Listen for route changes
        const startLoadingOnRouteChange = () => {
            handleStart()
        }

        // Stop loading after a bit
        const timer = setTimeout(handleStop, 800)

        return () => clearTimeout(timer)
    }, [pathname])

    return isLoading ? <LoadingScreen /> : null
}
