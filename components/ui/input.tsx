"use client"

import * as React from "react"
import { formatNumber } from "@/lib/utils"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  formatAsNumber?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, formatAsNumber, onChange, value, ...props }, ref) => {
    // اگر فرمت عددی فعال باشد
    if (formatAsNumber && type === "text") {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "")

        // اگر مقدار خالی یا یک عدد معتبر است
        if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
          // فرمت کردن مقدار با کاما
          const formattedValue = formatNumber(rawValue)

          // تنظیم مقدار فرمت شده در المان
          e.target.value = formattedValue

          // فراخوانی تابع onChange اصلی اگر وجود داشته باشد
          if (onChange) {
            onChange(e)
          }
        }
      }

      return (
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          onChange={handleChange}
          value={typeof value === "string" ? formatNumber(value) : value}
          dir="rtl"
          {...props}
        />
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={onChange}
        value={value}
        dir="rtl"
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
