"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, User as UserIcon, Paperclip, X, Plus, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Message {
    _id: string
    content: string
    sender: {
        _id: string
        name: string
        avatar?: string
    }
    receiver?: {
        _id: string
        name: string
        avatar?: string
    }
    createdAt: string
    type: "text" | "file" | "image"
    fileUrl?: string
}

interface ChatGroup {
    _id: string
    name: string
    description?: string
    image?: string
    admin: any
    members: any[]
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [groups, setGroups] = useState<ChatGroup[]>([])
    const [selectedChatType, setSelectedChatType] = useState<"group" | "direct">("group")
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [viewMode, setViewMode] = useState<"list" | "chat">("list")
    const [newMessage, setNewMessage] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
    const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<any>(null)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [unreadCounts, setUnreadCounts] = useState<{ direct: Record<string, number>; group: Record<string, number>; public: number }>({ direct: {}, group: {}, public: 0 })
    const { toast } = useToast()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [newGroup, setNewGroup] = useState({
        name: "",
        description: ""
    })

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        // Current user
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => setCurrentUser(data.user))
            .catch(console.error)

        fetchUsers()
        fetchGroups()
        fetchUnreadCounts()

        // Refresh unread counts periodically
        const unreadInterval = setInterval(fetchUnreadCounts, 2000)
        return () => clearInterval(unreadInterval)
    }, [])

    useEffect(() => {
        if (viewMode !== "chat") return

        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [selectedGroup, selectedChatType, selectedUser?._id, viewMode])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchUsers = async () => {
        const res = await fetch("/api/users")
        if (res.ok) {
            setUsers(await res.json())
        }
    }

    const fetchGroups = async () => {
        const res = await fetch("/api/chat-groups")
        if (res.ok) {
            setGroups(await res.json())
            setLoading(false)
        }
    }

    const fetchUnreadCounts = async () => {
        const res = await fetch("/api/messages/unread-count")
        if (res.ok) {
            setUnreadCounts(await res.json())
        }
    }

    const fetchMessages = async () => {
        try {
            let url = ""

            if (selectedChatType === "direct") {
                if (!selectedUser?._id) return
                url = `/api/direct-messages?userId=${selectedUser._id}`
            } else {
                if (!selectedGroup) return
                url = "/api/chat"
                if (selectedGroup !== "public") {
                    url = `/api/group-messages?groupId=${selectedGroup}`
                }
            }

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const selectGroup = (groupId: string) => {
        setSelectedChatType("group")
        setSelectedUser(null)
        setSelectedGroup(groupId)
        setViewMode("chat")
        setMessages([])
        setLoading(true)
    }

    const selectUser = (user: any) => {
        setSelectedChatType("direct")
        setSelectedGroup(null)
        setSelectedUser(user)
        setViewMode("chat")
        setMessages([])
        setLoading(true)
    }

    const backToList = () => {
        setViewMode("list")
        setSelectedGroup(null)
        setSelectedUser(null)
        setMessages([])
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() && !selectedFile) return

        setSending(true)
        try {
            let fileUrl = ""
            let type = "text"

            // اگر فائل انتخاب شده
            if (selectedFile) {
                const formData = new FormData()
                formData.append("file", selectedFile)

                const uploadRes = await fetch("/api/chat/upload", {
                    method: "POST",
                    body: formData,
                })

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    fileUrl = uploadData.url
                    type = selectedFile.type.startsWith("image/") ? "image" : "file"
                }
            }

            let url = "/api/chat"
            let body: any = { 
                content: newMessage || (selectedFile?.name || "File"), 
                type: type,
                fileUrl
            }

            if (selectedChatType === "direct") {
                if (!selectedUser?._id) return
                url = "/api/direct-messages"
                body.receiverId = selectedUser._id
            } else if (selectedGroup !== "public") {
                url = "/api/group-messages"
                body.groupId = selectedGroup
            }

            console.log("Sending message:", { url, body })

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                setNewMessage("")
                setSelectedFile(null)
                setPreviewUrl(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
                fetchMessages()
                fetchUnreadCounts()
                toast({
                    title: "موفق",
                    description: "پیام ارسال شد"
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "خطا",
                    description: errorData.message || "خطا در ارسال پیام",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "خطا",
                description: "خطایی در ارسال پیام رخ داد",
                variant: "destructive"
            })
        } finally {
            setSending(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroup.name) return

        const res = await fetch("/api/chat-groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newGroup,
                memberIds: selectedMembers
            })
        })

        if (res.ok) {
            setIsNewGroupOpen(false)
            fetchGroups()
            setNewGroup({ name: "", description: "" })
            setSelectedMembers([])
            toast({
                title: "موفق",
                description: "گروه چت ایجاد شد"
            })
        }
    }

    const handleEditGroup = (group: ChatGroup) => {
        setEditingGroup(group)
        setSelectedMembers(group.members.map(m => m._id))
        setIsEditGroupOpen(true)
    }

    const handleUpdateGroup = async () => {
        if (!editingGroup.name) return

        const res = await fetch("/api/chat-groups", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingGroup._id,
                name: editingGroup.name,
                description: editingGroup.description,
                memberIds: selectedMembers
            })
        })

        if (res.ok) {
            setIsEditGroupOpen(false)
            fetchGroups()
            toast({
                title: "موفق",
                description: "گروه بروز شد"
            })
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("آیا می‌خواهید این گروه و تمام پیام‌ها و وظایف آن را حذف کنید؟")) return

        const res = await fetch(`/api/chat-groups?id=${groupId}`, {
            method: "DELETE"
        })

        if (res.ok) {
            if (selectedGroup === groupId) {
                backToList()
            }
            fetchGroups()
            toast({
                title: "موفق",
                description: "گروه و تمام محتویات آن حذف شد"
            })
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            
            // تصویر کا preview دکھایں
            if (file.type.startsWith("image/")) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    setPreviewUrl(e.target?.result as string)
                }
                reader.readAsDataURL(file)
            }
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const directUsers = currentUser ? users.filter(u => u._id !== currentUser._id) : users

    return (
        <div className="h-[calc(100vh-5rem)] p-4 md:p-6 flex flex-col">
            {viewMode === "list" ? (
                // List View - Show all groups
                <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-md">
                    <CardHeader className="bg-white dark:bg-card border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold">گفتگوها</CardTitle>
                            {(currentUser?.role === "مدیر" || currentUser?.role === "admin") && (
                                <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                                            <Plus className="w-4 h-4" />
                                            گروه جدید
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle>ایجاد گروه چت جدید</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>نام گروه</Label>
                                                <Input
                                                    value={newGroup.name}
                                                    onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                                    placeholder="نام گروه"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>توضیحات</Label>
                                                <Textarea
                                                    value={newGroup.description}
                                                    onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                                    placeholder="توضیحات گروه"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>اعضا</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                                                    {users.map(u => (
                                                        <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMembers.includes(u._id)}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setSelectedMembers([...selectedMembers, u._id])
                                                                    } else {
                                                                        setSelectedMembers(selectedMembers.filter(id => id !== u._id))
                                                                    }
                                                                }}
                                                            />
                                                            <span>{u.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateGroup}>ایجاد</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center text-gray-500 mt-10">در حال بارگذاری...</div>
                        ) : (
                            <>
                                {/* Public Chat */}
                                <Card 
                                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-yellow-500"
                                    onClick={() => selectGroup("public")}
                                >
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">گفتگو عمومی تیم</h3>
                                            <p className="text-sm text-gray-500">چت عمومی برای تمام اعضای تیم</p>
                                        </div>
                                        {(unreadCounts.public || 0) > 0 && (
                                            <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold">
                                                {(unreadCounts.public || 0) > 99 ? "99+" : (unreadCounts.public || 0)}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Direct Messages */}
                                <div className="pt-2">
                                    <h3 className="text-sm font-semibold text-gray-600 mb-2">گفتگوهای خصوصی</h3>
                                    {directUsers.length === 0 ? (
                                        <div className="text-center text-gray-500 py-6">عضوی برای گفتگو وجود ندارد.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {directUsers.map(user => {
                                                const unreadCount = unreadCounts.direct[user._id] || 0
                                                return (
                                                    <Card
                                                        key={user._id}
                                                        className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-yellow-500"
                                                        onClick={() => selectUser(user)}
                                                    >
                                                        <CardContent className="p-4 flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                {user.avatar ? (
                                                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserIcon className="w-5 h-5 text-white" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-bold text-base">{user.name}</h3>
                                                                <p className="text-xs text-gray-500">{user.jobTitle || "عضو تیم"}</p>
                                                            </div>
                                                            {unreadCount > 0 && (
                                                                <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold">
                                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Groups */}
                                {groups.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10">
                                        هیچ گروهی وجود ندارد. {(currentUser?.role === "مدیر" || currentUser?.role === "admin") && "گروه جدید ایجاد کنید!"}
                                    </div>
                                ) : (
                                    groups.map(group => {
                                        const unreadCount = unreadCounts.group[group._id] || 0
                                        return (
                                            <Card 
                                                key={group._id}
                                                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-yellow-500"
                                                onClick={() => selectGroup(group._id)}
                                            >
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {group.image ? (
                                                            <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-7 h-7 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg">{group.name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {group.description || "بدون توضیحات"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {group.members?.length || 0} عضو
                                                        </p>
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold">
                                                            {unreadCount > 99 ? "99+" : unreadCount}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            ) : (
                // Chat View - Show selected chat
                <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-white dark:bg-card border-b z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={backToList}
                                className="gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                بازگشت
                            </Button>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <CardTitle className="text-lg">
                                {selectedChatType === "direct"
                                    ? selectedUser?.name || "گفتگو خصوصی"
                                    : selectedGroup === "public" 
                                        ? "گفتگو عمومی تیم" 
                                        : groups.find(g => g._id === selectedGroup)?.name || "گروه"
                                }
                            </CardTitle>
                        </div>

                        <div className="flex gap-2">
                            {selectedGroup !== "public" && selectedGroup && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const group = groups.find(g => g._id === selectedGroup)
                                            if (group) handleEditGroup(group)
                                        }}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => selectedGroup && handleDeleteGroup(selectedGroup)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* Edit Group Dialog */}
                {editingGroup && (
                    <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>ویرایش گروه</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>نام گروه</Label>
                                    <Input
                                        value={editingGroup.name}
                                        onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>توضیحات</Label>
                                    <Textarea
                                        value={editingGroup.description || ""}
                                        onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>اعضا</Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                                        {users.map(u => (
                                            <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.includes(u._id)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedMembers([...selectedMembers, u._id])
                                                        } else {
                                                            setSelectedMembers(selectedMembers.filter(id => id !== u._id))
                                                        }
                                                    }}
                                                />
                                                <span>{u.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditGroupOpen(false)}>لغو</Button>
                                <Button onClick={handleUpdateGroup}>بروزرسانی</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-zinc-900/50">
                    {loading ? (
                        <div className="text-center text-gray-500 mt-10">در حال بارگذاری پیام‌ها...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">هنوز پیامی وجود ندارد. گفتگو را آغاز کنید!</div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = currentUser && msg.sender._id === currentUser._id
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4`}
                                >
                                    <div className={`flex flex-col max-w-[80%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {!isMe && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {msg.sender.avatar ? (
                                                        <img 
                                                            src={msg.sender.avatar} 
                                                            alt={msg.sender.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserIcon className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-500 font-medium">
                                                {isMe ? "شما" : msg.sender.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {msg.type === "image" && msg.fileUrl ? (
                                            <div className={`p-2 rounded-2xl shadow-sm ${isMe ? "rounded-tr-none" : "rounded-tl-none"}`}>
                                                <img 
                                                    src={msg.fileUrl} 
                                                    alt="پیام تصویری"
                                                    className="max-w-sm rounded-lg max-h-96 object-cover"
                                                />
                                                {msg.content && msg.content !== "File" && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 px-2">{msg.content}</p>
                                                )}
                                            </div>
                                        ) : msg.type === "file" && msg.fileUrl ? (
                                            <div className={`p-3 rounded-2xl shadow-sm flex items-center gap-2 ${isMe ? "bg-yellow-500 text-black rounded-tr-none" : "bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-tl-none"}`}>
                                                <a 
                                                    href={msg.fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium underline hover:opacity-80"
                                                >
                                                    {msg.content}
                                                </a>
                                            </div>
                                        ) : (
                                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? "bg-yellow-500 text-black rounded-tr-none" : "bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-tl-none"}`}>
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 bg-white dark:bg-card border-t space-y-3">
                    {previewUrl && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                            <img 
                                src={previewUrl} 
                                alt="پیش‌نمایش"
                                className="h-16 w-16 rounded object-cover"
                            />
                            <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                                {selectedFile?.name}
                            </span>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={removeFile}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="w-5 h-5 text-gray-500" />
                        </Button>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="پیام خود را بنویسید..."
                            className="flex-1 bg-gray-50 dark:bg-zinc-900"
                            disabled={sending}
                        />
                        <Button
                            type="submit"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black shrink-0"
                            disabled={sending || (!newMessage.trim() && !selectedFile)}
                        >
                            <Send className="w-5 h-5" />
                            <span className="sr-only">ارسال</span>
                        </Button>
                    </form>
                </div>
                </Card>
            )}
        </div>
    )
}
