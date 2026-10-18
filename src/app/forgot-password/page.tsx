'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { FORGOT_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import {
  AuthHeading,
  AuthShell,
  EmailField,
  ErrorAlert,
  SubmitButton,
  SwitchLink,
  authErrorReason,
  type AuthErrorReason,
} from '@/components/auth/AuthForm'
import { MailIcon } from '@/components/customer/icons'

const RESEND_COOLDOWN_SECONDS = 60

// Requests a password-reset email. The confirmation is the same whether or
// not the email has an account, so the page can't be used to find out who
// is registered. The emailed link lands on /reset-password (this origin, so
// production and preview deployments each send people back to themselves —
// both must be in Supabase's Redirect URLs allow-list).
export default function ForgotPasswordPage() {
  const [locale, setLocale] = useLocale()
  const copy = FORGOT_COPY[locale]
  const dir = getDir(locale)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendLink() {
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)

    if (error) {
      // Only show errors that say nothing about whether the account exists:
      // a malformed address, or the request never reaching Supabase. Others
      // (rate limits in particular, which only trigger once an email really
      // was sent) fall through to the same neutral confirmation.
      const reason = authErrorReason(error)
      if (reason === 'invalidEmail' || reason === 'network') {
        setError(reason)
        return
      }
    }

    setSent(true)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  const shell = {
    locale,
    dir,
    onLocaleChange: setLocale,
    sideHeading: copy.sideHeading,
    sideBody: copy.sideBody,
    sidePhotoAlt: copy.sidePhotoAlt,
  }

  if (sent) {
    return (
      <AuthShell {...shell}>
        <div role="status" className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-navy">
            <MailIcon size={26} strokeWidth={1.8} />
          </span>
          <h1 className="mb-2 font-display text-[26px] leading-[1.3] font-bold text-brand-navy-deep">{copy.sentTitle}</h1>
          <p className="m-0 text-[15px] leading-[1.7] text-brand-muted">{copy.sentBody}</p>
        </div>
        {error && (
          <div className="mt-5">
            <ErrorAlert>{copy.errors[error]}</ErrorAlert>
          </div>
        )}
        <button
          type="button"
          onClick={sendLink}
          disabled={cooldown > 0 || loading}
          aria-busy={loading}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-[14px] border-[1.5px] border-brand-line bg-white px-4 font-display font-semibold text-brand-navy hover:bg-brand-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-not-allowed disabled:text-brand-muted"
        >
          {cooldown > 0 ? copy.resendIn(cooldown) : loading ? copy.submitting : copy.resend}
        </button>
        <SwitchLink prompt="" href="/login" label={copy.backToLogin} />
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell}>
      <AuthHeading title={copy.title} subtitle={copy.subtitle} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendLink()
        }}
      >
        {error && (
          <div id="auth-error">
            <ErrorAlert>{copy.errors[error]}</ErrorAlert>
          </div>
        )}
        <EmailField
          label={copy.emailLabel}
          value={email}
          onChange={setEmail}
          invalid={error === 'invalidEmail'}
          describedBy={error ? 'auth-error' : undefined}
        />
        <SubmitButton loading={loading} label={copy.submit} loadingLabel={copy.submitting} />
      </form>
      <SwitchLink prompt="" href="/login" label={copy.backToLogin} />
    </AuthShell>
  )
}
