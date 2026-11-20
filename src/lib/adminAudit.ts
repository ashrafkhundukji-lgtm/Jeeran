import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Who did what, when, from the admin area (admin_audit_log, see
// supabase/migrations/20261121_security_open_routes.sql). Written with the
// service role after requireAdminApi() has confirmed the caller.
export type AdminAction = 'shop.freeze' | 'shop.unfreeze' | 'settings.update'

export async function logAdminAction(user: User, action: AdminAction, targetBusinessId: string | null, details: Record<string, unknown> = {}) {
  const { error } = await supabaseAdmin.from('admin_audit_log').insert({
    actor_user_id: user.id,
    actor_email: user.email ?? null,
    action,
    target_business_id: targetBusinessId,
    details,
  })
  if (error) throw new Error(`admin audit log write failed: ${error.message}`)
}
