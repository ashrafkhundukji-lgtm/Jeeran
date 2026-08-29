import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStripeClient, getWebhookSecret, StripeNotConfiguredError } from '@/lib/billing/stripe'

// Needs Node crypto for signature verification — not edge-compatible.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let event: Stripe.Event

  try {
    const stripe = getStripeClient()
    const webhookSecret = getWebhookSecret()
    const signature = req.headers.get('stripe-signature')
    if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

    // Must be the raw body — constructEvent recomputes the HMAC over the
    // exact bytes Stripe sent, so parsing/re-serializing JSON first would
    // break verification.
    const rawBody = await req.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }
    console.error('billing/webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const accountType = session.metadata?.accountType
        const accountId = session.metadata?.accountId
        const creditsGranted = Number(session.metadata?.creditsGranted ?? 0)
        const addonKey = session.metadata?.addonKey

        if (accountType !== 'business') {
          console.error('billing/webhook: missing/invalid accountType metadata on session', session.id)
          break
        }
        if (!accountId) {
          console.error('billing/webhook: missing accountId metadata on session', session.id)
          break
        }

        const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null)
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : (session.subscription?.id ?? null)

        // Add-on purchase (e.g. instant_notify): a separate Stripe
        // subscription from the base plan, so this writes to business_addons
        // instead of businesses.stripe_customer_id/stripe_subscription_id —
        // see supabase/migrations/20260823_instant_notify_addon.sql for why
        // the two must never share a column (is_subscription_active gates
        // campaign eligibility in get_top_ads(); an add-on must not touch it).
        if (addonKey) {
          const { error: upsertError } = await supabaseAdmin.from('business_addons').upsert(
            {
              business_id: accountId,
              addon_key: addonKey,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            },
            { onConflict: 'business_id,addon_key' },
          )
          if (upsertError) console.error('billing/webhook business_addons upsert error:', upsertError.message)

          const { error } = await supabaseAdmin.rpc('record_addon_billing_event', {
            p_business_id: accountId,
            p_addon_key: addonKey,
            p_type: session.mode === 'subscription' ? 'subscription_initial' : 'topup',
            p_stripe_event_id: event.id,
            p_amount_usd: (session.amount_total ?? 0) / 100,
          })
          if (error) console.error('billing/webhook record_addon_billing_event error:', error.message)
          break
        }

        const table = 'businesses'
        if (customerId || subscriptionId) {
          await supabaseAdmin
            .from(table)
            .update({
              ...(customerId ? { stripe_customer_id: customerId } : {}),
              ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
            })
            .eq('id', accountId)
        }

        const { error } = await supabaseAdmin.rpc('record_billing_event', {
          p_account_type: accountType,
          p_account_id: accountId,
          p_type: session.mode === 'subscription' ? 'subscription_initial' : 'topup',
          p_stripe_event_id: event.id,
          p_amount_usd: (session.amount_total ?? 0) / 100,
          p_credits_granted: creditsGranted,
        })
        if (error) console.error('billing/webhook record_billing_event error:', error.message)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        // Newer Stripe API versions moved this from invoice.subscription to
        // invoice.parent.subscription_details.subscription.
        const subscriptionRef = invoice.parent?.subscription_details?.subscription
        const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id
        if (!subscriptionId) break

        const { data: business } = await supabaseAdmin
          .from('businesses')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        if (business) {
          // credits_granted is deliberately 0: a new subscription's *first*
          // invoice.paid fires alongside checkout.session.completed (which
          // already granted the one-time onboarding credits under a
          // different Stripe event id, so event-id dedup wouldn't catch a
          // double-grant here). Renewals only reaffirm active status and log
          // the ledger entry.
          const { error } = await supabaseAdmin.rpc('record_billing_event', {
            p_account_type: 'business',
            p_account_id: business.id,
            p_type: 'subscription_renewal',
            p_stripe_event_id: event.id,
            p_amount_usd: (invoice.amount_paid ?? 0) / 100,
            p_credits_granted: 0,
          })
          if (error) console.error('billing/webhook record_billing_event (renewal) error:', error.message)
          break
        }

        // Not the base subscription — check whether it's an add-on's
        // subscription instead (e.g. instant_notify) before giving up.
        const { data: addon } = await supabaseAdmin
          .from('business_addons')
          .select('business_id, addon_key')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        if (!addon) {
          console.error('billing/webhook: invoice.paid for unknown subscription', subscriptionId)
          break
        }

        const { error } = await supabaseAdmin.rpc('record_addon_billing_event', {
          p_business_id: addon.business_id,
          p_addon_key: addon.addon_key,
          p_type: 'subscription_renewal',
          p_stripe_event_id: event.id,
          p_amount_usd: (invoice.amount_paid ?? 0) / 100,
        })
        if (error) console.error('billing/webhook record_addon_billing_event (renewal) error:', error.message)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { error } = await supabaseAdmin.rpc('set_subscription_status', {
          p_stripe_subscription_id: subscription.id,
          p_active: false,
        })
        if (error) console.error('billing/webhook set_subscription_status error:', error.message)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('billing/webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
