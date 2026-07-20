import { createClient } from '@supabase/supabase-js'

// Admin client — uses service_role key, SERVER ONLY, never expose to browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
