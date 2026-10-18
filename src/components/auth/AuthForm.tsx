'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import type { Locale } from '@/lib/i18n/locale'
import type { AuthErrorCopy } from '@/lib/i18n/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BrandLockup from '@/components/BrandLockup'
import { AlertIcon, CheckIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/customer/icons'

// Shared look for /login and /signup (approved mockup:
// downloads/handoff/landing-auth/auth.html). Presentation only — each page
// keeps its own Supabase call, validation and redirects.

export type AuthErrorReason = keyof AuthErrorCopy

// Maps a Supabase AuthError to one of our friendly, translated messages.
// Codes per Supabase's auth error reference; the message check covers
// older responses that carry no code.
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

// Which field an error is about, for aria-invalid / the red border.
export function errorField(reason: AuthErrorReason | null): 'email' | 'password' | null {
  if (reason === 'emailTaken' || reason === 'invalidEmail') return 'email'
  if (reason === 'weakPassword') return 'password'
  return null
}

export function AuthShell({
  locale,
  dir,
  onLocaleChange,
  sideHeading,
  sideBody,
  sidePhotoAlt,
  children,
}: {
  locale: Locale
  dir: 'rtl' | 'ltr'
  onLocaleChange: (l: Locale) => void
  sideHeading: string
  sideBody: string
  sidePhotoAlt: string
  children: ReactNode
}) {
  return (
    <div dir={dir} lang={locale} className="grid min-h-dvh grid-cols-[minmax(0,1fr)] bg-brand-cream font-body text-[#1B2147] lg:grid-cols-2">
      {/* Desktop only: the street photo with a one-line message. */}
      <aside className="relative isolate hidden items-end overflow-hidden bg-brand-navy-deep p-10 text-white lg:flex">
        <Image src="/landing/street.jpg" alt={sidePhotoAlt} fill sizes="50vw" className="-z-20 object-cover object-[35%_50%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(18,41,107,0.92),rgba(18,41,107,0.25)_65%)]" />
        <div className="max-w-[30em]">
          <p className="mb-2 font-display text-[30px] leading-[1.35] font-bold text-balance">{sideHeading}</p>
          <p className="m-0 text-base text-brand-tint">{sideBody}</p>
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-[440px] flex-col justify-center px-[22px] pt-6 pb-9">
        <div className="mb-8 flex items-center gap-3">
          <BrandLockup locale={locale} />
          <div className="ms-auto">
            <LanguageSwitcher locale={locale} onChange={onLocaleChange} />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="mb-1.5 font-display text-[28px] leading-[1.3] font-bold text-brand-navy-deep">{title}</h1>
      <p className="mb-6 text-[15px] leading-[1.7] text-brand-muted">{subtitle}</p>
    </>
  )
}

export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#E6F4EA] px-3.5 py-3 text-sm leading-relaxed text-[#14532D]">
      <CheckIcon size={20} strokeWidth={2} className="mt-px flex-none" />
      <span>{children}</span>
    </div>
  )
}

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl bg-[#FDEEE9] px-3.5 py-3 text-sm leading-relaxed text-[#8A2410]">
      <AlertIcon size={20} strokeWidth={1.8} className="mt-px flex-none" />
      <span>{children}</span>
    </div>
  )
}

const FIELD_BOX =
  'flex min-h-[52px] items-center gap-2.5 rounded-[14px] border-[1.5px] bg-white px-3.5 text-brand-muted transition-shadow motion-reduce:transition-none focus-within:border-brand-navy focus-within:shadow-[0_0_0_4px_rgba(30,58,138,0.12)]'
const INPUT = 'min-w-0 flex-1 self-stretch bg-transparent text-base text-[#1B2147] outline-none placeholder:text-[#68708E] rtl:text-right'

export function EmailField({
  label,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  invalid: boolean
  describedBy?: string
}) {
  return (
    <div className="mb-4">
      <label htmlFor="email" className="mb-1.5 block font-display text-sm font-semibold text-brand-navy-deep">
        {label}
      </label>
      <div className={`${FIELD_BOX} ${invalid ? 'border-brand-coral' : 'border-brand-line'}`}>
        <MailIcon size={20} strokeWidth={1.8} className="flex-none" />
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          required
          placeholder="name@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={INPUT}
        />
      </div>
    </div>
  )
}

export function PasswordField({
  id = 'password',
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
  invalid,
  showLabel,
  hideLabel,
  describedBy,
  children,
}: {
  id?: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  minLength?: number
  hint?: string
  invalid: boolean
  showLabel: string
  hideLabel: string
  describedBy?: string
  // Extra line under the field (e.g. login's "Forgot password?" link).
  children?: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  const hintId = hint ? `${id}-hint` : undefined
  const described = [describedBy, hintId].filter(Boolean).join(' ') || undefined
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block font-display text-sm font-semibold text-brand-navy-deep">
        {label}
      </label>
      <div className={`${FIELD_BOX} pe-1 ${invalid ? 'border-brand-coral' : 'border-brand-line'}`}>
        <LockIcon size={20} strokeWidth={1.8} className="flex-none" />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          dir="ltr"
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={described}
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={id}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-brand-muted hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-navy"
        >
          {visible ? <EyeOffIcon size={20} strokeWidth={1.8} /> : <EyeIcon size={20} strokeWidth={1.8} />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] text-brand-muted">
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-brand-coral font-display text-[17px] font-semibold text-white transition-colors hover:bg-[#B5330F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none"
    >
      {loading && (
        <span aria-hidden="true" className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
      )}
      {loading ? loadingLabel : label}
    </button>
  )
}

export function SwitchLink({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <p className="mt-5 text-center text-[15px] text-brand-muted">
      {prompt}{' '}
      <a href={href} className="rounded font-semibold text-brand-navy underline underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy">
        {label}
      </a>
    </p>
  )
}
