'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { LOGIN_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SiteLogo from '@/components/SiteLogo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [locale, setLocale] = useLocale()
  const copy = LOGIN_COPY[locale]
  const dir = getDir(locale)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(searchParams.get('redirect') || '/dashboard')
    router.refresh()
  }

  return (
    <div dir={dir} className="min-h-screen">
      <div className="max-w-sm mx-auto pt-8 px-4 flex items-center justify-between">
        <SiteLogo className="h-14" />
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 px-4 flex flex-col gap-3">
        <h1 className="text-xl font-semibold mb-2">{copy.title}</h1>
        <input
          type="email"
          required
          placeholder={copy.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder={copy.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF6B4A] text-white rounded-lg py-2 text-sm font-medium transition-colors hover:bg-[#e85a3b] disabled:opacity-50"
        >
          {loading ? copy.submitting : copy.submit}
        </button>
        <p className="text-sm text-neutral-500 text-center">
          {copy.noAccount}{' '}
          <a href="/signup" className="underline">
            {copy.signUpLink}
          </a>
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
