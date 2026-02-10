import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import { morabbaFont } from "@/lib/fonts"

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
    <html lang="fa" dir="rtl" className={morabbaFont.variable}>
      <body className={`min-h-screen bg-background antialiased ${morabbaFont.className}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}