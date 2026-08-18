import { NextResponse } from 'next/server'
import { getAuthenticatedBusinessId } from '@/lib/business-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Clears the unseen-milestone flag once the owner has actually seen the
// dashboard announcement — last_milestone_tier itself is untouched (it's
// the permanent record of the highest tier ever awarded a bonus for);
// only the "still needs to be shown" pair gets cleared.
export async function POST() {
  const businessId = await getAuthenticatedBusinessId()
  if (!businessId) {
    return NextResponse.json({ error: 'not authenticated as a business' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update({ unseen_milestone_tier: null, unseen_milestone_bonus: null })
    .eq('id', businessId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
