import { redirect } from 'next/navigation'

// Old coupon links (already on customers' passes) point here: send them to
// the same screen inside the owner app scope, keeping claim + hash.
export default async function ValidateRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const key of ['claim', 'hash'] as const) {
    const value = params[key]
    if (typeof value === 'string') query.set(key, value)
  }
  const qs = query.toString()
  redirect(`/dashboard/validate${qs ? `?${qs}` : ''}`)
}
