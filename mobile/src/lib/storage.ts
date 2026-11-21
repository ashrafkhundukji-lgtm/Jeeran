import * as SecureStore from 'expo-secure-store'
import { createChunkedStore } from './chunkedStore'

// Android Keystore-backed storage (expo-secure-store) for the session and
// small preferences. See storage.web.ts for the web preview build.
export const secureStorage = createChunkedStore({
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
})
