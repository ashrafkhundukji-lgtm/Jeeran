'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { MIN_PASSWORD_LENGTH, RESET_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import {
  AuthHeading,
  AuthShell,
  ErrorAlert,
  PasswordField,
  SubmitButton,
  SwitchLink,
  authErrorReason,
  type AuthErrorReason,
} from '@/components/auth/AuthForm'
import { AlertIcon } from '@/components/customer/icons'

type Phase = 'checking' | 'ready' | 'invalid'

// Landing page for the password-reset email link. Accepts both link shapes
// Supabase can send:
//   ?code=…                       — the default template with this app's PKCE
//                                   browser client. The client exchanges it
//                                   on startup (detectSessionInUrl); this
//                                   only works in the browser that asked for
//                                   the link, which holds the PKCE verifier.
//   ?token_hash=…&type=recovery   — the recommended template
//                                   ({{ .TokenHash }}); verified here with
//                                   verifyOtp, so it works on any device.
// Supabase reports a used/expired link as ?error=… / #error=… instead.
// Without one of these the page shows "invalid link" rather than a form, so
// it can't be used to change a password without a recovery link.
export default function ResetPasswordPage() {
  const router = useRouter()
  const [locale, setLocale] = useLocale()
  const copy = RESET_COPY[locale]
  const dir = getDir(locale)

  const [phase, setPhase] = useState<Phase>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const url = new URL(window.location.href)
    const query = url.searchParams
    const hash = new URLSearchParams(url.hash.slice(1))
    const tokenHash = query.get('token_hash')
    const type = query.get('type')
    const code = query.get('code')
    const linkError = query.get('error') || hash.get('error') || query.get('error_code') || hash.get('error_code')

    async function establish(): Promise<boolean> {
      if (linkError) return false
      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
        return !error
      }
      if (code) {
        // getSession() waits for the client's own startup exchange of ?code=.
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) return true
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        return !error
      }
      return false
    }

    establish().then((ok) => {
      setPhase(ok ? 'ready' : 'invalid')
      // Keep the one-time token out of the address bar and history.
      if (tokenHash || code || url.hash) window.history.replaceState(null, '', '/reset-password')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(authErrorReason(error))
      setLoading(false)
      return
    }

    // End the recovery session (and any others) and have the owner log in
    // with the new password, which also proves it works.
    await supabase.auth.signOut()
    router.replace('/login?reset=success')
  }

  const shell = {
    locale,
    dir,
    onLocaleChange: setLocale,
    sideHeading: copy.sideHeading,
    sideBody: copy.sideBody,
    sidePhotoAlt: copy.sidePhotoAlt,
  }

  if (phase === 'checking') {
    return (
      <AuthShell {...shell}>
        <p role="status" className="flex items-center justify-center gap-3 py-10 text-brand-muted">
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-brand-navy/25 border-t-brand-navy motion-reduce:animate-none" />
          {copy.checking}
        </p>
      </AuthShell>
    )
  }

  if (phase === 'invalid') {
    return (
      <AuthShell {...shell}>
        <div role="alert" className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDEEE9] text-[#8A2410]">
            <AlertIcon size={26} strokeWidth={1.8} />
          </span>
          <h1 className="mb-2 font-display text-[26px] leading-[1.3] font-bold text-brand-navy-deep">{copy.invalidTitle}</h1>
          <p className="m-0 text-[15px] leading-[1.7] text-brand-muted">{copy.invalidBody}</p>
        </div>
        <a
          href="/forgot-password"
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-[14px] bg-brand-coral font-display text-[17px] font-semibold text-white hover:bg-[#B5330F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
        >
          {copy.requestNew}
        </a>
        <SwitchLink prompt="" href="/login" label={copy.backToLogin} />
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell}>
      <AuthHeading title={copy.title} subtitle={copy.subtitle} />
      <form onSubmit={handleSubmit}>
        {error && (
          <div id="auth-error">
            <ErrorAlert>{copy.errors[error]}</ErrorAlert>
          </div>
        )}
        <PasswordField
          id="new-password"
          label={copy.newPasswordLabel}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={copy.passwordHint}
          invalid={error === 'weakPassword'}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
          describedBy={error ? 'auth-error' : undefined}
        />
        <PasswordField
          id="confirm-password"
          label={copy.confirmPasswordLabel}
          value={confirm}
          onChange={(v) => {
            setConfirm(v)
            if (mismatch) setMismatch(false)
          }}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          invalid={mismatch}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
          describedBy={mismatch ? 'mismatch-error' : undefined}
        >
          {mismatch && (
            <p id="mismatch-error" role="alert" className="mt-1.5 text-[13px] font-medium text-[#8A2410]">
              {copy.mismatch}
            </p>
          )}
        </PasswordField>
        <SubmitButton loading={loading} label={copy.submit} loadingLabel={copy.submitting} />
      </form>
    </AuthShell>
  )
}
