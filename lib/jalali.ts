/**
 * تبدیل تاریخ میلادی به شمسی
 * الگوریتم استاندارد و تست شده
 */
export function gregorianToJalali(gDate: Date | string): string {
    const date = typeof gDate === 'string' ? new Date(gDate) : gDate
    
    let gy = date.getFullYear()
    let gm = date.getMonth() + 1
    let gd = date.getDate()

    const g_d_n = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    
    let jy = (gy <= 1600) ? 0 : 979
    gy -= (gy <= 1600) ? 621 : 1600
    const gy2 = (gm > 2) ? (gy + 1) : gy
    
    let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + 
               (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_n[gm - 1]
    
    jy += 33 * Math.floor(days / 12053)
    days %= 12053
    
    jy += 4 * Math.floor(days / 1461)
    days %= 1461
    
    if (days > 365) {
        jy += Math.floor((days - 1) / 365)
        days = (days - 1) % 365
    }
    
    let jm: number
    let jd: number
    
    if (days < 186) {
        jm = 1 + Math.floor(days / 31)
        jd = 1 + (days % 31)
    } else {
        jm = 7 + Math.floor((days - 186) / 30)
        jd = 1 + ((days - 186) % 30)
    }

    return `${jy.toString().padStart(4, '0')}-${jm.toString().padStart(2, '0')}-${jd.toString().padStart(2, '0')}`
}

/**
 * تبدیل تاریخ شمسی به میلادی
 * الگوریتم استاندارد و معتبر
 */
export function jalaliToGregorian(jDateString: string): Date {
    try {
        const parts = jDateString.split('-')
        if (parts.length !== 3) {
            throw new Error("Invalid date format. Expected YYYY-MM-DD")
        }
        
        let jy = parseInt(parts[0], 10)
        let jm = parseInt(parts[1], 10)
        let jd = parseInt(parts[2], 10)

        if (isNaN(jy) || isNaN(jm) || isNaN(jd) || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
            throw new Error("Invalid date values")
        }
        
        // Validate year range (1300-1500 Jalali)
        if (jy < 1300 || jy > 1500) {
            throw new Error("Year out of supported range (1300-1500)")
        }

        let gy = (jy <= 979) ? 621 : 1600
        jy -= (jy <= 979) ? 0 : 979
        
        let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd
        
        if (jm < 7) {
            days += (jm - 1) * 31
        } else {
            days += (jm - 7) * 30 + 186
        }
        
        gy += 400 * Math.floor(days / 146097)
        days %= 146097
        
        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524)
            days %= 36524
            if (days >= 365) days++
        }
        
        gy += 4 * Math.floor(days / 1461)
        days %= 1461
        
        if (days > 365) {
            gy += Math.floor((days - 1) / 365)
            days = (days - 1) % 365
        }
        
        const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        
        let gm = 0
        for (let i = 0; i < 13 && days >= sal_a[i]; i++) {
            days -= sal_a[i]
            gm = i + 1
        }
        
        const gd = days + 1
        
        return new Date(gy, gm - 1, gd)
    } catch (error) {
        console.error("Jalali to Gregorian error:", error, "Input:", jDateString)
        throw error
    }
}

/**
 * فرمت کردن تاریخ شمسی برای نمایش
 */
export function formatJalaliDate(jDate: string | null | undefined): string {
    // Handle empty or invalid dates
    if (!jDate || typeof jDate !== 'string') return ""
    
    const parts = jDate.split('-')
    if (parts.length !== 3) return ""
    
    const year = parts[0]
    const month = parseInt(parts[1], 10)
    const day = parts[2]
    
    // Validate month is within range
    if (isNaN(month) || month < 1 || month > 12) return ""
    
    const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const monthName = jMonths[month - 1]
    
    // Format: day month year
    return `${day} ${monthName} ${year}`
}

/**
 * محاسبه روزهای باقی مانده تا تاریخ پایان
 */
export function calculateDaysRemaining(dueDate: Date | string): number {
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    const timeDiff = date.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * فرمت کردن countdown
 */
export function formatCountdown(daysRemaining: number): { display: string; status: 'expired' | 'urgent' | 'warning' | 'normal' } {
    if (daysRemaining < 0) {
        return { display: `${Math.abs(daysRemaining)} روز گذشته`, status: 'expired' }
    } else if (daysRemaining === 0) {
        return { display: 'امروز', status: 'urgent' }
    } else if (daysRemaining === 1) {
        return { display: 'فردا', status: 'urgent' }
    } else if (daysRemaining <= 3) {
        return { display: `${daysRemaining} روز باقی`, status: 'urgent' }
    } else if (daysRemaining <= 7) {
        return { display: `${daysRemaining} روز باقی`, status: 'warning' }
    } else {
        return { display: `${daysRemaining} روز باقی`, status: 'normal' }
    }
}
