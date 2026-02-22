"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Building2,
    LayoutDashboard,
    MessageSquare,
    CheckSquare,
    FileText,
    Mail,
    Megaphone,
    Settings,
    CreditCard,
    LogOut,
    Users,
    User
} from "lucide-react"
import { useState, useEffect } from "react"

const sidebarItems = [
    {
        title: "داشبورد",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "گفتگو",
        href: "/dashboard/chat",
        icon: MessageSquare,
    },
    {
        title: "وظایف من",
        href: "/dashboard/tasks",
        icon: CheckSquare,
    },
    {
        title: "فیش حقوقی",
        href: "/dashboard/payslips",
        icon: FileText,
    },
    {
        title: "کارتابل نامه",
        href: "/dashboard/letter-requests",
        icon: Mail,
    },
    {
        title: "پورسانت",
        href: "/dashboard/porsant",
        icon: CreditCard,
        adminOnly: true,
    },
    {
        title: "اطلاعیه‌ها",
        href: "/dashboard/announcements",
        icon: Megaphone,
    },
    {
        title: "مدیریت کاربران",
        href: "/dashboard/users",
        icon: Users,
        adminOnly: true,
    },
    {
        title: "پروفایل من",
        href: "/dashboard/profile",
        icon: User,
    },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [unreadCount, setUnreadCount] = useState(0)
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

    useEffect(() => {
        // console.log("Fetching user for sidebar...");
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                // console.log("Sidebar user fetched:", data.user);
                setUser(data.user || null)
            })
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const res = await fetch("/api/messages/total-unread")
            if (res.ok) {
                const data = await res.json()
                setUnreadCount(data.unreadMessagesCount)
            }
        }

        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 2000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!user) return

        const isAdmin = user.role === "admin" || user.role === "مدیر"
        if (!isAdmin) {
            setPendingRequestsCount(0)
            return
        }

        const fetchPendingRequests = async () => {
            const res = await fetch("/api/letter-requests?summary=1")
            if (res.ok) {
                const data = await res.json()
                setPendingRequestsCount(data.pendingCount || 0)
            }
        }

        fetchPendingRequests()
        const interval = setInterval(fetchPendingRequests, 5000)
        return () => clearInterval(interval)
    }, [user])

    // console.log("Rendering sidebar with user:", user?.role);

    return (
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-card border-l border-gray-200 dark:border-border h-full pt-4">

            <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 mb-2 px-2">منوی اصلی</div>
                {sidebarItems.filter(item => {
                    if (!item.adminOnly) return true;
                    if (user && user.role === 'admin') return true;
                    return false;
                }).map((item) => {
                    const Icon = item.icon
                    const isChat = item.href === "/dashboard/chat"
                    const isLetterRequests = item.href === "/dashboard/letter-requests"
                    const isAdmin = user?.role === "admin" || user?.role === "مدیر"
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-row items-center gap-3 w-full p-2 text-sm font-medium rounded-md transition-colors",
                                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                                    ? "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-800"
                            )}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.title}</span>
                            {isChat && unreadCount > 0 && (
                                <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </div>
                            )}
                            {isLetterRequests && isAdmin && pendingRequestsCount > 0 && (
                                <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold">
                                    {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </div>

        </div>
    )
}
