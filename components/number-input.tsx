"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatNumber } from "@/lib/utils"

interface NumberInputProps {
  value: number | string
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  id?: string
  name?: string
}

export function NumberInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
  min,
  max,
  id,
  name,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  // تنظیم مقدار اولیه و بروزرسانی با تغییر value
  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      setDisplayValue(formatNumber(value))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    
    // حذف همه کاراکترهای غیر عددی به جز نقطه و منفی
    const rawValue = input.replace(/[^\d.-]/g, "")
    
    // اگر مقدار خالی یا یک عدد معتبر است
    if (rawValue === "" || rawValue === "-" || /^-?\d*\.?\d*$/.test(rawValue)) {
      // نمایش مقدار فرمت شده
      const formattedValue = rawValue === "" || rawValue === "-" ? rawValue : formatNumber(rawValue)
      setDisplayValue(formattedValue)

      // اگر مقدار معتبر است، آن را به عدد تبدیل کرده و به parent کامپوننت ارسال می‌کنیم
      if (rawValue !== "" && rawValue !== "-") {
        const numericValue = Number(rawValue)
        
        // بررسی محدودیت‌های min و max
        if ((min === undefined || numericValue >= min) && 
            (max === undefined || numericValue <= max)) {
          onChange(numericValue)
        }
      } else if (rawValue === "") {
        onChange(0)
      }
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      name={name}
      dir="ltr"
      style={{ textAlign: "left" }}
    />
  )
}
