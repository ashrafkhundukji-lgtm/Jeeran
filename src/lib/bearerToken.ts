// Parses an `Authorization` header for src/lib/requestAuth.ts. Kept apart
// (no imports) so it can be unit-tested without the Next/Supabase runtime.

// JWT shape: three base64url segments. Supabase access tokens are well
// under 4 KB; anything longer is not one of ours.
const BEARER_RE = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/
const MAX_TOKEN_LENGTH = 4096

// null: no Authorization header (use the cookie session).
// 'invalid': a header that is not a well-formed bearer token (401).
// Otherwise the raw token, still unverified.
export function bearerTokenFrom(header: string | null): string | null | 'invalid' {
  if (header == null) return null
  const value = header.trim()
  if (value === '') return 'invalid'
  const match = BEARER_RE.exec(value)
  if (!match || match[1].length > MAX_TOKEN_LENGTH) return 'invalid'
  return match[1]
}
