"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CheckSquare,
    MessageSquare,
    Megaphone,
    Calendar,
    Clock,
    ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gregorianToJalali, calculateDaysRemaining, formatCountdown, formatJalaliDate } from "@/lib/jalali"

interface Task {
    _id: string
    title: string
    description?: string
    assignedTo?: string
    dueDate?: string
    priority?: string
    status?: string
    createdAt?: string
}

interface Announcement {
    _id: string
    title: string
    content: string
    sender?: { name: string }
    createdAt: string
}

interface DashboardStats {
    pendingTasks: number
    unreadMessages: number
    announcements: number
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [assignedToMeTasks, setAssignedToMeTasks] = useState<Task[]>([])
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [stats, setStats] = useState<DashboardStats>({
        pendingTasks: 0,
        unreadMessages: 0,
        announcements: 0
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user info
                const userRes = await fetch("/api/auth/me")
                if (!userRes.ok) throw new Error("Unauthorized")
                const userData = await userRes.json()
                setUser(userData.user)

                // Fetch tasks
                const tasksRes = await fetch("/api/tasks")
                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json()
                    const tasksArray = Array.isArray(tasksData) ? tasksData : tasksData.tasks || []
                    
                    // Filter tasks assigned to current user with status not 'done'
                    const myTasks = tasksArray.filter((task: any) => 
                        task.assignees?.some((a: any) => a._id === userData.user._id) && task.status !== 'done'
                    )
                    setAssignedToMeTasks(myTasks)
                    
                    const pendingTasks = tasksArray.filter((task: Task) => task.status !== "completed").length
                    setTasks(tasksArray)
                    setStats(prev => ({ ...prev, pendingTasks }))
                }

                // Fetch unread messages count
                const unreadRes = await fetch("/api/messages/total-unread")
                if (unreadRes.ok) {
                    const unreadData = await unreadRes.json()
                    setStats(prev => ({ ...prev, unreadMessages: unreadData.unreadMessagesCount }))
                }

                // Fetch announcements
                const announcementsRes = await fetch("/api/announcements")
                if (announcementsRes.ok) {
                    const announcementsData = await announcementsRes.json()
                    const announcementsArray = Array.isArray(announcementsData) ? announcementsData : []
                    setAnnouncements(announcementsArray)
                    setStats(prev => ({ ...prev, announcements: announcementsArray.length }))
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Refresh unread messages every 3 seconds
        const unreadInterval = setInterval(async () => {
            const unreadRes = await fetch("/api/messages/total-unread")
            if (unreadRes.ok) {
                const unreadData = await unreadRes.json()
                setStats(prev => ({ ...prev, unreadMessages: unreadData.unreadMessagesCount }))
            }
        }, 3000)

        return () => clearInterval(unreadInterval)
    }, [])

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent"></div></div>
    }

    return (
        <div className="p-6 space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        سلام، {user?.name || "کاربر گرامی"} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        به داشبورد مدیریتی خوش آمدید. امروز {new Date().toLocaleDateString('fa-IR')} است.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tasks">
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                            <CheckSquare className="w-4 h-4 ml-2" />
                            وظایف جدید
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">وظایف در انتظار</CardTitle>
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            ۳ وظیفه با اولویت بالا
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">پیام‌های نخوانده</CardTitle>
                        <MessageSquare className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.unreadMessages}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            از ۳ گفتگو
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">اطلاعیه‌های جدید</CardTitle>
                        <Megaphone className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.announcements}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            در هفته گذشته
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Tasks Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">وظایف من</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assignedToMeTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">هیچ وظیفه ای برای انجام وجود ندارد</p>
                                </div>
                            ) : (
                                assignedToMeTasks.slice(0, 5).map((task: any) => {
                                    const daysRemaining = task.dueDate ? calculateDaysRemaining(new Date(task.dueDate)) : null
                                    const countdown = daysRemaining !== null ? formatCountdown(daysRemaining) : null
                                    
                                    return (
                                        <div key={task._id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium">{task.title}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                                    {task.startDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> شروع: {formatJalaliDate(gregorianToJalali(new Date(task.startDate)))}
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> موعد: {formatJalaliDate(gregorianToJalali(new Date(task.dueDate)))}
                                                        </span>
                                                    )}
                                                </div>
                                                {countdown && (
                                                    <div className="flex gap-2 items-center mt-2">
                                                        <Badge className={`text-xs ${
                                                            countdown.status === 'expired'
                                                                ? 'bg-red-600 hover:bg-red-700'
                                                                : countdown.status === 'urgent'
                                                                ? 'bg-orange-600 hover:bg-orange-700'
                                                                : countdown.status === 'warning'
                                                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                                                : 'bg-green-600 hover:bg-green-700'
                                                        }`}>
                                                            {countdown.display}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <div className="mt-4 pt-2 text-center">
                            <Link href="/dashboard/tasks" className="text-sm text-yellow-600 hover:underline">
                                مشاهده همه وظایف
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Announcements Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">آخرین اطلاعیه‌ها</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {announcements.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">هیچ اطلاعیه‌ای موجود نیست</p>
                                </div>
                            ) : (
                                announcements.slice(0, 5).map((announcement) => (
                                    <div key={announcement._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{announcement.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {announcement.content.slice(0, 100)}...
                                        </p>
                                        <div className="mt-2 text-xs text-gray-500 flex justify-end">
                                            {new Date(announcement.createdAt).toLocaleDateString('fa-IR')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional functionality can be added here */}
        </div>
    )
}
