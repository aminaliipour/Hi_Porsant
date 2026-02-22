"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Plus, Calendar, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
    const { toast } = useToast()
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", targetAudience: "all", selectedUsers: [] as string[] })

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => setUser(data.user))
            .catch(err => console.error("Error fetching user:", err))
        fetchUsers()
        fetchAnnouncements()
    }, [])

    const fetchUsers = async () => {
        const res = await fetch("/api/users")
        if (res.ok) {
            setUsers(await res.json())
        }
    }

    const fetchAnnouncements = async () => {
        const res = await fetch("/api/announcements")
        if (res.ok) {
            setAnnouncements(await res.json())
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return

        // Validate that at least one recipient is selected when "specific" is chosen
        if (newAnnouncement.targetAudience === "specific" && (!newAnnouncement.selectedUsers || newAnnouncement.selectedUsers.length === 0)) {
            toast({
                title: "خطا",
                description: "لطفاً حداقل یک مخاطب انتخاب کنید",
                variant: "destructive"
            })
            return
        }

        const payload = {
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            targetAudience: newAnnouncement.targetAudience === "all" ? "all" : newAnnouncement.selectedUsers
        }

        const res = await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            setIsNewOpen(false)
            fetchAnnouncements()
            setNewAnnouncement({ title: "", content: "", targetAudience: "all", selectedUsers: [] })
            toast({
                title: "موفق",
                description: "اطلاعیه منتشر شد"
            })
        }
    }

    const handleEditAnnouncement = (ann: any) => {
        const announcement = JSON.parse(JSON.stringify(ann))
        // Convert targetAudience to proper format for editing
        if (Array.isArray(announcement.targetAudience)) {
            announcement.selectedUsers = announcement.targetAudience
            announcement.targetAudience = "specific"
        } else if (announcement.targetAudience === "all") {
            announcement.selectedUsers = []
        } else {
            // Single ID (old format)
            announcement.selectedUsers = announcement.targetAudience ? [announcement.targetAudience] : []
            announcement.targetAudience = announcement.targetAudience ? "specific" : "all"
        }
        setEditingAnnouncement(announcement)
        setIsEditOpen(true)
    }

    const handleUpdateAnnouncement = async () => {
        if (!editingAnnouncement.title || !editingAnnouncement.content) return

        // Validate that at least one recipient is selected
        if (editingAnnouncement.targetAudience === "specific" && (!editingAnnouncement.selectedUsers || editingAnnouncement.selectedUsers.length === 0)) {
            toast({
                title: "خطا",
                description: "لطفاً حداقل یک مخاطب انتخاب کنید",
                variant: "destructive"
            })
            return
        }

        const payload: any = {
            id: editingAnnouncement._id,
            title: editingAnnouncement.title,
            content: editingAnnouncement.content,
            targetAudience: editingAnnouncement.targetAudience === "all" 
                ? "all" 
                : editingAnnouncement.selectedUsers
        }

        const res = await fetch("/api/announcements", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            setIsEditOpen(false)
            fetchAnnouncements()
            toast({
                title: "موفق",
                description: "اطلاعیه بروز شد"
            })
        } else {
            toast({
                title: "خطا",
                description: "خطا در بروزرسانی",
                variant: "destructive"
            })
        }
    }

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm("آیا می‌خواهید این اطلاعیه را حذف کنید؟")) return

        const res = await fetch(`/api/announcements?id=${id}`, {
            method: "DELETE"
        })

        if (res.ok) {
            fetchAnnouncements()
            toast({
                title: "موفق",
                description: "اطلاعیه حذف شد"
            })
        } else {
            toast({
                title: "خطا",
                description: "خطا در حذف",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">تابلو اعلانات</h1>
                    <p className="text-gray-500">اخبار و اطلاعیه‌های مهم سازمانی</p>
                </div>

                {(user?.role === "مدیر" || user?.role === "admin") && (
                    <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                                <Plus className="w-4 h-4" />
                                اطلاعیه جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>ایجاد اطلاعیه جدید</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>عنوان</Label>
                                    <Input
                                        value={newAnnouncement.title}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>متن اطلاعیه</Label>
                                    <Textarea
                                        className="h-32"
                                        value={newAnnouncement.content}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>مخاطبان</Label>
                                    <div className="border rounded-md p-3 space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                                            <input
                                                type="checkbox"
                                                checked={newAnnouncement.targetAudience === "all"}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewAnnouncement({ ...newAnnouncement, targetAudience: "all", selectedUsers: [] })
                                                    } else {
                                                        setNewAnnouncement({ ...newAnnouncement, targetAudience: "specific" })
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span>همگی</span>
                                        </label>
                                        <div className="border-t pt-2 max-h-40 overflow-y-auto space-y-2">
                                            {users.map(u => (
                                                <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        disabled={newAnnouncement.targetAudience === "all"}
                                                        checked={(newAnnouncement.selectedUsers || []).includes(u._id)}
                                                        onChange={(e) => {
                                                            const currentUsers = newAnnouncement.selectedUsers || []
                                                            if (e.target.checked) {
                                                                setNewAnnouncement({ 
                                                                    ...newAnnouncement, 
                                                                    targetAudience: "specific",
                                                                    selectedUsers: [...currentUsers, u._id] 
                                                                })
                                                            } else {
                                                                setNewAnnouncement({ 
                                                                    ...newAnnouncement, 
                                                                    selectedUsers: currentUsers.filter(id => id !== u._id) 
                                                                })
                                                            }
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className={newAnnouncement.targetAudience === "all" ? "text-gray-400" : ""}>{u.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>انتشار</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <p>در حال بارگذاری...</p>
                ) : announcements.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">اطلاعیه‌ای وجود ندارد.</p>
                ) : (
                    announcements.map(ann => (
                        <Card key={ann._id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <Megaphone className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{ann.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                                                <span>توسط {ann.sender?.name}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(ann.createdAt).toLocaleDateString('fa-IR')}
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {(user?.role === "مدیر" || user?.role === "admin") && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditAnnouncement(ann)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteAnnouncement(ann._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                    {ann.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Announcement Dialog */}
            {(user?.role === "مدیر" || user?.role === "admin") && editingAnnouncement && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ویرایش اطلاعیه</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>عنوان</Label>
                                <Input
                                    value={editingAnnouncement.title}
                                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>متن اطلاعیه</Label>
                                <Textarea
                                    className="h-32"
                                    value={editingAnnouncement.content}
                                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>مخاطبان</Label>
                                <div className="border rounded-md p-3 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                                        <input
                                            type="checkbox"
                                            checked={editingAnnouncement.targetAudience === "all"}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setEditingAnnouncement({ ...editingAnnouncement, targetAudience: "all", selectedUsers: [] })
                                                } else {
                                                    setEditingAnnouncement({ ...editingAnnouncement, targetAudience: "specific" })
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span>همگی</span>
                                    </label>
                                    <div className="border-t pt-2 max-h-40 overflow-y-auto space-y-2">
                                        {users.map(u => (
                                            <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    disabled={editingAnnouncement.targetAudience === "all"}
                                                    checked={editingAnnouncement.selectedUsers?.includes(u._id) || false}
                                                    onChange={(e) => {
                                                        const currentUsers = editingAnnouncement.selectedUsers || []
                                                        if (e.target.checked) {
                                                            setEditingAnnouncement({ 
                                                                ...editingAnnouncement, 
                                                                selectedUsers: [...currentUsers, u._id],
                                                                targetAudience: "specific"
                                                            })
                                                        } else {
                                                            setEditingAnnouncement({ 
                                                                ...editingAnnouncement, 
                                                                selectedUsers: currentUsers.filter((id: string) => id !== u._id)
                                                            })
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className={editingAnnouncement.targetAudience === "all" ? "text-muted-foreground" : ""}>
                                                    {u.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>لغو</Button>
                            <Button onClick={handleUpdateAnnouncement}>بروزرسانی</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
