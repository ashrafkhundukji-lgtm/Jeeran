import { NextRequest, NextResponse } from 'next/server'
import { getPromotionThresholds, updatePromotionThresholds } from '@/lib/promotion'
import { requireAdminApi } from '@/lib/adminAuth'
import { logAdminAction } from '@/lib/adminAudit'

export const dynamic = 'force-dynamic'

// Admins only (ADMIN_EMAILS, src/lib/adminAuth.ts). PATCH changes
// ranking and milestone bonus config for the whole platform, so every
// change is written to admin_audit_log.
export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) return admin.response
  const thresholds = await getPromotionThresholds()
  return NextResponse.json(thresholds)
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminApi()
  if (!admin.ok) return admin.response
  const body = await req.json().catch(() => null)
  const silverThreshold = Number(body?.silverThreshold)
  const goldThreshold = Number(body?.goldThreshold)
  const platinumThreshold = Number(body?.platinumThreshold)
  const bidTiebreakRange = Number(body?.bidTiebreakRange)
  const silverMilestoneBonus = Number(body?.silverMilestoneBonus)
  const goldMilestoneBonus = Number(body?.goldMilestoneBonus)
  const platinumMilestoneBonus = Number(body?.platinumMilestoneBonus)

  const fields = {
    silverThreshold,
    goldThreshold,
    platinumThreshold,
    bidTiebreakRange,
    silverMilestoneBonus,
    goldMilestoneBonus,
    platinumMilestoneBonus,
  }
  for (const [name, value] of Object.entries(fields)) {
    if (!Number.isFinite(value) || value < 1) {
      return NextResponse.json({ error: `${name} must be a positive number` }, { status: 400 })
    }
  }
  if (!(silverThreshold < goldThreshold && goldThreshold < platinumThreshold)) {
    return NextResponse.json({ error: 'Thresholds must be strictly increasing: silver < gold < platinum' }, { status: 400 })
  }

  const before = await getPromotionThresholds()
  try {
    await logAdminAction(admin.user, 'settings.update', null, { before, after: fields })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not record the change; nothing was changed' }, { status: 500 })
  }
  await updatePromotionThresholds(fields)
  return NextResponse.json({ success: true })
}
