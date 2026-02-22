"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { JalaliDatePicker } from "@/components/jalali-date-picker"
import { gregorianToJalali, formatJalaliDate } from "@/lib/jalali"
import { useToast } from "@/components/ui/use-toast"

const requestTypes = ["مرخصی", "ماموریت", "اضافه کاری", "سایر"]

export default function LetterRequestsPage() {
    const { toast } = useToast()
    const [user, setUser] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [newRequest, setNewRequest] = useState({
        requestType: requestTypes[0],
        title: "",
        description: "",
        startDate: "",
        endDate: "",
    })

    const isAdmin = user?.role === "admin" || user?.role === "مدیر"

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => setUser(data.user || null))
            .catch(err => console.error(err))

        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        const res = await fetch("/api/letter-requests")
        if (res.ok) {
            setRequests(await res.json())
        }
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!newRequest.title.trim()) {
            toast({
                title: "خطا",
                description: "عنوان درخواست الزامی است",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        const res = await fetch("/api/letter-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRequest),
        })

        setIsSubmitting(false)

        if (res.ok) {
            toast({ title: "موفق", description: "درخواست ثبت شد" })
            setNewRequest({ requestType: requestTypes[0], title: "", description: "", startDate: "", endDate: "" })
            fetchRequests()
        } else {
            toast({ title: "خطا", description: "ثبت درخواست ناموفق بود", variant: "destructive" })
        }
    }

    const handleDecision = async (id: string, status: "approved" | "rejected") => {
        const res = await fetch("/api/letter-requests", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        })

        if (res.ok) {
            toast({ title: "موفق", description: status === "approved" ? "درخواست تایید شد" : "درخواست رد شد" })
            fetchRequests()
        } else {
            toast({ title: "خطا", description: "بروزرسانی ناموفق بود", variant: "destructive" })
        }
    }

    const myRequests = useMemo(() => {
        if (!user?._id) return []
        return requests.filter(r => (r.requester?._id || r.requester) === user._id)
    }, [requests, user])

    const pendingRequests = useMemo(() => {
        if (!isAdmin) return []
        return requests.filter(r => r.status === "pending")
    }, [requests, isAdmin])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-600 hover:bg-green-700">تایید شد</Badge>
            case "rejected":
                return <Badge className="bg-red-600 hover:bg-red-700">رد شد</Badge>
            default:
                return <Badge className="bg-yellow-600 hover:bg-yellow-700">در انتظار</Badge>
        }
    }

    const formatDate = (dateValue?: string) => {
        if (!dateValue) return "-"
        return formatJalaliDate(gregorianToJalali(new Date(dateValue)))
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">کارتابل نامه</h1>
                <p className="text-gray-500">ثبت و پیگیری درخواست های اداری</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ثبت درخواست جدید</CardTitle>
                    <CardDescription>نوع درخواست و جزئیات را وارد کنید</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>نوع درخواست</Label>
                            <Select
                                value={newRequest.requestType}
                                onValueChange={(value) => setNewRequest({ ...newRequest, requestType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {requestTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>عنوان</Label>
                            <Input
                                value={newRequest.title}
                                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>توضیحات</Label>
                        <Textarea
                            rows={3}
                            value={newRequest.description}
                            onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>تاریخ شروع</Label>
                            <JalaliDatePicker
                                value={newRequest.startDate}
                                onDateChange={(date) => setNewRequest({ ...newRequest, startDate: date })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>تاریخ پایان</Label>
                            <JalaliDatePicker
                                value={newRequest.endDate}
                                onDateChange={(date) => setNewRequest({ ...newRequest, endDate: date })}
                            />
                        </div>
                    </div>

                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "در حال ثبت..." : "ثبت درخواست"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>درخواست های من</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>در حال بارگذاری...</p>
                    ) : myRequests.length === 0 ? (
                        <p className="text-gray-500">درخواستی ثبت نشده است.</p>
                    ) : (
                        <div className="space-y-3">
                            {myRequests.map(request => (
                                <div key={request._id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="font-semibold">{request.title}</div>
                                        <div className="text-sm text-gray-500">نوع: {request.requestType}</div>
                                        <div className="text-sm text-gray-500">از {formatDate(request.startDate)} تا {formatDate(request.endDate)}</div>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>کارتابل مدیریت (در انتظار)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingRequests.length === 0 ? (
                            <p className="text-gray-500">درخواست در انتظار وجود ندارد.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map(request => (
                                    <div key={request._id} className="border rounded-md p-4 space-y-3">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{request.title}</div>
                                                <div className="text-sm text-gray-500">کارمند: {request.requester?.name || "-"}</div>
                                                <div className="text-sm text-gray-500">نوع: {request.requestType}</div>
                                                <div className="text-sm text-gray-500">از {formatDate(request.startDate)} تا {formatDate(request.endDate)}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision(request._id, "approved")}>تایید</Button>
                                                <Button variant="destructive" onClick={() => handleDecision(request._id, "rejected")}>رد</Button>
                                            </div>
                                        </div>
                                        {request.description && (
                                            <div className="text-sm text-gray-600">{request.description}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
