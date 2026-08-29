'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SIGNUP_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'
import Backdrop from '@/components/Backdrop'

export default function SignupPage() {
  const router = useRouter()
  const [locale, setLocale] = useLocale()
  const copy = SIGNUP_COPY[locale]
  const dir = getDir(locale)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
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

  if (needsConfirmation) {
    return (
      <div dir={dir} className="relative min-h-screen overflow-hidden bg-[#FBFCFD] text-[#1a1a1a]">
        <Backdrop />
        <div className="relative z-10 mx-auto mt-24 max-w-sm px-4 text-center">
          <div className="mb-6 flex justify-center">
            <SiteLogo className="h-14 sm:h-16" />
          </div>
          <p className="text-sm text-[#5a5a5a]">{copy.confirmationNotice}</p>
        </div>
      </div>
    )
  }

  return (
    <div dir={dir} className="min-h-screen bg-[#FBFCFD] text-[#1a1a1a]">
      {/* Mobile-native layout (<640px) — same reasoning as login/page.tsx:
          a plain full-screen centered form, no decorative backdrop. */}
      <div className="flex min-h-screen flex-col sm:hidden">
        <div dir="ltr" className="flex justify-end p-5">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>

        <div className="flex flex-1 flex-col justify-center px-7">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B5BC4] shadow-[0_10px_20px_-10px_rgba(30,58,138,0.5)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9l1-5h14l1 5" />
              <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
              <path d="M5 9v10h14V9" />
            </svg>
          </div>

          <h1 className="mb-1 font-[family-name:var(--font-archivo)] text-[28px] font-black tracking-[-0.01em]">
            {copy.title}
          </h1>
          <p className="mb-7 text-sm text-[#5a5a5a]">{copy.subtitle}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder={copy.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-[#e5e5e5] px-4 py-3.5 text-[15px] focus:border-[#1E3A8A] focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-[#e5e5e5] px-4 py-3.5 text-[15px] focus:border-[#1E3A8A] focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#FF6B4A] py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_24px_-8px_rgba(255,107,74,0.5)] transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
            >
              {loading ? copy.submitting : copy.submit}
            </button>
            <p className="text-center text-sm text-[#5a5a5a]">
              {copy.haveAccount}{' '}
              <a href="/login" className="text-[#1E3A8A] underline">
                {copy.loginLink}
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Desktop layout (>=640px) — unchanged from before. */}
      <div className="relative hidden min-h-screen overflow-hidden sm:block">
        <Backdrop />

        {/* z-20: the language switcher's dropdown must paint above the form
            below it, not get hidden behind it — see LandingPage.tsx for the
            full explanation of this z-index sibling-stacking gotcha. */}
        <div dir="ltr" className="relative z-20 mx-auto flex max-w-sm items-center justify-between px-4 pt-8">
          <SiteLogo className="h-14 sm:h-16" />
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 mx-auto mt-16 flex max-w-sm flex-col gap-3 px-4">
          <h1 className="mb-2 font-[family-name:var(--font-archivo)] text-2xl font-black tracking-[-0.01em]">
            {copy.title}
          </h1>
          <input
            type="email"
            required
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[10px] border border-[#e5e5e5] px-3 py-2 text-sm focus:border-[#1E3A8A] focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[10px] border border-[#e5e5e5] px-3 py-2 text-sm focus:border-[#1E3A8A] focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-[10px] bg-[#FF6B4A] py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-8px_rgba(255,107,74,0.5)] transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
          >
            {loading ? copy.submitting : copy.submit}
          </button>
          <p className="text-center text-sm text-[#5a5a5a]">
            {copy.haveAccount}{' '}
            <a href="/login" className="text-[#1E3A8A] underline">
              {copy.loginLink}
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
