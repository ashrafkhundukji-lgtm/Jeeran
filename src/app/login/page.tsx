'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { LOGIN_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import {
  AuthHeading,
  AuthShell,
  EmailField,
  ErrorAlert,
  PasswordField,
  SuccessNotice,
  SubmitButton,
  SwitchLink,
  authErrorReason,
  errorField,
  type AuthErrorReason,
} from '@/components/auth/AuthForm'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [locale, setLocale] = useLocale()
  const copy = LOGIN_COPY[locale]
  const dir = getDir(locale)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // A reason, not Supabase's raw message — shown via copy.errors so it's
  // friendly and translated (see authErrorReason).
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(authErrorReason(error))
      setLoading(false)
      return
    }

    router.push(searchParams.get('redirect') || '/dashboard')
    router.refresh()
  }

  const field = errorField(error)
  // Set by /reset-password after a successful reset (it signs the recovery
  // session out and sends the owner here to log in with the new password).
  const resetDone = searchParams.get('reset') === 'success'

  return (
    <AuthShell
      locale={locale}
      dir={dir}
      onLocaleChange={setLocale}
      sideHeading={copy.sideHeading}
      sideBody={copy.sideBody}
      sidePhotoAlt={copy.sidePhotoAlt}
    >
      <AuthHeading title={copy.title} subtitle={copy.subtitle} />
      <form onSubmit={handleSubmit}>
        {resetDone && !error && <SuccessNotice>{copy.resetSuccess}</SuccessNotice>}
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
          autoComplete="current-password"
          invalid={field === 'password'}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
          describedBy={error ? 'auth-error' : undefined}
        >
          {/* No minLength here on purpose: accounts made under the old
              6-character rule must still be able to log in. */}
          <a
            href="/forgot-password"
            className="mt-2 inline-flex min-h-11 items-center rounded text-sm font-semibold text-brand-navy underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
          >
            {copy.forgotLink}
          </a>
        </PasswordField>
        <SubmitButton loading={loading} label={copy.submit} loadingLabel={copy.submitting} />
      </form>
      <SwitchLink prompt={copy.noAccount} href="/signup" label={copy.signUpLink} />
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
