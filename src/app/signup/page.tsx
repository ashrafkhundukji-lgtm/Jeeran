'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SIGNUP_COPY } from '@/lib/i18n/auth'
import { getDir } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/useLocale'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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
      <div dir={dir} className="max-w-sm mx-auto mt-24 px-4 text-center">
        <p className="text-sm text-neutral-600">{copy.confirmationNotice}</p>
      </div>
    )
  }

  return (
    <div dir={dir} className="min-h-screen">
      <div className="max-w-sm mx-auto pt-8 px-4 flex justify-end">
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
          minLength={6}
          placeholder={copy.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? copy.submitting : copy.submit}
        </button>
        <p className="text-sm text-neutral-500 text-center">
          {copy.haveAccount}{' '}
          <a href="/login" className="underline">
            {copy.loginLink}
          </a>
        </p>
      </form>
    </div>
  )
}
