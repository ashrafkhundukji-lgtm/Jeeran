import { Redirect, Stack } from 'expo-router'
import { useAuth } from '~/auth/AuthProvider'
import { colors } from '~/ui/theme'

export const unstable_settings = { initialRouteName: 'login' }

export default function AuthLayout() {
  const { session } = useAuth()
  // Signed in (login, signup with an instant session): go to the owner app.
  if (session) return <Redirect href="/" />
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />
}
