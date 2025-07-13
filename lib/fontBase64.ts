// فونت‌های Base64 برای استفاده در PDF (جهت رفع مشکل production)
export const MORABBA_FONT_BASE64 = `
@font-face {
  font-family: 'Morabba';
  src: url('data:font/truetype;charset=utf-8;base64,') format('truetype');
  font-weight: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Morabba';
  src: url('data:font/truetype;charset=utf-8;base64,') format('truetype');
  font-weight: bold;
  font-display: swap;
}
`

// برای حالتی که فونت Base64 در دسترس نیست، از فونت‌های امن وب استفاده می‌کنیم
export const FALLBACK_FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');

@font-face {
  font-family: 'Morabba';
  src: local('Vazirmatn'), local('Tahoma'), local('Arial');
  font-weight: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Morabba';
  src: local('Vazirmatn'), local('Tahoma'), local('Arial');
  font-weight: bold;
  font-display: swap;
}
`
