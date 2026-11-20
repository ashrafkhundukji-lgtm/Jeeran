// Key-value storage on top of a backend with a small per-value limit.
// Android/iOS secure storage (expo-secure-store) warns above 2048 bytes and
// iOS can refuse larger values; a Supabase session (access + refresh token +
// user JSON) is often bigger. Values are split into chunks under
// `${key}.0`, `${key}.1`, ... with the chunk count in `${key}.n`.
// Pure: the backend is injected, so it is unit-tested without a device.

export interface KVBackend {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export const CHUNK_SIZE = 1800

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
export function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_')
}

// Never cuts between the two halves of a surrogate pair (emoji etc.): a lone
// half would not survive the UTF-8 round trip through native storage.
export function split(value: string, size: number): string[] {
  if (value === '') return ['']
  const parts: string[] = []
  let i = 0
  while (i < value.length) {
    let end = Math.min(i + size, value.length)
    const last = value.charCodeAt(end - 1)
    if (end < value.length && last >= 0xd800 && last <= 0xdbff) end--
    parts.push(value.slice(i, end))
    i = end
  }
  return parts
}

export function createChunkedStore(backend: KVBackend, chunkSize = CHUNK_SIZE): KVBackend {
  async function count(key: string): Promise<number> {
    const n = Number(await backend.getItem(`${key}.n`))
    return Number.isInteger(n) && n > 0 ? n : 0
  }

  async function removeItem(rawKey: string) {
    const key = safeKey(rawKey)
    const n = await count(key)
    await backend.removeItem(`${key}.n`)
    for (let i = 0; i < n; i++) await backend.removeItem(`${key}.${i}`)
  }

  return {
    async getItem(rawKey) {
      const key = safeKey(rawKey)
      const n = await count(key)
      if (n === 0) return null
      const parts: string[] = []
      for (let i = 0; i < n; i++) {
        const part = await backend.getItem(`${key}.${i}`)
        // A missing chunk means a half-written value: treat it as absent.
        if (part == null) return null
        parts.push(part)
      }
      return parts.join('')
    },
    async setItem(rawKey, value) {
      const key = safeKey(rawKey)
      const old = await count(key)
      const parts = split(value, chunkSize)
      const n = parts.length
      for (let i = 0; i < n; i++) await backend.setItem(`${key}.${i}`, parts[i])
      await backend.setItem(`${key}.n`, String(n))
      for (let i = n; i < old; i++) await backend.removeItem(`${key}.${i}`)
    },
    removeItem,
  }
}
