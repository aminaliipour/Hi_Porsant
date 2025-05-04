"use client"

import type React from "react"
import { Header } from "@/components/header"
import { useEffect } from "react"

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function MainLayout({ children, activeTab, setActiveTab }: MainLayoutProps) {
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
    <div className="flex min-h-screen flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 container py-6">{children}</main>
    </div>
  )
}
