'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SIGNUP_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import {
  AuthHeading,
  AuthShell,
  EmailField,
  ErrorAlert,
  PasswordField,
  SubmitButton,
  SwitchLink,
  authErrorReason,
  errorField,
  type AuthErrorReason,
} from '@/components/auth/AuthForm'
import { CheckIcon, MailIcon } from '@/components/customer/icons'

export default function SignupPage() {
  const router = useRouter()
  const [locale, setLocale] = useLocale()
  const copy = SIGNUP_COPY[locale]
  const dir = getDir(locale)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // A reason, not Supabase's raw message — shown via copy.errors so it's
  // friendly and translated (see authErrorReason).
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(authErrorReason(error))
      setLoading(false)
      return
    }

    if (!data.session) {
      setNeedsConfirmation(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const shell = {
    locale,
    dir,
    onLocaleChange: setLocale,
    sideHeading: copy.sideHeading,
    sideBody: copy.sideBody,
    sidePhotoAlt: copy.sidePhotoAlt,
  }

  if (needsConfirmation) {
    return (
      <AuthShell {...shell}>
        <div role="status" className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-navy">
            <MailIcon size={26} strokeWidth={1.8} />
          </span>
          <h1 className="mb-2 font-display text-[26px] leading-[1.3] font-bold text-brand-navy-deep">{copy.confirmationTitle}</h1>
          <p className="m-0 text-[15px] leading-[1.7] text-brand-muted">{copy.confirmationNotice}</p>
        </div>
        <SwitchLink prompt="" href="/login" label={copy.loginLink} />
      </AuthShell>
    )
  }

  const field = errorField(error)

  return (
    <AuthShell {...shell}>
      <AuthHeading title={copy.title} subtitle={copy.subtitle} />
      <form onSubmit={handleSubmit}>
        {error && (
          <div id="auth-error">
            <ErrorAlert>{copy.errors[error]}</ErrorAlert>
          </div>
        )}
        <EmailField
          label={copy.emailLabel}
          value={email}
          onChange={setEmail}
          invalid={field === 'email'}
          describedBy={error ? 'auth-error' : undefined}
        />
        <PasswordField
          label={copy.passwordLabel}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={6}
          hint={copy.passwordHint}
          invalid={field === 'password'}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
          describedBy={error ? 'auth-error' : undefined}
        />
        <SubmitButton loading={loading} label={copy.submit} loadingLabel={copy.submitting} />
      </form>
      <p className="mt-4 flex items-start gap-2 text-[13.5px] leading-relaxed text-brand-muted">
        <CheckIcon size={18} strokeWidth={2} className="mt-0.5 flex-none text-brand-navy" />
        <span>{copy.setupNote}</span>
      </p>
      <SwitchLink prompt={copy.haveAccount} href="/login" label={copy.loginLink} />
    </AuthShell>
  )
}
