// Build-time configuration. EXPO_PUBLIC_* values are inlined into the
// bundle when it is built (from mobile/.env.local, see .env.example), so
// only public values may be used: the Supabase URL and anon key, and the
// website's address. No secret ever goes here.

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'https://jeeran.vercel.app').replace(/\/+$/, ''),
}

export const configMissing: string[] = [
  !config.supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
  !config.supabaseAnonKey && 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
].filter((x): x is string => Boolean(x))
