// One-off seed script: adds test shops adjacent to "Super Cut" so the
// matchmaking test use case (cross-category ads shown, same-category
// competitors excluded) has real data to exercise.
//
// Usage: node scripts/seed-adjacent-shops.mjs
// Reads Supabase creds from .env.local (not committed).

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TEST_PASSWORD = 'JeeranTest123!'

// Clustered within ~150m of Super Cut (24.708474, 46.683658) to simulate a
// small shopping strip of adjacent shops.
const SHOPS = [
  {
    email: 'sparkle.dryclean@jeeran.local',
    fullName: 'Sparkle Dry Clean Owner',
    businessName: 'Sparkle Dry Clean',
    category: 'dry-clean',
    latitude: 24.7087,
    longitude: 46.6839,
    campaign: { title: '15% off dry cleaning this week', description: 'Bring in 3+ items and save 15%.', bidPerView: 4 },
  },
  {
    email: 'alrawda.hardware@jeeran.local',
    fullName: 'Al Rawda Hardware Owner',
    businessName: 'Al Rawda Hardware',
    category: 'hardware',
    latitude: 24.7082,
    longitude: 46.6834,
    campaign: { title: 'Free tool rental with purchases over 50 SAR', description: 'Ask staff for details in-store.', bidPerView: 3 },
  },
  {
    email: 'beanbarber.cafe@jeeran.local',
    fullName: 'Bean & Barber Cafe Owner',
    businessName: 'Bean & Barber Café',
    category: 'cafe',
    latitude: 24.709,
    longitude: 46.6842,
    campaign: { title: 'Buy 1 Get 1 Free Iced Coffee', description: 'Valid all day, every day this month.', bidPerView: 6 },
  },
  {
    email: 'prestige.barbershop@jeeran.local',
    fullName: 'Prestige Barbershop Owner',
    businessName: 'Prestige Barbershop',
    category: 'salon',
    latitude: 24.7079,
    longitude: 46.6831,
    campaign: { title: 'First haircut 25% off', description: 'New customers only.', bidPerView: 5 },
  },
]

async function main() {
  for (const shop of SHOPS) {
    console.log(`\n--- ${shop.businessName} ---`)

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: shop.email,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    let userId
    if (createErr) {
      if (createErr.code === 'email_exists' || /already registered/i.test(createErr.message)) {
        const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
        if (listErr) throw listErr
        const existing = list.users.find((u) => u.email === shop.email)
        if (!existing) throw createErr
        userId = existing.id
        console.log(`user already exists: ${userId}`)
      } else {
        throw createErr
      }
    } else {
      userId = created.user.id
      console.log(`created user: ${userId}`)
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, full_name: shop.fullName, role: 'owner' })
    if (profileErr) throw profileErr

    const { data: existingBiz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    let businessId
    if (existingBiz) {
      businessId = existingBiz.id
      console.log(`business already exists: ${businessId}`)
    } else {
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          name: shop.businessName,
          category: shop.category,
          latitude: shop.latitude,
          longitude: shop.longitude,
        })
        .select('id')
        .single()
      if (bizErr) throw bizErr
      businessId = biz.id
      console.log(`created business: ${businessId}`)
    }

    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('creator_type', 'business')
      .eq('creator_id', businessId)
      .eq('is_active', true)
      .maybeSingle()

    if (existingCampaign) {
      console.log(`active campaign already exists: ${existingCampaign.id}`)
    } else {
      const { data: campaign, error: campaignErr } = await supabase
        .from('campaigns')
        .insert({
          creator_type: 'business',
          creator_id: businessId,
          title: shop.campaign.title,
          description: shop.campaign.description,
          bid_per_view: shop.campaign.bidPerView,
          is_active: true,
        })
        .select('id')
        .single()
      if (campaignErr) throw campaignErr
      console.log(`created campaign: ${campaign.id}`)
    }
  }

  console.log(`\nDone. Test login password for all seeded owners: ${TEST_PASSWORD}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
