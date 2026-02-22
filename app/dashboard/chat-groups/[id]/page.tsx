"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Plus, Edit, Trash2, Clock, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useParams } from "next/navigation"

interface ChatGroup {
    _id: string
    name: string
    description?: string
    admin: any
    members: any[]
}

interface Message {
    _id: string
    sender: any
    content: string
    type: string
    createdAt: string
}

interface Task {
    _id: string
    title: string
    description?: string
    assignedTo: any
    priority: string
    dueDate?: string
    status: string
}

export default function ChatGroupPage() {
    const params = useParams()
    const groupId = params.id as string

    const [group, setGroup] = useState<ChatGroup | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [messageInput, setMessageInput] = useState("")
    const [isTaskOpen, setIsTaskOpen] = useState(false)
    const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any>(null)
    const { toast } = useToast()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assignedToId: "",
        dueDate: "",
        priority: "medium"
    })

    useEffect(() => {
        fetchData()
        const interval = setInterval(() => {
            fetchMessages()
            fetchTasks()
        }, 2000)

        return () => clearInterval(interval)
    }, [groupId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const fetchData = async () => {
        fetchUser()
        await Promise.all([fetchGroup(), fetchMessages(), fetchTasks(), fetchUsers()])
        setLoading(false)
    }

    const fetchUser = async () => {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
            const data = await res.json()
            setUser(data.user)
        }
    }

    const fetchGroup = async () => {
        const res = await fetch(`/api/chat-groups`)
        if (res.ok) {
            const data = await res.json()
            const g = data.find((g: any) => g._id === groupId)
            setGroup(g)
        }
    }

    const fetchMessages = async () => {
        const res = await fetch(`/api/group-messages?groupId=${groupId}`)
        if (res.ok) {
            setMessages(await res.json())
        }
    }

    const fetchTasks = async () => {
        const res = await fetch(`/api/chat-group-tasks?groupId=${groupId}`)
        if (res.ok) {
            setTasks(await res.json())
        }
    }

    const fetchUsers = async () => {
        const res = await fetch("/api/users")
        if (res.ok) {
            setUsers(await res.json())
        }
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return

        const res = await fetch("/api/group-messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                groupId,
                content: messageInput,
                type: "text"
            })
        })

        if (res.ok) {
            setMessageInput("")
            fetchMessages()
        }
    }

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assignedToId) return

        const res = await fetch("/api/chat-group-tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chatGroupId: groupId,
                ...newTask
            })
        })

        if (res.ok) {
            setIsTaskOpen(false)
            fetchTasks()
            setNewTask({ title: "", description: "", assignedToId: "", dueDate: "", priority: "medium" })
            toast({
                title: "موفق",
                description: "وظیفه اضافه شد و نوتیفیکشن ارسال شد"
            })
        }
    }

    const handleUpdateTask = async () => {
        if (!editingTask.title) return

        const res = await fetch("/api/chat-group-tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingTask._id,
                title: editingTask.title,
                description: editingTask.description,
                assignedToId: editingTask.assignedTo?._id,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate
            })
        })

        if (res.ok) {
            setIsEditTaskOpen(false)
            fetchTasks()
            toast({
                title: "موفق",
                description: "وظیفه بروز شد"
            })
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("آیا این وظیفه را حذف کنید؟")) return

        const res = await fetch(`/api/chat-group-tasks?id=${taskId}`, {
            method: "DELETE"
        })

        if (res.ok) {
            fetchTasks()
            toast({
                title: "موفق",
                description: "وظیفه حذف شد"
            })
        }
    }

    if (loading) {
        return <div className="p-6 flex justify-center">درحال بارگذاری...</div>
    }

    if (!group) {
        return <div className="p-6">گروه پیدا نشد</div>
    }

    const canCreateTask = group.admin._id === user?._id

    return (
        <div className="p-6 h-screen flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <p className="text-gray-500 text-sm">{group.members.length} عضو</p>
            </div>

            <Tabs defaultValue="messages" className="flex-1 flex flex-col">
                <TabsList>
                    <TabsTrigger value="messages">پیام‌ها</TabsTrigger>
                    <TabsTrigger value="tasks">وظایف</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 dark:bg-gray-900 rounded p-4">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-500">هیچ پیام‌ی وجود ندارد</p>
                        ) : (
                            messages.map(msg => (
                                <div key={msg._id} className="flex gap-2">
                                    {msg.sender.avatar && (
                                        <img
                                            src={msg.sender.avatar}
                                            alt={msg.sender.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <p className="text-xs font-semibold">{msg.sender.name}</p>
                                        <div className="bg-white dark:bg-gray-800 rounded p-2 max-w-xs">
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(msg.createdAt).toLocaleTimeString('fa-IR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="پیام خود را بنویسید..."
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} size="icon" className="bg-yellow-500 hover:bg-yellow-600">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 flex flex-col space-y-4">
                    {canCreateTask && (
                        <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                                    <Plus className="w-4 h-4" />
                                    وظیفه جدید
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>اضافه کردن وظیفه</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>عنوان</Label>
                                        <Input
                                            value={newTask.title}
                                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>توضیحات</Label>
                                        <Textarea
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>برای</Label>
                                            <Select value={newTask.assignedToId} onValueChange={v => setNewTask({ ...newTask, assignedToId: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="انتخاب کنید" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {group.members.map(member => (
                                                        <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>اولویت</Label>
                                            <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
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
                                        <Label>تاریخ پایان</Label>
                                        <Input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateTask}>اضافه کنید</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Edit Task Dialog */}
                    {editingTask && (
                        <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>ویرایش وظیفه</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>عنوان</Label>
                                        <Input
                                            value={editingTask.title}
                                            onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>توضیحات</Label>
                                        <Textarea
                                            value={editingTask.description || ""}
                                            onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>برای</Label>
                                            <Select value={editingTask.assignedTo?._id} onValueChange={v => setEditingTask({ ...editingTask, assignedTo: { ...editingTask.assignedTo, _id: v } })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {group.members.map(member => (
                                                        <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>اولویت</Label>
                                            <Select value={editingTask.priority} onValueChange={v => setEditingTask({ ...editingTask, priority: v })}>
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
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>لغو</Button>
                                    <Button onClick={handleUpdateTask}>بروزرسانی</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Tasks List */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {tasks.length === 0 ? (
                            <p className="text-center text-gray-500">هیچ وظیفه‌ای وجود ندارد</p>
                        ) : (
                            tasks.map(task => (
                                <Card key={task._id}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold">{task.title}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                                            </div>
                                            {canCreateTask && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingTask(task)
                                                            setIsEditTaskOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteTask(task._id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3 text-xs flex-wrap">
                                            <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                                {task.assignedTo.name}
                                            </span>
                                            {task.priority === 'high' && (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">فوری</span>
                                            )}
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.dueDate).toLocaleDateString('fa-IR')}
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 rounded ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {task.status === 'done' ? 'انجام شده' : 'در حال انجام'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
