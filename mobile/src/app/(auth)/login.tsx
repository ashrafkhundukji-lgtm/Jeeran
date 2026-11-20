import { useState } from 'react'
import { router } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { supabase } from '~/lib/supabase'
import { authErrorReason, type AuthErrorReason } from '~/auth/authErrors'
import { AuthFrame, TextLink } from '~/screens/auth/AuthFrame'
import { Button, Field, Notice } from '~/ui/kit'

export default function LoginScreen() {
  const { login: copy } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (loading) return
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    // On success the session listener moves the app to the owner screens.
    if (err) setError(authErrorReason(err))
  }

  const fieldError = error === 'invalidEmail' ? copy.errors.invalidEmail : null
  return (
    <AuthFrame title={copy.title} subtitle={copy.subtitle}>
      {error && error !== 'invalidEmail' ? <Notice tone="danger">{copy.errors[error]}</Notice> : null}
      <Field
        label={copy.emailLabel}
        value={email}
        onChangeText={setEmail}
        error={fieldError}
        ltr
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        testID="login-email"
      />
      <Field
        label={copy.passwordLabel}
        value={password}
        onChangeText={setPassword}
        secure
        ltr
        showLabel={copy.showPassword}
        hideLabel={copy.hidePassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        testID="login-password"
      />
      <Button
        label={loading ? copy.submitting : copy.submit}
        onPress={submit}
        loading={loading}
        disabled={!email.trim() || !password}
        testID="login-submit"
      />
      <TextLink label={copy.forgotLink} onPress={() => router.push('/forgot-password')} />
      <TextLink prompt={copy.noAccount} label={copy.signUpLink} onPress={() => router.replace('/signup')} />
    </AuthFrame>
  )
}
