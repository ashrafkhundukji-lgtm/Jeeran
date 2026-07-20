import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getBillingAccountForUser } from '@/lib/billing/account'
import { getStripeClient, StripeNotConfiguredError } from '@/lib/billing/stripe'
import { findCatalogEntryByPriceId } from '@/lib/billing/catalog'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const priceId: string | undefined = body?.price_id
  if (!priceId) return NextResponse.json({ error: 'price_id is required' }, { status: 400 })

  const catalogEntry = findCatalogEntryByPriceId(priceId)
  if (!catalogEntry) return NextResponse.json({ error: 'Unknown price_id' }, { status: 400 })

  const account = await getBillingAccountForUser(supabase, user.id)
  if (!account) {
    return NextResponse.json({ error: 'No business account found for this user' }, { status: 404 })
  }

  try {
    const stripe = getStripeClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const metadata = {
      accountType: account.type,
      accountId: account.id,
      catalogKey: catalogEntry.key,
      creditsGranted: String(catalogEntry.creditsGranted),
    }

    const session = await stripe.checkout.sessions.create({
      mode: catalogEntry.mode,
      line_items: [{ price: catalogEntry.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      customer: account.stripeCustomerId ?? undefined,
      customer_email: account.stripeCustomerId ? undefined : (user.email ?? undefined),
      // Stripe only auto-creates a Customer for subscription mode; for a
      // one-time payment (topup) it wouldn't otherwise create one unless
      // told to, and we want a stripe_customer_id on file either way.
      customer_creation: catalogEntry.mode === 'payment' && !account.stripeCustomerId ? 'always' : undefined,
      metadata,
      // Checkout session metadata doesn't propagate to the subscription
      // object itself — invoice.paid/customer.subscription.deleted events
      // reference the subscription, not the session, so it needs its own copy.
      subscription_data: catalogEntry.mode === 'subscription' ? { metadata } : undefined,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }
    console.error('billing/checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
