"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gregorianToJalali, formatJalaliDate } from "@/lib/jalali"

interface PayslipFile {
  fileName: string
  uploadTime: string
  downloadUrl: string
}

export default function PayslipsPage() {
  const [files, setFiles] = useState<PayslipFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayslips = async () => {
      const res = await fetch("/api/payslips")
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
      setLoading(false)
    }

    fetchPayslips()
  }, [])

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return "-"
    return formatJalaliDate(gregorianToJalali(new Date(dateValue)))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">فیش حقوقی</h1>
        <p className="text-gray-500">فیش های حقوقی شما بعد از آپلود مدیر در اینجا نمایش داده می شوند</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست فیش ها</CardTitle>
          <CardDescription>آخرین فیش های حقوقی ثبت شده</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>در حال بارگذاری...</p>
          ) : files.length === 0 ? (
            <p className="text-gray-500">هنوز فیشی برای شما ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.downloadUrl} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-md p-4">
                  <div className="space-y-1">
                    <div className="font-semibold">{file.fileName}</div>
                    <div className="text-sm text-gray-500">تاریخ آپلود: {formatDate(file.uploadTime)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 hover:bg-blue-700">PDF</Badge>
                    <Button asChild>
                      <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                        دانلود
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
