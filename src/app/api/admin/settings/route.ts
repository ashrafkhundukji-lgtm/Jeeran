import { NextRequest, NextResponse } from 'next/server'
import { getPromotionThresholds, updatePromotionThresholds } from '@/lib/promotion'

export const dynamic = 'force-dynamic'

// No auth gate here — matches the admin overview page's current posture
// ("no login required yet, do not expose this URL publicly", see
// src/app/api/admin/shops/[id]/freeze/route.ts's identical comment). Worth
// flagging specifically for this route more than the others: unlike the
// read-only admin views or a single-shop freeze toggle, this one changes
// ranking-affecting config (and, as of Phase 4 item 9, milestone bonus
// amounts) for the whole platform. Lock down alongside the rest of /admin
// when admin auth is added.
export async function GET() {
  const thresholds = await getPromotionThresholds()
  return NextResponse.json(thresholds)
}

export async function PATCH(req: NextRequest) {
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

  await updatePromotionThresholds(fields)
  return NextResponse.json({ success: true })
}
