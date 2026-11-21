import type { AuthErrorCopy } from '../shared/web'

// Same mapping as the website's authErrorReason (src/components/auth/
// AuthForm.tsx, a client component the app cannot import): Supabase error →
// one of our friendly, translated reasons. Never shows Supabase's raw text.
export type AuthErrorReason = keyof AuthErrorCopy

export function authErrorReason(error: { code?: string; name?: string; message?: string; status?: number }): AuthErrorReason {
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials'
    case 'email_not_confirmed':
      return 'emailNotConfirmed'
    case 'user_already_exists':
    case 'email_exists':
      return 'emailTaken'
    case 'email_address_invalid':
      return 'invalidEmail'
    case 'weak_password':
      return 'weakPassword'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rateLimited'
  }
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'network'
  if (/invalid login credentials/i.test(error.message ?? '')) return 'invalidCredentials'
  return 'generic'
}

export function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}
