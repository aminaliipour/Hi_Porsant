"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { User as UserIcon, Camera, X, Check } from "lucide-react"

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [editedUser, setEditedUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            const res = await fetch("/api/auth/me")
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
                setEditedUser({ ...data.user })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setEditedUser((prev: any) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editedUser),
            })

            if (!res.ok) {
                throw new Error("خطا در ذخیره اطلاعات")
            }

            const data = await res.json()
            setUser(data.user)
            setEditedUser({ ...data.user })
            setEditMode(false)

            toast({
                title: "موفق",
                description: "اطلاعات پروفایل بروز شد",
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "خطا",
                description: error instanceof Error ? error.message : "خطا در ذخیره",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setEditedUser({ ...user })
        setEditMode(false)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        fetch("/api/profile/avatar", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (!res.ok) throw new Error("خطا در آپلود عکس")
                return res.json()
            })
            .then((result) => {
                setUser((prev: any) => ({
                    ...prev,
                    avatar: result.avatar,
                }))
                toast({
                    title: "موفق",
                    description: "عکس پروفایل با موفقیت بروز شد",
                })
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            })
            .catch((error) => {
                console.error(error)
                toast({
                    title: "خطا",
                    description: error instanceof Error ? error.message : "خطا در آپلود عکس",
                    variant: "destructive",
                })
            })
            .finally(() => {
                setUploading(false)
            })
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>پروفایل تنظیمات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                    <UserIcon className="w-16 h-16 text-white" />
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-600 rounded-full p-3 text-white shadow-lg transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{user?.name}</h2>
                            <p className="text-gray-500">{user?.jobTitle || "کارمند"}</p>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Editable */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                        <div>
                            <label className="text-sm text-gray-500">نام</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.name || ""}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="نام خود را وارد کنید"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">کد ملی</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.nationalCode || ""}
                                    onChange={(e) => handleInputChange("nationalCode", e.target.value)}
                                    placeholder="کد ملی"
                                    className="mt-1"
                                    disabled
                                />
                            ) : (
                                <p className="font-medium">{user?.nationalCode}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">سمت</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.jobTitle || ""}
                                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                                    placeholder="سمت خود را وارد کنید"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.jobTitle || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">ایمیل</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.email || ""}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    placeholder="ایمیل"
                                    type="email"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.email || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">شماره تماس</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.phoneNumber || ""}
                                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                    placeholder="شماره تماس"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.phoneNumber || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">نوع</label>
                            {editMode ? (
                                <Input
                                    value={user?.role === "admin" ? "مدیر" : "کاربر"}
                                    disabled
                                    className="mt-1 bg-gray-100"
                                />
                            ) : (
                                <p className="font-medium">{user?.role === "admin" ? "مدیر" : "کاربر"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">نام پدر</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.fatherName || ""}
                                    onChange={(e) => handleInputChange("fatherName", e.target.value)}
                                    placeholder="نام پدر"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.fatherName || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">تحصیلات</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.education || ""}
                                    onChange={(e) => handleInputChange("education", e.target.value)}
                                    placeholder="تحصیلات"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.education || "-"}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-500">آدرس</label>
                            {editMode ? (
                                <Textarea
                                    value={editedUser?.address || ""}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="آدرس"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.address || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">شماره حساب</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.bankAccount || ""}
                                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                                    placeholder="شماره حساب"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.bankAccount || "-"}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-500">شماره کارت</label>
                            {editMode ? (
                                <Input
                                    value={editedUser?.cardNumber || ""}
                                    onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                                    placeholder="شماره کارت"
                                    className="mt-1"
                                />
                            ) : (
                                <p className="font-medium">{user?.cardNumber || "-"}</p>
                            )}
                        </div>
                    </div>

                    {/* Edit/Save/Cancel Buttons */}
                    <div className="flex gap-2 justify-end mt-6 pt-6 border-t">
                        {editMode ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    لغو
                                </Button>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                                >
                                    {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setEditMode(true)}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                ویرایش
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

