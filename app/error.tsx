"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // گزارش خطا به سرویس مدیریت خطا
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">خطایی رخ داده است</h2>
      <p className="mb-6 text-muted-foreground">متأسفانه در اجرای برنامه خطایی رخ داده است.</p>
      <Button
        onClick={
          // تلاش مجدد برای رندر کردن محتوا
          () => reset()
        }
      >
        تلاش مجدد
      </Button>
    </div>
  )
}
