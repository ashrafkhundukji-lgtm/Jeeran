import { useState } from 'react'
import { router } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { supabase } from '~/lib/supabase'
import { authErrorReason, type AuthErrorReason } from '~/auth/authErrors'
import { AuthFrame, TextLink } from '~/screens/auth/AuthFrame'
import { Button, Field, Notice } from '~/ui/kit'
import { MessageView } from '~/ui/layout'
import { MIN_PASSWORD_LENGTH } from '~/shared/web'

// Same flow as the website's /signup: Supabase signUp, and if Supabase wants
// the email confirmed (no session back), a neutral "check your email"
// screen that does not reveal whether the address already had an account.
export default function SignupScreen() {
  const { signup: copy } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<AuthErrorReason | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function submit() {
    if (loading) return
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('weakPassword')
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (err) {
      setError(authErrorReason(err))
      return
    }
    // With a session, the session listener moves on to onboarding.
    if (!data.session) setNeedsConfirmation(true)
  }

  if (needsConfirmation) {
    return (
      <AuthFrame title={copy.confirmationTitle}>
        <MessageView icon="mail" title={copy.confirmationTitle} body={copy.confirmationNotice} />
        <Button label={copy.confirmationLogin} onPress={() => router.replace('/login')} />
        <Button label={copy.confirmationReset} tone="secondary" onPress={() => router.push('/forgot-password')} />
      </AuthFrame>
    )
  }

  const emailError = error === 'emailTaken' || error === 'invalidEmail' ? copy.errors[error] : null
  const passwordError = error === 'weakPassword' ? copy.errors.weakPassword : null
  const otherError = error && !emailError && !passwordError ? copy.errors[error] : null

  return (
    <AuthFrame title={copy.title} subtitle={copy.subtitle}>
      {otherError ? <Notice tone="danger">{otherError}</Notice> : null}
      <Field
        label={copy.emailLabel}
        value={email}
        onChangeText={setEmail}
        error={emailError}
        ltr
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        testID="signup-email"
      />
      <Field
        label={copy.passwordLabel}
        hint={copy.passwordHint}
        error={passwordError}
        value={password}
        onChangeText={setPassword}
        secure
        ltr
        showLabel={copy.showPassword}
        hideLabel={copy.hidePassword}
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
        testID="signup-password"
      />
      <Notice tone="info">{copy.setupNote}</Notice>
      <Button
        label={loading ? copy.submitting : copy.submit}
        onPress={submit}
        loading={loading}
        disabled={!email.trim() || !password}
        tone="coral"
        testID="signup-submit"
      />
      <TextLink prompt={copy.haveAccount} label={copy.loginLink} onPress={() => router.replace('/login')} />
    </AuthFrame>
  )
}
