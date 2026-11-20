/* Jeeran owner app service worker.
 *
 * Registered only from owner pages, with scope /dashboard/ (allowed by the
 * Service-Worker-Allowed header in next.config.ts). It therefore never
 * controls a customer page, and it only ever sees requests made BY owner
 * pages.
 *
 * What it does:
 *   - push: shows the notification from the server payload.
 *   - notificationclick: focuses an open app window and opens the deep
 *     link, or opens a new window.
 *   - navigations under /dashboard/: network only (with navigation
 *     preload); if the network fails, a branded offline page. HTML is
 *     never stored.
 *   - /_next/static/*: cache first. These files are content-hashed, so a
 *     cached copy can never be stale.
 *   - everything else (API, auth, Supabase, RSC payloads, images): not
 *     touched — the browser handles it as if there were no worker.
 *
 * Updates: a new version installs, skips waiting and claims open pages at
 * once. No reload is forced: the worker holds no HTML or API data, so an
 * open page keeps working unchanged and picks up new code on its next
 * navigation.
 */

const VERSION = 'v1'
const SHELL_CACHE = `jeeran-owner-shell-${VERSION}`
const STATIC_CACHE = `jeeran-owner-static-${VERSION}`
const OFFLINE_URL = '/owner-offline.html'
const SHELL_FILES = [OFFLINE_URL, '/owner-app/icon-192.png', '/design/jeeran-mark-navy.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, STATIC_CACHE])
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n.startsWith('jeeran-owner-') && !keep.has(n)).map((n) => caches.delete(n)))
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    if (!url.pathname.startsWith('/dashboard/')) return
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse
          if (preloaded) return preloaded
          return await fetch(req)
        } catch {
          const offline = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE })
          return offline || Response.error()
        }
      })(),
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE)
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {})
        return res
      })(),
    )
  }
  // Anything else: no respondWith → default network behaviour.
})

// Only owner paths inside the app; anything else falls back to home.
function safeUrl(raw) {
  try {
    const u = new URL(raw || '/dashboard/owner', self.location.origin)
    if (u.origin !== self.location.origin || !u.pathname.startsWith('/dashboard/')) return '/dashboard/owner'
    return u.pathname + u.search + u.hash
  } catch {
    return '/dashboard/owner'
  }
}

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'جيران'
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    tag: typeof data.tag === 'string' ? data.tag : 'jeeran',
    renotify: true,
    lang: data.lang || 'ar',
    dir: data.dir === 'ltr' ? 'ltr' : data.dir === 'rtl' ? 'rtl' : 'auto',
    icon: '/owner-app/icon-192.png',
    badge: '/owner-app/badge-96.png',
    data: { url: safeUrl(data.url), type: data.type || null },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus an open app window on the deep link, else open one.
async function openTarget(target) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of windows) {
    if (!new URL(client.url).pathname.startsWith('/dashboard/')) continue
    try {
      await client.focus()
    } catch {
      // Focus needs the click's user activation; navigating still works.
    }
    try {
      await client.navigate(target)
      return 'navigated'
    } catch {
      // Not controlled by this worker — try the next window or open one.
    }
  }
  await self.clients.openWindow(target)
  return 'opened'
}

function onNotificationClick(event) {
  event.notification.close()
  event.waitUntil(openTarget(safeUrl(event.notification.data && event.notification.data.url)))
}

self.addEventListener('notificationclick', onNotificationClick)

// The push service rotated this subscription: register the new one.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const key = event.oldSubscription && event.oldSubscription.options && event.oldSubscription.options.applicationServerKey
      if (!key) return
      const sub = event.newSubscription || (await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }))
      await fetch('/api/owner/push/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
    })().catch(() => {}),
  )
})
