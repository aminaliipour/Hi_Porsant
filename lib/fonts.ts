import localFont from 'next/font/local'

// بارگیری فونت Morabba از فایل‌های محلی
export const morabbaFont = localFont({
  src: [
    {
      path: '../public/fonts/Morabba.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Morabba Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-morabba',
  fallback: ['Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
})

// CSS برای استفاده در PDF
export const getPdfFontCSS = () => {
  return `
    @font-face {
      font-family: 'Morabba';
      src: url('/fonts/Morabba.ttf') format('truetype');
      font-weight: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Morabba';
      src: url('/fonts/Morabba Bold.ttf') format('truetype');
      font-weight: bold;
      font-display: swap;
    }
    
    /* فونت fallback برای production */
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    
    /* اطمینان از استفاده از فونت مناسب */
    * {
      font-family: 'Morabba', 'Vazirmatn', 'Tahoma', 'Arial', sans-serif !important;
    }
  `
}

export default morabbaFont
