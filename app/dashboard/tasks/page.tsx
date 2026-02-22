"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Clock, Calendar, AlertTriangle, Plus, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { gregorianToJalali, calculateDaysRemaining, formatCountdown, formatJalaliDate } from "@/lib/jalali"
import { JalaliDatePicker } from "@/components/jalali-date-picker"

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const { toast } = useToast()

    // New Task Form
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assigneeIds: [] as string[],
        priority: "medium",
        startDate: "",
        dueDate: ""
    })

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => setUser(data.user))

        fetchTasks()
        fetchUsers()
    }, [])

    const fetchTasks = async () => {
        const res = await fetch("/api/tasks")
        if (res.ok) {
            setTasks(await res.json())
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        const res = await fetch("/api/users")
        if (res.ok) setUsers(await res.json())
    }

    const handleCreateTask = async () => {
        if (!newTask.title || newTask.assigneeIds.length === 0) {
            toast({
                title: "خطا",
                description: "عنوان و حداقل یک نفر را انتخاب کنید",
                variant: "destructive"
            })
            return
        }

        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask)
        })

        if (res.ok) {
            setIsNewTaskOpen(false)
            fetchTasks()
            setNewTask({ title: "", description: "", assigneeIds: [], priority: "medium", startDate: "", dueDate: "" })
            toast({
                title: "موفق",
                description: "وظیفه ایجاد شد"
            })
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        const res = await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: taskId, status: newStatus })
        })

        if (res.ok) {
            fetchTasks()
        }
    }

    const handleEditTask = (task: any) => {
        setEditingTask(JSON.parse(JSON.stringify(task)))
        setIsEditOpen(true)
    }

    const handleUpdateTask = async () => {
        if (!editingTask.title) return

        const res = await fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingTask._id,
                title: editingTask.title,
                description: editingTask.description,
                assigneeIds: editingTask.assignees?.map((a: any) => a._id || a) || [],
                priority: editingTask.priority,
                startDate: editingTask.startDate,
                dueDate: editingTask.dueDate
            })
        })

        if (res.ok) {
            setIsEditOpen(false)
            fetchTasks()
            toast({
                title: "موفق",
                description: "وظیفه بروز شد"
            })
        } else {
            toast({
                title: "خطا",
                description: "خطا در بروزرسانی",
                variant: "destructive"
            })
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("آیا می‌خواهید این وظیفه را حذف کنید؟")) return

        const res = await fetch(`/api/tasks?id=${taskId}`, {
            method: "DELETE"
        })

        if (res.ok) {
            fetchTasks()
            toast({
                title: "موفق",
                description: "وظیفه حذف شد"
            })
        } else {
            toast({
                title: "خطا",
                description: "خطا در حذف",
                variant: "destructive"
            })
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-red-100 text-red-800"
            case "medium": return "bg-yellow-100 text-yellow-800"
            case "low": return "bg-green-100 text-green-800"
            default: return "bg-gray-100"
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">مدیریت وظایف</h1>
                    <p className="text-gray-500">وظایف خود و تیم را مدیریت کنید</p>
                </div>

                {(user?.role === "مدیر" || user?.role === "admin") && (
                    <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                                <Plus className="w-4 h-4" />
                                وظیفه جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[900px] max-h-[80vh]">
                            <DialogHeader>
                                <DialogTitle>ایجاد وظیفه جدید</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>عنوان</Label>
                                        <Input
                                            value={newTask.title}
                                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>اولویت</Label>
                                        <Select
                                            defaultValue="medium"
                                            onValueChange={v => setNewTask({ ...newTask, priority: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">پایین</SelectItem>
                                                <SelectItem value="medium">متوسط</SelectItem>
                                                <SelectItem value="high">بالا</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>توضیحات</Label>
                                    <Textarea
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>تاریخ شروع</Label>
                                        <JalaliDatePicker
                                            value={newTask.startDate}
                                            onDateChange={(date) => setNewTask({ ...newTask, startDate: date })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>تاریخ پایان</Label>
                                        <JalaliDatePicker
                                            value={newTask.dueDate}
                                            onDateChange={(date) => setNewTask({ ...newTask, dueDate: date })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>مسئولین انجام</Label>
                                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                        {users.map(u => (
                                            <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newTask.assigneeIds.includes(u._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewTask({ ...newTask, assigneeIds: [...newTask.assigneeIds, u._id] })
                                                        } else {
                                                            setNewTask({ ...newTask, assigneeIds: newTask.assigneeIds.filter(id => id !== u._id) })
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span>{u.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTask}>ایجاد وظیفه</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Edit Task Dialog */}
            {(user?.role === "مدیر" || user?.role === "admin" || (editingTask?.createdBy?._id || editingTask?.createdBy) === user?._id) && editingTask && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-[900px] max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>ویرایش وظیفه</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>عنوان</Label>
                                    <Input
                                        value={editingTask.title}
                                        onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>اولویت</Label>
                                    <Select
                                        value={editingTask.priority}
                                        onValueChange={v => setEditingTask({ ...editingTask, priority: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">پایین</SelectItem>
                                            <SelectItem value="medium">متوسط</SelectItem>
                                            <SelectItem value="high">بالا</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>توضیحات</Label>
                                <Textarea
                                    value={editingTask.description}
                                    onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>تاریخ شروع</Label>
                                    <JalaliDatePicker
                                        value={editingTask.startDate}
                                        onDateChange={(date) => setEditingTask({ ...editingTask, startDate: date })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>تاریخ پایان</Label>
                                    <JalaliDatePicker
                                        value={editingTask.dueDate}
                                        onDateChange={(date) => setEditingTask({ ...editingTask, dueDate: date })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>مسئولین انجام</Label>
                                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {users.map(u => (
                                        <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(editingTask.assignees || []).some((a: any) => (a._id || a) === u._id)}
                                                onChange={(e) => {
                                                    const currentAssignees = editingTask.assignees || []
                                                    if (e.target.checked) {
                                                        setEditingTask({ ...editingTask, assignees: [...currentAssignees, u] })
                                                    } else {
                                                        setEditingTask({ 
                                                            ...editingTask, 
                                                            assignees: currentAssignees.filter((a: any) => (a._id || a) !== u._id) 
                                                        })
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>لغو</Button>
                            <Button onClick={handleUpdateTask}>به روزرسانی</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>در حال بارگذاری...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-gray-500 col-span-full text-center py-10">هیچ وظیفه‌ای وجود ندارد.</p>
                ) : (
                    tasks.map(task => (
                        <Card key={task._id} className="relative overflow-hidden group hover:shadow-md transition-all">
                            <div className={`absolute top-0 right-0 w-1 h-full ${task.priority === 'high' ? 'bg-red-500' :
                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />

                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                        {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'معمولی' : 'پایین'}
                                    </Badge>
                                    {task.status === 'done' ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">انجام شده</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">در جریان</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-lg mt-2 leading-tight">{task.title}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-1">
                                    {task.description || "بدون توضیحات"}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="flex flex-col gap-3 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>مسئولین: {task.assignees?.map((a: any) => a.name).join('، ') || "نامشخص"}</span>
                                    </div>
                                    {task.startDate && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>شروع: {formatJalaliDate(gregorianToJalali(new Date(task.startDate)))}</span>
                                        </div>
                                    )}
                                    {task.dueDate && (
                                        <div className="flex items-center gap-2 justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>موعد: {formatJalaliDate(gregorianToJalali(new Date(task.dueDate)))}</span>
                                            </div>
                                            {task.status !== 'done' && (
                                                <Badge className={`text-xs ${
                                                    formatCountdown(calculateDaysRemaining(new Date(task.dueDate))).status === 'expired'
                                                        ? 'bg-red-600 hover:bg-red-700'
                                                        : formatCountdown(calculateDaysRemaining(new Date(task.dueDate))).status === 'urgent'
                                                        ? 'bg-orange-600 hover:bg-orange-700'
                                                        : formatCountdown(calculateDaysRemaining(new Date(task.dueDate))).status === 'warning'
                                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                }`}>
                                                    {formatCountdown(calculateDaysRemaining(new Date(task.dueDate))).display}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    {task.status !== 'done' && (
                                        <Button
                                            size="sm"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleStatusChange(task._id, 'done')}
                                        >
                                            انجام شد
                                        </Button>
                                    )}
                                    {task.status === 'done' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleStatusChange(task._id, 'pending')}
                                        >
                                            بازگردانی
                                        </Button>
                                    )}
                                    {(user?.role === "مدیر" || user?.role === "admin" || (task.createdBy?._id || task.createdBy) === user?._id) && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-full"
                                                onClick={() => handleEditTask(task)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {(user?.role === "مدیر" || user?.role === "admin" || (task.createdBy?._id || task.createdBy) === user?._id) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-full"
                                                    onClick={() => handleDeleteTask(task._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
