import type React from "react"
import "./globals.css"
import { Vazirmatn } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"

// بهبود تنظیمات فونت وزیر
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "HiPorsant - سیستم مدیریت پروژه",
  description: "سیستم مدیریت پروژه و محاسبه پورسانت",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'