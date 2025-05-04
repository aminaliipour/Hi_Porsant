import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">صفحه مورد نظر یافت نشد</h2>
      <p className="mb-6 text-muted-foreground">متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.</p>
      <Button asChild>
        <Link href="/">بازگشت به صفحه اصلی</Link>
      </Button>
    </div>
  )
}
