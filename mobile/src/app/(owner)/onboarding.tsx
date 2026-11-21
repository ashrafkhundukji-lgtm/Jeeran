import { useState } from 'react'
import { Pressable, View } from 'react-native'
import * as Location from 'expo-location'
import { useI18n } from '~/i18n/I18nProvider'
import { useAuth } from '~/auth/AuthProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { ApiError } from '~/lib/apiClient'
import { CATEGORIES, CATEGORY_LABELS, fill } from '~/shared/web'
import { CATEGORY_ICON, Icon } from '~/ui/Icon'
import { Button, Card, Field, Notice, Txt } from '~/ui/kit'
import { Screen, ScreenHeader } from '~/ui/layout'
import { colors, radius, space, TOUCH } from '~/ui/theme'

const TOTAL_STEPS = 3

// Same three steps and the same single POST /api/onboarding as the
// website: (1) your name + shop name, (2) location, (3) category.
export default function OnboardingScreen() {
  const { dash, ui, app, locale, row } = useI18n()
  const copy = dash.onboarding
  const { api, signOut } = useAuth()
  const { refresh } = useOwnerData()

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function useMyLocation() {
    setLocationError('')
    setLocating(true)
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') {
        setLocationError(app.onboarding.locationDenied)
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    } catch {
      setLocationError(app.onboarding.locationFailed)
    } finally {
      setLocating(false)
    }
  }

  async function finish() {
    setSaving(true)
    setError('')
    try {
      await api.onboard({
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        category,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      })
      await refresh()
    } catch (e) {
      // Already onboarded (another device, a double tap): just load the shop.
      if (e instanceof ApiError && e.status === 409) {
        await refresh()
        return
      }
      setError(e instanceof ApiError && e.isNetwork ? ui.redeem.networkBody : copy.error)
      setSaving(false)
    }
  }

  const step1Valid = fullName.trim() !== '' && businessName.trim() !== ''
  const [heading, subtitle] = [
    [copy.step1Heading, copy.step1Subtitle],
    [copy.step2Heading, copy.step2Subtitle],
    [copy.step3Heading, copy.step3Subtitle],
  ][step - 1]

  return (
    <Screen
      header={
        <ScreenHeader
          title={fill(copy.stepCounter, { n: step })}
          back
          onBack={() => (step === 1 ? signOut() : setStep((s) => s - 1))}
        />
      }
      footer={
        <View style={{ gap: space.sm }}>
          {step === 2 && !coords ? <Button label={app.onboarding.skipLocation} tone="ghost" onPress={() => setStep(3)} /> : null}
          <Button
            label={step < TOTAL_STEPS ? copy.continueButton : saving ? copy.savingSetup : copy.finishSetup}
            tone="coral"
            disabled={step === 1 && !step1Valid}
            loading={saving}
            onPress={() => (step < TOTAL_STEPS ? setStep((s) => s + 1) : finish())}
            testID="onboarding-continue"
          />
        </View>
      }
    >
      <View style={{ flexDirection: row, gap: space.xs }}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= step ? colors.coral : colors.line }} />
        ))}
      </View>
      <View style={{ gap: space.xs }}>
        <Txt variant="title" accessibilityRole="header">
          {heading}
        </Txt>
        <Txt color={colors.muted}>{subtitle}</Txt>
      </View>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {step === 1 ? (
        <View style={{ gap: space.lg }}>
          <Field label={copy.yourName} value={fullName} onChangeText={setFullName} autoComplete="name" testID="onboarding-name" />
          <Field label={copy.businessName} value={businessName} onChangeText={setBusinessName} testID="onboarding-business" />
        </View>
      ) : step === 2 ? (
        <Card>
          <View style={{ flexDirection: row, alignItems: 'center', gap: space.sm }}>
            <Icon name="pin" color={coords ? colors.success : colors.navy} />
            <Txt variant="bodyStrong" color={coords ? colors.success : colors.ink} style={{ flex: 1 }}>
              {coords ? copy.locationSet : copy.location}
            </Txt>
          </View>
          {coords ? (
            <Txt variant="small" color={colors.muted} align="left">
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Txt>
          ) : null}
          {locationError ? <Notice tone="warning">{locationError}</Notice> : null}
          <Button
            label={locating ? copy.findingYou : copy.useMyLocation}
            icon="navigation"
            tone="secondary"
            loading={locating}
            onPress={useMyLocation}
            testID="onboarding-locate"
          />
        </Card>
      ) : (
        <View accessibilityRole="radiogroup" style={{ flexDirection: row, flexWrap: 'wrap', gap: space.sm }}>
          {CATEGORIES.map((c) => {
            const selected = c === category
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={CATEGORY_LABELS[locale][c]}
                testID={`category-${c}`}
                style={{
                  width: '48%',
                  minHeight: TOUCH * 2,
                  borderRadius: radius.lg,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.navy : colors.line,
                  backgroundColor: selected ? colors.tint : colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: space.xs,
                  padding: space.md,
                }}
              >
                <Icon name={CATEGORY_ICON[c] ?? 'store'} size={28} />
                <Txt variant="bodyStrong" align="center">
                  {CATEGORY_LABELS[locale][c]}
                </Txt>
              </Pressable>
            )
          })}
        </View>
      )}
    </Screen>
  )
}
