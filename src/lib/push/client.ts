// Browser-side helpers for the owner app: service worker registration and
// this phone's push subscription. Only imported by client components.

export const OWNER_SW_URL = '/owner-sw.js'
export const OWNER_SW_SCOPE = '/dashboard/'
const SYNCED_LOCALE_KEY = 'jeeran:push-locale'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  // iPadOS 13+ reports as Mac; touch points give it away.
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export async function registerOwnerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(OWNER_SW_URL, { scope: OWNER_SW_SCOPE, updateViaCache: 'none' })
  } catch (err) {
    console.warn('owner app: service worker registration failed', err)
    return null
  }
}

async function ownerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration(OWNER_SW_SCOPE)) ?? (await registerOwnerServiceWorker())
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await ownerRegistration()
  return reg ? reg.pushManager.getSubscription() : null
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Short human label for the device list ("Android · Chrome").
export function deviceLabel(): string {
  const ua = navigator.userAgent
  const os = /android/i.test(ua) ? 'Android' : isIOS() ? (/ipad/i.test(ua) ? 'iPad' : 'iPhone') : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'Mac' : /linux/i.test(ua) ? 'Linux' : 'Device'
  const browser = /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /edg\//i.test(ua) ? 'Edge' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Browser'
  return `${os} · ${browser}`
}

function activeWorker(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
  if (reg.active) return Promise.resolve(reg.active)
  const pending = reg.installing ?? reg.waiting
  if (!pending) return Promise.reject(new Error('no service worker'))
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('service worker did not activate')), 15000)
    pending.addEventListener('statechange', () => {
      if (pending.state === 'activated') {
        clearTimeout(timer)
        resolve(pending)
      } else if (pending.state === 'redundant') {
        clearTimeout(timer)
        reject(new Error('service worker became redundant'))
      }
    })
  })
}

export type SubscribeOutcome = 'subscribed' | 'denied' | 'dismissed' | 'unsupported' | 'not-configured' | 'error'

// Must be called from a tap: asks for permission, subscribes, registers
// the subscription with the server.
export async function subscribeThisDevice(locale: string): Promise<SubscribeOutcome> {
  if (!pushSupported()) return 'unsupported'
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) return 'not-configured'
  const permission = await Notification.requestPermission()
  if (permission === 'denied') return 'denied'
  if (permission !== 'granted') return 'dismissed'
  try {
    const reg = await ownerRegistration()
    if (!reg) return 'error'
    // Not navigator.serviceWorker.ready: it never resolves on a document
    // that was created outside /dashboard/ (e.g. /login, then a client-side
    // push to the dashboard). Wait on our own registration instead.
    await activeWorker(reg)
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) }))
    const res = await fetch('/api/owner/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), label: deviceLabel(), locale }),
    })
    if (!res.ok) return 'error'
    try {
      localStorage.setItem(SYNCED_LOCALE_KEY, locale)
    } catch {}
    return 'subscribed'
  } catch (err) {
    console.warn('owner app: subscribe failed', err)
    return 'error'
  }
}

export async function unsubscribeThisDevice(): Promise<boolean> {
  const sub = await currentSubscription()
  if (!sub) return true
  const res = await fetch('/api/owner/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  await sub.unsubscribe().catch(() => false)
  return res.ok
}

// Pushes are written in the owner's language, which lives in this
// browser's localStorage. When it changes on a subscribed phone, tell the
// server (once per change).
export async function syncPushLocale(locale: string) {
  try {
    if (localStorage.getItem(SYNCED_LOCALE_KEY) === locale) return
    if (!(await currentSubscription())) return
    const res = await fetch('/api/owner/push/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    if (res.ok) localStorage.setItem(SYNCED_LOCALE_KEY, locale)
  } catch {
    // Next page load tries again.
  }
}
