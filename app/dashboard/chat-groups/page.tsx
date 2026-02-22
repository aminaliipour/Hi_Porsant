"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, MessageCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface ChatGroup {
    _id: string
    name: string
    description?: string
    image?: string
    admin: any
    members: any[]
}

export default function ChatGroupsPage() {
    const [groups, setGroups] = useState<ChatGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<any>(null)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const { toast } = useToast()

    const [newGroup, setNewGroup] = useState({
        name: "",
        description: ""
    })

    useEffect(() => {
        fetchUser()
        fetchGroups()
        fetchUsers()
    }, [])

    const fetchUser = async () => {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
            const data = await res.json()
            setUser(data.user)
        }
    }

    const fetchGroups = async () => {
        const res = await fetch("/api/chat-groups")
        if (res.ok) {
            setGroups(await res.json())
        }
        setLoading(false)
    }

    const fetchUsers = async () => {
        const res = await fetch("/api/users")
        if (res.ok) {
            setUsers(await res.json())
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
            setIsNewOpen(false)
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
        setIsEditOpen(true)
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
            setIsEditOpen(false)
            fetchGroups()
            toast({
                title: "موفق",
                description: "گروه بروز شد"
            })
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("آیا می‌خواهید این گروه را حذف کنید؟")) return

        const res = await fetch(`/api/chat-groups?id=${groupId}`, {
            method: "DELETE"
        })

        if (res.ok) {
            fetchGroups()
            toast({
                title: "موفق",
                description: "گروه حذف شد"
            })
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">گروه‌های چت</h1>
                    <p className="text-gray-500">ایجاد و مدیریت گروه‌های گفتگو</p>
                </div>

                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
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
            </div>

            {/* Edit Group Dialog */}
            {editingGroup && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>لغو</Button>
                            <Button onClick={handleUpdateGroup}>بروزرسانی</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>در حال بارگذاری...</p>
                ) : groups.length === 0 ? (
                    <p className="text-gray-500 col-span-full">هیچ گروهی وجود ندارد</p>
                ) : (
                    groups.map(group => (
                        <Card key={group._id} className="hover:shadow-lg transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{group.name}</CardTitle>
                                        <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">اعضا ({group.members.length})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {group.members.slice(0, 3).map(member => (
                                            <span key={member._id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {member.name}
                                            </span>
                                        ))}
                                        {group.members.length > 3 && (
                                            <span className="text-xs text-gray-500">+{group.members.length - 3} نفر دیگر</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t">
                                    <Link href={`/dashboard/chat-groups/${group._id}`} className="flex-1">
                                        <Button size="sm" variant="default" className="w-full gap-1 bg-blue-600 hover:bg-blue-700">
                                            <MessageCircle className="w-4 h-4" />
                                            باز کردن
                                        </Button>
                                    </Link>
                                    {group.admin._id === user?._id && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditGroup(group)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteGroup(group._id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
