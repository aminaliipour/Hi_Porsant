"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  const [isFocused, setIsFocused] = useState(false)
  const isUpdatingFromProp = useRef(false)

  // تنظیم مقدار اولیه و بروزرسانی با تغییر value از بیرون
  useEffect(() => {
    // فقط اگر input focus نداشته باشد، مقدار را از prop به‌روز کن
    if (!isFocused) {
      if (value !== undefined && value !== null && value !== "") {
        isUpdatingFromProp.current = true
        setDisplayValue(formatNumber(value))
      } else {
        setDisplayValue("")
      }
    }
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // اگر در حال به‌روزرسانی از prop هستیم، از handleChange جلوگیری کن
    if (isUpdatingFromProp.current) {
      isUpdatingFromProp.current = false
      return
    }

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

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // فرمت نهایی هنگام از دست دادن focus
    if (displayValue && displayValue !== "-") {
      const formatted = formatNumber(displayValue)
      setDisplayValue(formatted)
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
