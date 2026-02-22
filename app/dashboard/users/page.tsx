"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Trash2, Edit, Shield, User as UserIcon, Upload, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [editingRowId, setEditingRowId] = useState<string | null>(null)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [savingUserId, setSavingUserId] = useState<string | null>(null)
    const { toast } = useToast()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [formData, setFormData] = useState<any>({
        name: "",
        nationalCode: "",
        jobTitle: "",
        role: "user",
        fatherName: "",
        phoneNumber: "",
        email: "",
        education: "",
        address: "",
        cardNumber: "",
        bankAccount: "",
        avatar: null
    })
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/auth/me").then(res => res.json()).then(data => setCurrentUser(data.user))
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const res = await fetch("/api/users/manage")
        if (res.ok) {
            setUsers(await res.json())
        }
        setLoading(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setFormData((prev: any) => ({ ...prev, avatar: file }))
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const openCreateDialog = () => {
        setEditingUser(null)
        setFormData({
            name: "",
            nationalCode: "",
            jobTitle: "",
            role: "user",
            fatherName: "",
            phoneNumber: "",
            email: "",
            education: "",
            address: "",
            cardNumber: "",
            bankAccount: "",
            avatar: null
        })
        setPreviewUrl(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (user: any) => {
        setEditingUser(user)
        setFormData({
            name: user.name,
            nationalCode: user.nationalCode,
            jobTitle: user.jobTitle || "",
            role: user.role,
            fatherName: user.fatherName || "",
            phoneNumber: user.phoneNumber || "",
            email: user.email || "",
            education: user.education || "",
            address: user.address || "",
            cardNumber: user.cardNumber || "",
            bankAccount: user.bankAccount || "",
            avatar: null // Don't pre-fill file input
        })
        setPreviewUrl(user.avatar || null)
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        const data = new FormData()
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key])
            }
        })

        if (editingUser) {
            data.append("id", editingUser._id)
            const res = await fetch("/api/users/manage", {
                method: "PUT",
                body: data
            })
            if (res.ok) {
                setIsDialogOpen(false)
                fetchUsers()
            } else {
                alert("خطا در ویرایش کاربر")
            }
        } else {
            const res = await fetch("/api/users/manage", {
                method: "POST",
                body: data
            })
            if (res.ok) {
                setIsDialogOpen(false)
                fetchUsers()
            } else {
                const error = await res.json()
                alert(error.message || "خطا در ایجاد کاربر")
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("آیا از حذف این کاربر اطمینان دارید؟")) return
        const res = await fetch(`/api/users/manage?id=${id}`, { method: "DELETE" })
        if (res.ok) fetchUsers()
    }

    const handleInlineEdit = async (userId: string, field: string, value: string) => {
        setSavingUserId(userId)
        const formData = new FormData()
        formData.append("id", userId)
        formData.append(field, value)

        try {
            const res = await fetch("/api/users/manage", {
                method: "PUT",
                body: formData
            })
            if (res.ok) {
                const updatedUser = await res.json()
                setUsers(users.map(u => u._id === userId ? updatedUser : u))
                setEditingRowId(null)
                setEditingField(null)
                toast({
                    title: "موفق",
                    description: "تغییرات با موفقیت ذخیره شد",
                })
            } else {
                toast({
                    title: "خطا",
                    description: "خطا در ذخیره تغییرات",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "خطا",
                description: "خطا در ارسال درخواست",
                variant: "destructive",
            })
        } finally {
            setSavingUserId(null)
        }
    }

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.includes(searchQuery) ||
        user.nationalCode.includes(searchQuery) ||
        (user.phoneNumber && user.phoneNumber.includes(searchQuery))
    )

    if (loading && users.length === 0) return <div className="p-10 text-center">در حال بارگذاری...</div>
    if (currentUser?.role !== "admin") return <div className="p-10 text-center text-red-500">دسترسی غیرمجاز</div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
                    <p className="text-gray-500">مشاهده، ایجاد و مدیریت اعضای تیم و کاربران سیستم</p>
                </div>

                <Button onClick={openCreateDialog} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                    <UserPlus className="w-4 h-4" />
                    افزودن کاربر جدید
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                    placeholder="جستجو (نام، کد ملی، شماره تماس)..."
                    className="border-none bg-transparent focus-visible:ring-0 p-0 h-auto"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "ویرایش کاربر" : "تعریف کاربر جدید"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {/* Avatar Upload Section */}
                        <div className="md:col-span-2 flex flex-col items-center gap-4 mb-4">
                            <Avatar className="w-24 h-24 border-2 border-gray-200 dark:border-gray-700">
                                <AvatarImage src={previewUrl || ""} />
                                <AvatarFallback className="text-2xl bg-gray-100 dark:bg-zinc-800">
                                    {formData.name ? formData.name.charAt(0) : <UserIcon className="w-10 h-10 text-gray-400" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="avatar-upload" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors">
                                    <Upload className="w-4 h-4" />
                                    آپلود تصویر پروفایل
                                </Label>
                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-2">
                            <Label>نام و نام خانوادگی *</Label>
                            <Input name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>کد ملی (نام کاربری ورود) *</Label>
                            <Input name="nationalCode" value={formData.nationalCode} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>عنوان شغلی / سمت *</Label>
                            <Input name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>شماره تماس *</Label>
                            <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-2">
                            <Label>نام پدر</Label>
                            <Input name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>تحصیلات</Label>
                            <Input name="education" value={formData.education} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>ایمیل</Label>
                            <Input name="email" value={formData.email} onChange={handleInputChange} type="email" />
                        </div>
                        <div className="space-y-2">
                            <Label>نقش در سیستم</Label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={(e: any) => handleInputChange(e)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="user">کاربر عادی</option>
                                <option value="admin">مدیر سیستم</option>
                            </select>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-2">
                            <Label>شماره کارت</Label>
                            <Input name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} dir="ltr" className="text-right" placeholder="0000-0000-0000-0000" />
                        </div>
                        <div className="space-y-2">
                            <Label>شماره حساب / شبا</Label>
                            <Input name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} dir="ltr" className="text-right" />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label>آدرس سکونت</Label>
                            <Input name="address" value={formData.address} onChange={handleInputChange} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                        <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {editingUser ? "ذخیره تغییرات" : "ایجاد کاربر"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">تصویر</TableHead>
                                <TableHead className="text-right">نام کاربر</TableHead>
                                <TableHead className="text-right">کد ملی</TableHead>
                                <TableHead className="text-right">شماره تماس</TableHead>
                                <TableHead className="text-right">سمت</TableHead>
                                <TableHead className="text-center">نقش</TableHead>
                                <TableHead className="text-left pl-6">عملیات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <TableCell>
                                            <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell 
                                            className="font-medium cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-2 py-2 transition"
                                            onClick={() => {
                                                setEditingRowId(user._id)
                                                setEditingField("name")
                                            }}
                                        >
                                            {editingRowId === user._id && editingField === "name" ? (
                                                <input
                                                    type="text"
                                                    defaultValue={user.name}
                                                    autoFocus
                                                    onBlur={(e) => {
                                                        if (e.target.value !== user.name && e.target.value) {
                                                            handleInlineEdit(user._id, "name", e.target.value)
                                                        } else {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && e.currentTarget.value) {
                                                            handleInlineEdit(user._id, "name", e.currentTarget.value)
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    className="w-full px-2 py-1 border border-yellow-500 rounded bg-yellow-50 dark:bg-yellow-900/20"
                                                />
                                            ) : (
                                                savingUserId === user._id ? "..." : user.name
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{user.nationalCode}</TableCell>
                                        <TableCell 
                                            className="text-muted-foreground dir-ltr cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-2 py-2 transition"
                                            onClick={() => {
                                                setEditingRowId(user._id)
                                                setEditingField("phoneNumber")
                                            }}
                                        >
                                            {editingRowId === user._id && editingField === "phoneNumber" ? (
                                                <input
                                                    type="text"
                                                    defaultValue={user.phoneNumber || ""}
                                                    autoFocus
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (user.phoneNumber || "")) {
                                                            handleInlineEdit(user._id, "phoneNumber", e.target.value)
                                                        } else {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleInlineEdit(user._id, "phoneNumber", e.currentTarget.value)
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    className="w-full px-2 py-1 border border-yellow-500 rounded bg-yellow-50 dark:bg-yellow-900/20 text-left"
                                                />
                                            ) : (
                                                savingUserId === user._id ? "..." : (user.phoneNumber || "-")
                                            )}
                                        </TableCell>
                                        <TableCell 
                                            className="cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-2 py-2 transition"
                                            onClick={() => {
                                                setEditingRowId(user._id)
                                                setEditingField("jobTitle")
                                            }}
                                        >
                                            {editingRowId === user._id && editingField === "jobTitle" ? (
                                                <input
                                                    type="text"
                                                    defaultValue={user.jobTitle || ""}
                                                    autoFocus
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (user.jobTitle || "")) {
                                                            handleInlineEdit(user._id, "jobTitle", e.target.value)
                                                        } else {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleInlineEdit(user._id, "jobTitle", e.currentTarget.value)
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingRowId(null)
                                                            setEditingField(null)
                                                        }
                                                    }}
                                                    className="w-full px-2 py-1 border border-yellow-500 rounded bg-yellow-50 dark:bg-yellow-900/20"
                                                />
                                            ) : (
                                                <Badge variant="outline" className="font-normal border-gray-300 dark:border-gray-700 cursor-pointer">
                                                    {savingUserId === user._id ? "..." : (user.jobTitle || "تعیین نشده")}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.role === "admin" ? (
                                                <Badge variant="default" className="bg-red-500 hover:bg-red-600">مدیر کل</Badge>
                                            ) : (
                                                <Badge variant="secondary">کاربر</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => openEditDialog(user)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {user.role !== "admin" && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(user._id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        هیچ کاربری یافت نشد.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
