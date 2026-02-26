"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Search, Menu, LogOut, User as UserIcon, Building2, CreditCard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@/contexts/UserContext"

export function DashboardHeader() {
    const { user } = useUser()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationOpen, setNotificationOpen] = useState(false)

    useEffect(() => {
        // Fetch notifications
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 15000) // Changed from 5000 to 15000 for better performance
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: any) => !n.read).length)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllAsRead: true })
            })
            fetchNotifications()
        } catch (err) {
            console.error(err)
        }
    }

    const handleNotificationDropdownOpen = (open: boolean) => {
        setNotificationOpen(open)
        if (open && unreadCount > 0) {
            // Mark all as read when dropdown opens
            setTimeout(() => {
                handleMarkAllAsRead()
            }, 500)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: notificationId })
            })
            fetchNotifications()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications?id=${notificationId}`, {
                method: "DELETE"
            })
            fetchNotifications()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <header className="h-16 bg-white dark:bg-card border-b border-gray-200 dark:border-border flex flex-row items-center px-4 md:px-6 z-20 relative">

            {/* Right Side (RTL Start): Mobile Menu & Branding */}
            <div className="flex flex-row items-center gap-4 z-30">
                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 translate-x-0 w-72">
                            <div className="h-full py-6">
                                <div className="flex flex-row items-center px-6 mb-8">
                                    <span className="text-xl font-bold">منوی موبایل</span>
                                </div>
                                <div className="flex flex-col px-4 gap-2">
                                    <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start">داشبورد</Button></Link>
                                    <Link href="/dashboard/chat"><Button variant="ghost" className="w-full justify-start">گفتگو</Button></Link>
                                    <Link href="/dashboard/tasks"><Button variant="ghost" className="w-full justify-start">وظایف</Button></Link>
                                    <Link href="/dashboard/payslips"><Button variant="ghost" className="w-full justify-start">فیش حقوقی</Button></Link>
                                    <Link href="/dashboard/letter-requests"><Button variant="ghost" className="w-full justify-start">کارتابل نامه</Button></Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Center: Branding & Search Bar */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl hidden md:flex flex-row items-center justify-center gap-3">
                {/* Porsant Button - Admin Only */}
                {(user?.role === "admin" || user?.role === "مدیر") && (
                    <Link href="/porsant">
                        <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
                            <CreditCard className="w-4 h-4 ml-2" />
                            پورسانت
                        </Button>
                    </Link>
                )}
                {/* Search */}
                <div className="relative w-full max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="جستجو در تسک‌ها، پیام‌ها و..."
                        className="pr-10 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 w-full"
                    />
                </div>
            </div>

            {/* Left Side (RTL End): Profile & Actions */}
            <div className="flex flex-row items-center gap-2 md:gap-4 mr-auto z-30">
                <DropdownMenu open={notificationOpen} onOpenChange={handleNotificationDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-gray-500">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <>
                                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                        <DropdownMenuLabel>نوتیفیکیشن‌ها ({unreadCount})</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length === 0 ? (
                            <DropdownMenuItem disabled>هیچ نوتیفیکیشن‌ی وجود ندارد</DropdownMenuItem>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 text-sm border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                    onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className="font-semibold">{notification.title}</p>
                                            <p className="text-gray-600 dark:text-gray-400 text-xs">{notification.message}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNotification(notification._id)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="hidden md:flex flex-row items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-700 mr-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 p-2 rounded-lg transition-colors">
                            <div className="text-left hidden lg:block">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {user ? user.name : "کاربر مهمان"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.jobTitle || "کاربر سیستم"}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                {user?.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-yellow-700 font-bold">{user ? user.name.charAt(0) : "U"}</span>
                                )}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                            <Link href="/dashboard/profile">
                                <UserIcon className="w-4 h-4" />
                                <span>پروفایل و تنظیمات</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" asChild>
                            <Link href="/api/auth/logout" prefetch={false}>
                                <LogOut className="w-4 h-4" />
                                <span>خروج از حساب</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
