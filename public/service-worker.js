// سرویس ورکر برای PWA

const CACHE_NAME = "hiporsant-v1"
const urlsToCache = ["/", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png", "/logo.png"]

// نصب سرویس ورکر و ذخیره فایل‌های اصلی در کش
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// فعال‌سازی سرویس ورکر و حذف کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// استراتژی کش: ابتدا شبکه، سپس کش
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // اگر درخواست موفق بود، یک کپی از پاسخ را در کش ذخیره می‌کنیم
        if (event.request.method === "GET") {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // اگر درخواست شبکه با خطا مواجه شد، از کش استفاده می‌کنیم
        return caches.match(event.request)
      }),
  )
})

// دریافت پیام‌ها از کلاینت
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
