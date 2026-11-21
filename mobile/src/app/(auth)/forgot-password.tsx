import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { supabase } from '~/lib/supabase'
import { config } from '~/lib/config'
import { authErrorReason, looksLikeEmail, type AuthErrorReason } from '~/auth/authErrors'
import { AuthFrame, TextLink } from '~/screens/auth/AuthFrame'
import { Button, Field, Notice } from '~/ui/kit'
import { MessageView } from '~/ui/layout'

const RESEND_COOLDOWN_SECONDS = 60

// Reuses the website's reset flow: the email link opens
// <website>/reset-password, where the new password is set; the owner then
// logs in here with it. Same neutral message whether or not the email has
// an account.
export default function ForgotPasswordScreen() {
  const { forgot: copy } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function send() {
    if (loading || cooldown > 0) return
    setError(null)
    if (!looksLikeEmail(email)) {
      setError('invalidEmail')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${config.apiUrl}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError(authErrorReason(err))
      return
    }
    setSent(true)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  if (sent) {
    return (
      <AuthFrame title={copy.sentTitle}>
        <MessageView icon="mail" title={copy.sentTitle} body={copy.sentBody} />
        {error ? <Notice tone="danger">{copy.errors[error]}</Notice> : null}
        <Button
          label={cooldown > 0 ? copy.resendIn(cooldown) : loading ? copy.submitting : copy.resend}
          onPress={send}
          disabled={cooldown > 0}
          loading={loading}
          tone="secondary"
        />
        <TextLink label={copy.backToLogin} onPress={() => router.replace('/login')} />
      </AuthFrame>
    )
  }

  return (
    <AuthFrame title={copy.title} subtitle={copy.subtitle}>
      {error && error !== 'invalidEmail' ? <Notice tone="danger">{copy.errors[error]}</Notice> : null}
      <Field
        label={copy.emailLabel}
        value={email}
        onChangeText={setEmail}
        error={error === 'invalidEmail' ? copy.errors.invalidEmail : null}
        ltr
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        onSubmitEditing={send}
      />
      <Button label={loading ? copy.submitting : copy.submit} onPress={send} loading={loading} disabled={!email.trim()} />
      <TextLink label={copy.backToLogin} onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
    </AuthFrame>
  )
}
