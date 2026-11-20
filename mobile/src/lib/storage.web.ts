import { createChunkedStore } from './chunkedStore'

// Web preview only (react-native-web screenshots): expo-secure-store has no
// web implementation, so the browser's localStorage stands in. The Android
// app never loads this file.
function ls(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const secureStorage = createChunkedStore({
  getItem: async (k) => ls()?.getItem(k) ?? null,
  setItem: async (k, v) => ls()?.setItem(k, v),
  removeItem: async (k) => ls()?.removeItem(k),
})
