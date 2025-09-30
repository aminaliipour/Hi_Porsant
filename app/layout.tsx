import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HiPorsant - سیستم مدیریت پروژه",
  description: "سیستم مدیریت پروژه و محاسبه پورسانت",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  generator: 'v0.dev',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#ffeb3b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HiPorsant'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-background font-[Morabba] antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}