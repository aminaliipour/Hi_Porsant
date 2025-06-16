'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, Building2 } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const correctPassword = '123@123@123'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // شبیه‌سازی تأخیر برای تجربه کاربری بهتر
    setTimeout(() => {
      if (password === correctPassword) {
        // ذخیره وضعیت لاگین در localStorage
        localStorage.setItem('isAuthenticated', 'true')
        onLogin()
      } else {
        setError('رمز عبور اشتباه است')
        setPassword('')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBCC0A]/20 to-[#58595B]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* لوگو و عنوان */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-[#FBCC0A] rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-10 h-10 text-[#58595B]" />
          </div>
          <h1 className="text-3xl font-bold text-[#58595B] mb-2">Hi Architect</h1>
          <p className="text-[#58595B]/70 text-sm">سیستم مدیریت پروژه و محاسبه پورسانت</p>
        </div>

        {/* کارت لاگین */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-[#58595B] flex items-center justify-center gap-2">
              <Lock className="w-6 h-6 text-[#FBCC0A]" />
              ورود به سیستم
            </CardTitle>
            <CardDescription className="text-[#58595B]/70">
              لطفاً رمز عبور خود را وارد کنید
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* فیلد رمز عبور */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#58595B]">
                  رمز عبور
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور را وارد کنید"
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

              {/* پیام خطا */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* دکمه ورود */}
              <Button
                type="submit"
                className="w-full bg-[#FBCC0A] hover:bg-[#FBCC0A]/90 text-[#58595B] font-bold py-3 h-auto transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#58595B]/30 border-t-[#58595B] rounded-full animate-spin"></div>
                    در حال ورود...
                  </div>
                ) : (
                  'ورود به سیستم'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* اطلاعات تماس */}
        <div className="text-center mt-6 text-xs text-[#58595B]/50">
          <p>© ۲۰۲۵ Hi Architect - تمامی حقوق محفوظ است</p>
        </div>
      </div>
    </div>
  )
}