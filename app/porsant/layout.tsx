import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "مدیریت پورسانت - Hi Porsant",
    description: "سیستم مدیریت پورسانت و کمیسیون پروژه‌ها",
}

export default function PorsantLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
