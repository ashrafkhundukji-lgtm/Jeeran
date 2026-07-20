import Stripe from 'stripe'

export class StripeNotConfiguredError extends Error {
  constructor(message = 'Billing is not configured') {
    super(message)
    this.name = 'StripeNotConfiguredError'
  }
}

let cachedClient: Stripe | null = null

// Lazy + cached so a missing key fails at request time with a clean error
// (mirrors src/lib/wallet/certificates.ts's WalletNotConfiguredError
// pattern) instead of crashing the whole process at import time — Stripe
// switching between test/live mode is just whichever secret key is set,
// nothing in this file needs to know which.
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new StripeNotConfiguredError()

  if (!cachedClient) {
    cachedClient = new Stripe(secretKey)
  }
  return cachedClient
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new StripeNotConfiguredError('Stripe webhook secret is not configured')
  return secret
}
