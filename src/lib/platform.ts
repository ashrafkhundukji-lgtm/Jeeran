import { headers } from 'next/headers'

// iPhone/iPad/iPod from a User-Agent — read server-side, nothing stored or
// sent anywhere. There's no Apple Wallet pass yet, so these visitors get an
// honest "Android for now" notice instead of the Google Wallet button, and
// the membership create route refuses them before creating anything (no
// member row, no signup bonus). iPadOS in desktop mode reports a Mac user
// agent and is not caught; it gets the desktop page, as before.
export function isIOSUserAgent(ua: string | null | undefined): boolean {
  return /\b(iPhone|iPad|iPod)\b/i.test(ua ?? '')
}

export async function isIOSRequest(): Promise<boolean> {
  return isIOSUserAgent((await headers()).get('user-agent'))
}
