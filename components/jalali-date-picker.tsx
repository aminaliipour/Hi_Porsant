"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { gregorianToJalali, jalaliToGregorian, formatJalaliDate } from "@/lib/jalali"

interface JalaliDatePickerProps {
    value?: string // ISO date string
    onDateChange: (date: string) => void
    label?: string
}

export function JalaliDatePicker({ value, onDateChange, label }: JalaliDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [displayDate, setDisplayDate] = useState<string>("")
    const [currentJalaliYear, setCurrentJalaliYear] = useState<number>(1403)
    const [currentJalaliMonth, setCurrentJalaliMonth] = useState<number>(12)
    const [error, setError] = useState<string>("")
    const [isInitialized, setIsInitialized] = useState(false)

    const Persian_Months = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]

    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const parseDateValue = (dateValue: string): Date | null => {
        const trimmed = dateValue.trim()
        if (!trimmed) return null
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const localDate = new Date(`${trimmed}T00:00:00`)
            return isNaN(localDate.getTime()) ? null : localDate
        }
        const parsed = new Date(trimmed)
        return isNaN(parsed.getTime()) ? null : parsed
    }

    // Initialize with today's date on mount
    useEffect(() => {
        try {
            const today = gregorianToJalali(new Date())
            const [jy, jm] = today.split('-').map(Number)
            
            if (!isNaN(jy) && !isNaN(jm) && jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12) {
                setCurrentJalaliYear(jy)
                setCurrentJalaliMonth(jm)
                setIsInitialized(true)
                console.log("Calendar initialized with:", { year: jy, month: jm })
            }
        } catch (err) {
            console.error("Error initializing calendar:", err)
            setIsInitialized(true) // Still mark as initialized to show calendar
        }
    }, [])

    useEffect(() => {
        try {
            // Handle different input types
            if (value && typeof value === 'string' && value.trim().length > 0) {
                // Value is a non-empty string
                const date = parseDateValue(value)
                if (!date) {
                    // Invalid date string - keep input empty
                    setDisplayDate("")
                    setError("")
                } else {
                    // Valid date
                    const jalaliDate = gregorianToJalali(date)
                    setDisplayDate(jalaliDate)
                    const [jy, jm] = jalaliDate.split('-').map(Number)
                    if (!isNaN(jy) && !isNaN(jm)) {
                        setCurrentJalaliYear(jy)
                        setCurrentJalaliMonth(jm)
                    }
                    setError("")
                }
            } else {
                // No value or empty string - keep input empty
                setDisplayDate("")
                setError("")
            }
        } catch (err) {
            console.error("Error parsing date:", err)
            setDisplayDate("")
            setError("")
        }
    }, [value])

    const daysInMonth = (year: number, month: number): number => {
        if (month <= 6) return 31
        if (month <= 11) return 30
        // Asfand - consider leap years
        const isLeapYear = (year % 33 % 4 === 1) || ((year % 33 % 4 !== 1) && (year % 4 === 0))
        return isLeapYear ? 30 : 29
    }

    const getFirstDayOfMonth = (year: number, month: number): number => {
        try {
            // Validate inputs
            if (!year || !month || isNaN(year) || isNaN(month)) {
                return 0
            }
            if (year < 1300 || year > 1500 || month < 1 || month > 12) {
                return 0
            }
            
            const firstDay = jalaliToGregorian(`${year}-${String(month).padStart(2, '0')}-01`)
            return firstDay.getDay()
        } catch (err) {
            console.error("Error in getFirstDayOfMonth:", err, "year:", year, "month:", month)
            return 0
        }
    }

    const handleDateSelect = (day: number) => {
        try {
            // Validate inputs
            if (!currentJalaliYear || !currentJalaliMonth || isNaN(currentJalaliYear) || isNaN(currentJalaliMonth)) {
                setError("خطا در انتخاب تاریخ")
                return
            }
            
            if (currentJalaliYear < 1300 || currentJalaliYear > 1500 || 
                currentJalaliMonth < 1 || currentJalaliMonth > 12 || 
                day < 1 || day > 31) {
                setError("تاریخ انتخابی نامعتبر است")
                return
            }
            
            const jalaliDateStr = `${currentJalaliYear}-${String(currentJalaliMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            console.log("Selecting date:", jalaliDateStr)
            
            const gregorianDate = jalaliToGregorian(jalaliDateStr)
            
            if (!gregorianDate || isNaN(gregorianDate.getTime())) {
                setError("خطا در تبدیل تاریخ")
                return
            }
            
            const localDate = formatLocalDate(gregorianDate)
            onDateChange(localDate)
            setDisplayDate(jalaliDateStr)
            setIsOpen(false)
            setError("")
        } catch (err) {
            console.error("Error selecting date:", err, "year:", currentJalaliYear, "month:", currentJalaliMonth, "day:", day)
            setError("خطا در انتخاب تاریخ")
        }
    }

    const handlePrevMonth = () => {
        if (currentJalaliMonth === 1) {
            setCurrentJalaliMonth(12)
            setCurrentJalaliYear(currentJalaliYear - 1)
        } else {
            setCurrentJalaliMonth(currentJalaliMonth - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentJalaliMonth === 12) {
            setCurrentJalaliMonth(1)
            setCurrentJalaliYear(currentJalaliYear + 1)
        } else {
            setCurrentJalaliMonth(currentJalaliMonth + 1)
        }
    }

    // Safe calculations with validation
    const daysInCurrentMonth = (currentJalaliYear && currentJalaliMonth) 
        ? daysInMonth(currentJalaliYear, currentJalaliMonth) 
        : 31
    const firstDayOfWeek = (currentJalaliYear && currentJalaliMonth) 
        ? getFirstDayOfMonth(currentJalaliYear, currentJalaliMonth) 
        : 0
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

    return (
        <div className="relative w-full">
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={displayDate ? formatJalaliDate(displayDate) : ""}
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="انتخاب تاریخ"
                />
            </div>

            {error && (
                <div className="text-red-500 text-xs mt-1">
                    {error}
                </div>
            )}

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-50 w-full max-w-sm">
                    {/* Month/Year Header */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b">
                        <Button
                            onClick={handlePrevMonth}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="text-center">
                            <div className="text-sm font-bold text-gray-700">
                                {currentJalaliMonth >= 1 && currentJalaliMonth <= 12 
                                    ? Persian_Months[currentJalaliMonth - 1] 
                                    : 'فروردین'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {currentJalaliYear || 1403}
                            </div>
                        </div>
                        <Button
                            onClick={handleNextMonth}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
                            <div key={day} className="text-center font-bold text-xs text-gray-600 py-2 bg-gray-50 rounded">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {emptyDays.map((_, index) => (
                            <div key={`empty-${index}`} className="p-2"></div>
                        ))}
                        {days.map((day) => (
                            <button
                                key={day}
                                onClick={() => handleDateSelect(day)}
                                className={`p-2 text-sm rounded font-medium transition-colors ${
                                    displayDate === `${currentJalaliYear}-${String(currentJalaliMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 hover:bg-blue-100 text-gray-800 hover:text-blue-700'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                        <Button
                            onClick={() => setIsOpen(false)}
                            variant="outline"
                            size="sm"
                            className="w-full text-sm"
                        >
                            بستن
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
