import { headers } from 'next/headers'

// iPhone/iPad/iPod from the request's User-Agent — read server-side, nothing
// stored or sent anywhere. Used only to swap the Google Wallet button for an
// honest "iPhone is coming soon" notice (no Apple Wallet pass yet). iPadOS
// in desktop mode reports a Mac user agent and is not caught; it gets the
// desktop page, as before.
export async function isIOSRequest(): Promise<boolean> {
  const ua = (await headers()).get('user-agent') ?? ''
  return /\b(iPhone|iPad|iPod)\b/i.test(ua)
}
