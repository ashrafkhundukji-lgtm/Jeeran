'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

// Reads a browser-only value (localStorage, matchMedia, userAgent) without a
// setState-in-effect: the server snapshot is used for SSR + hydration, the
// client snapshot right after. `subscribe` lets callers re-read on events.
export function useClientValue<T>(read: () => T, serverValue: T, subscribe: (onChange: () => void) => () => void = noopSubscribe): T {
  return useSyncExternalStore(subscribe, read, () => serverValue)
}

export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // Private mode / blocked storage — the UI just doesn't remember.
  }
  window.dispatchEvent(new Event('jeeran:flags'))
}

export const subscribeFlags = (onChange: () => void) => {
  window.addEventListener('jeeran:flags', onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener('jeeran:flags', onChange)
    window.removeEventListener('storage', onChange)
  }
}
