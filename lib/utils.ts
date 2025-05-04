import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تبدیل اعداد به فرمت سه رقم سه رقم با کاما
 * @param value - عدد یا رشته عددی
 * @returns رشته فرمت شده با کاما
 */
export function formatNumber(value: number | string): string {
  if (value === undefined || value === null) return ""

  // تبدیل به رشته و حذف کاماهای موجود
  const stringValue = String(value).replace(/,/g, "")

  // بررسی اعتبار عدد
  if (!/^\d*\.?\d*$/.test(stringValue)) return stringValue

  // جداسازی بخش اعشاری و صحیح
  const parts = stringValue.split(".")
  const integerPart = parts[0]
  const decimalPart = parts.length > 1 ? "." + parts[1] : ""

  // اضافه کردن کاما به بخش صحیح
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return formattedInteger + decimalPart
}

/**
 * حذف کاما از رشته عددی
 * @param value - رشته عددی با کاما
 * @returns عدد بدون کاما
 */
export function unformatNumber(value: string): number {
  if (!value) return 0
  return Number.parseFloat(value.replace(/,/g, ""))
}
