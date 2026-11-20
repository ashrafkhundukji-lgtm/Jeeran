import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import { config } from './config'
import { secureStorage } from './storage'

// Auth only. The app never reads or writes tables directly: every data call
// goes through the website's API (src/lib/api.ts) with the access token.
export const supabase = createClient(
  config.supabaseUrl || 'https://missing-config.invalid',
  config.supabaseAnonKey || 'missing',
  {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

// Refresh tokens only while the app is in the foreground (Supabase's
// recommended setup for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
