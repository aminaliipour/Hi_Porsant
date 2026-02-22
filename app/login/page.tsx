"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Building2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [loginId, setLoginId] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginId }),
            })

            const data = await response.json()

            if (response.ok) {
                // Redirect to dashboard on success
                // Force full reload to ensure cookies and middleware verify auth correctly
                window.location.href = "/dashboard"
            } else {
                setError(data.message || "خطا در ورود")
            }
        } catch (err) {
            setError("خطا در برقراری ارتباط با سرور")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FBCC0A]/20 to-[#58595B]/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-20 h-20 bg-[#FBCC0A] rounded-2xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-10 h-10 text-[#58595B]" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#58595B] mb-2">Hi Architect</h1>
                    <p className="text-[#58595B]/70 text-sm">محیط کار هوشمند و یکپارچه</p>
                </div>

                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl text-[#58595B] flex items-center justify-center gap-2">
                            <Lock className="w-6 h-6 text-[#FBCC0A]" />
                            ورود به داشبورد
                        </CardTitle>
                        <CardDescription className="text-[#58595B]/70">
                            لطفاً رمز عبور یا کد ملی خود را وارد کنید
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="loginId" className="text-sm font-medium text-[#58595B]">
                                    شناسه ورود (رمز عبور یا کد ملی)
                                </label>
                                <div className="relative">
                                    <Input
                                        id="loginId"
                                        type={showPassword ? "text" : "password"}
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        placeholder="رمز مدیر یا کد ملی کارمند"
                                        className="pr-12 border-[#58595B]/20 focus:border-[#FBCC0A] focus:ring-[#FBCC0A]"
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#58595B]/50 hover:text-[#58595B] transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-[#FBCC0A] hover:bg-[#FBCC0A]/90 text-[#58595B] font-bold py-3 h-auto transition-all duration-200 transform hover:scale-[1.02]"
                                disabled={isLoading || !loginId}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[#58595B]/30 border-t-[#58595B] rounded-full animate-spin"></div>
                                        در حال ورود...
                                    </div>
                                ) : (
                                    "ورود به داشبورد"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6 text-xs text-[#58595B]/50">
                    <p>© ۲۰۲۵ Hi Architect - تمامی حقوق محفوظ است</p>
                </div>
            </div>
        </div>
    )
}
