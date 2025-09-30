"use client"

import type React from "react"
import { Header } from "@/components/header"
import { useEffect } from "react"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
  onLogout?: () => void;
}

export function MainLayout({ children, activeTab, setActiveTab, onLogout }: MainLayoutProps) {
  // اجرای کد مربوط به PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").then(
          (registration) => {
            console.log("Service Worker registered with scope:", registration.scope)
          },
          (err) => {
            console.log("Service Worker registration failed:", err)
          },
        )
      })
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">{/* extra bottom space for mobile nav */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <main className="flex-1 container py-4 md:py-6 px-3 sm:px-4 md:px-6 w-full">
        {children}
      </main>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
