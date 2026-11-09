/* Rak Lokal service worker.
 *
 * - App pages: network first; when offline, the cached copy of the page or
 *   the /offline page.
 * - Build assets (/_next/static, icons, fonts): cache first (file names are
 *   content-hashed, so a cached copy never goes stale).
 * - API calls (other origin) and non-GET requests are never touched: data
 *   always comes from the server, so no stale stock or status is shown.
 *
 * Bump VERSION to drop old caches.
 */
const VERSION = "v3"
const PAGES = `pages-${VERSION}`
const ASSETS = `assets-${VERSION}`
const OFFLINE_URL = "/offline"
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]

/** Caches the offline page plus the CSS/JS/fonts it references, so it renders styled with no network. */
async function precache() {
  const pages = await caches.open(PAGES)
  await pages.addAll(PRECACHE)
  const res = await pages.match(OFFLINE_URL)
  if (!res) return
  const html = await res.text()
  const assets = [...new Set([...html.matchAll(/["'(](\/_next\/static\/[^"'()\s\\]+)/g)].map((m) => m[1]))]
  const cache = await caches.open(ASSETS)
  await Promise.all(assets.map((a) => cache.add(a).catch(() => {})))
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  /\.(?:woff2?|png|svg|ico|webp|jpg|jpeg)$/.test(url.pathname)

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // API, Google sign-in, uploads
  if (url.pathname === "/sw.js") return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(PAGES).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error())
    )
    return
  }

  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(ASSETS).then((c) => c.put(request, copy))
            }
            return res
          })
      )
    )
  }
})

// Lets the page activate a waiting worker right away.
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting()
})
