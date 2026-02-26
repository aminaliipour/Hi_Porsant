// سرویس ورکر برای PWA - بهینه‌شده برای سرعت

const CACHE_NAME = "hiporsant-v2"
const API_CACHE_NAME = "hiporsant-api-v1"
const STATIC_CACHE_NAME = "hiporsant-static-v1"

const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png", 
  "/logo.base64"
]

// نصب سرویس ورکر و ذخیره فایل‌های اصلی در کش
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
      // الحق dismiss می‌شود
      self.skipWaiting()
    ])
  )
})

// فعال‌سازی سرویس ورکر و حذف کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name !== STATIC_CACHE_NAME && 
                   name !== API_CACHE_NAME && 
                   name !== CACHE_NAME
          })
          .map((cacheName) => caches.delete(cacheName))
      )
    }).then(() => self.clients.claim())
  )
})

// استراتژی کش: بهینه‌شده برای API و static files
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - Network first, then cache
  if (url.pathname.startsWith("/api/")) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === "GET") {
            const responseToCache = response.clone()
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request) || 
            new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({ "Content-Type": "application/json" })
            })
        })
    )
  }

  // Static assets - Cache first, then network
  if (request.method === "GET" && 
      (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/) ||
       url.pathname.startsWith("/_next/static/"))) {
    return event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response
        
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseToCache = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
      }).catch(() => {
        return new Response("Network request failed", { status: 503 })
      })
    )
  }

  // HTML pages - Network first, then cache
  if (request.method === "GET" && (url.pathname === "/" || url.pathname.endsWith(".html"))) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
          return response
        })
        .catch(() => caches.match(request))
    )
  }

  // Default - Network only
  event.respondWith(fetch(request))
})


// دریافت پیام‌ها از کلاینت
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
