import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"
import { morabbaFont } from "@/lib/fonts"
import { RootLayoutClient } from "@/components/root-layout-client"

export const metadata: Metadata = {
  title: "Hi Task - سیستم مدیریت پروژه",
  description: "سیستم مدیریت پروژه و وظایف",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" className={morabbaFont.variable} suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${morabbaFont.className}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}