import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Platform, Pressable, View } from 'react-native'
import { router, useNavigation, usePreventRemove } from 'expo-router'
import { useI18n } from '~/i18n/I18nProvider'
import { useOwnerData } from '~/data/OwnerDataProvider'
import { ApiError, type Campaign } from '~/lib/apiClient'
import {
  BID_MAX,
  BID_MIN,
  DESCRIPTION_MAX,
  TITLE_MAX,
  TRANSLATION_KEYS,
  addDays,
  clampBid,
  formFromCampaign,
  offerToday,
  runway,
  toCampaignInput,
  validateOffer,
  type OfferForm as Form,
  type TranslationKey,
} from '~/lib/offers'
import { LOCALES, fill } from '~/shared/web'
import { Icon } from '~/ui/Icon'
import { Button, Card, Field, Notice, Txt } from '~/ui/kit'
import { Screen, ScreenHeader } from '~/ui/layout'
import { colors, radius, space, TOUCH } from '~/ui/theme'
import { DateField } from './DateField'
import { errorMessage } from './errors'

// Create / edit an offer. Same POST /api/campaigns and PATCH
// /api/campaigns/[id] contracts and rules as the website's CampaignForm.
export function OfferForm({ campaign }: { campaign: Campaign | null }) {
  const { ui, dash, app, row, rtl } = useI18n()
  const f = ui.form
  const { summary, createCampaign, updateCampaign } = useOwnerData()
  const mode = campaign ? 'edit' : 'new'

  const initial = useMemo(() => formFromCampaign(campaign), [campaign])
  const [form, setForm] = useState<Form>(initial)
  const [showErrors, setShowErrors] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [translationsOpen, setTranslationsOpen] = useState(() => TRANSLATION_KEYS.some((k) => initial.translations[k]))
  const [saved, setSaved] = useState(false)
  const navigation = useNavigation()

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((s) => ({ ...s, [k]: v }))
  const setTr = (k: TranslationKey, v: string) => setForm((s) => ({ ...s, translations: { ...s.translations, [k]: v } }))
  const errors = validateOffer(form)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const credits = summary?.business.ad_credits ?? 0
  const views = runway(credits, form.bid)
  const otherActive = summary?.campaigns.some((c) => c.is_active && c.id !== campaign?.id) ?? false

  // Unsaved changes: confirm before leaving (Android back, header back).
  usePreventRemove(dirty && !saved && Platform.OS !== 'web', ({ data }) => {
    Alert.alert(f.discardTitle, f.discardBody, [
      { text: f.keepEditing, style: 'cancel' },
      { text: f.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ])
  })

  async function submit() {
    setFormError('')
    setShowErrors(true)
    if (errors.length) return
    setSaving(true)
    try {
      const input = toCampaignInput(form)
      if (campaign) await updateCampaign(campaign.id, input)
      else await createCampaign(input)
      // Leave on the next render, once the unsaved-changes guard is off.
      setSaved(true)
    } catch (e) {
      const fallback = mode === 'edit' ? dash.campaigns.toggleError : dash.campaigns.createError
      setFormError(e instanceof ApiError ? errorMessage(e, { ui, dash }, fallback) : fallback)
      setSaving(false)
    }
  }

  useEffect(() => {
    if (saved) router.back()
  }, [saved])

  function preset(days: number) {
    const start = offerToday()
    setForm((s) => ({ ...s, startDate: start, endDate: addDays(start, days) }))
  }

  return (
    <Screen
      header={<ScreenHeader title={mode === 'edit' ? f.titleEdit : f.titleNew} back />}
      footer={
        <Button
          label={mode === 'edit' ? (saving ? f.saving : f.save) : saving ? f.creating : f.create}
          tone="coral"
          loading={saving}
          onPress={submit}
          testID="offer-submit"
        />
      }
    >
      {mode === 'new' && otherActive ? <Notice tone="warning">{f.activeWarning}</Notice> : null}
      {formError ? <Notice tone="danger">{formError}</Notice> : null}

      <Field
        label={f.titleLabel}
        placeholder={f.titleHint}
        value={form.title}
        onChangeText={(v) => set('title', v)}
        maxLength={TITLE_MAX}
        error={showErrors && errors.includes('title_required') ? f.required : null}
        testID="offer-title"
      />
      <Field
        label={f.descriptionLabel}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        maxLength={DESCRIPTION_MAX}
        multiline
        testID="offer-description"
      />

      {form.imageUrl ? (
        <Card padded={false} style={{ overflow: 'hidden', gap: 0 }}>
          <Image source={{ uri: form.imageUrl }} style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.tint }} accessibilityIgnoresInvertColors />
          <View style={{ padding: space.md, gap: space.sm }}>
            <Txt variant="small" color={colors.muted}>
              {app.offers.imageKept}
            </Txt>
            <Button label={f.imageRemove} icon="x" tone="danger" onPress={() => set('imageUrl', null)} />
          </View>
        </Card>
      ) : null}

      {/* Price per view: 2–10 credits */}
      <Card>
        <Txt variant="label">{f.bidLabel}</Txt>
        <View style={{ flexDirection: row, alignItems: 'center', gap: space.md }}>
          <StepButton icon="minus" label={f.bidLess} disabled={form.bid <= BID_MIN} onPress={() => set('bid', clampBid(form.bid - 1))} testID="bid-minus" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="number" align="center" testID="bid-value">
              {String(form.bid)}
            </Txt>
            <Txt variant="small" color={colors.muted} align="center">
              {fill(f.bidValue, { n: form.bid })}
            </Txt>
          </View>
          <StepButton icon="plus" label={f.bidMore} disabled={form.bid >= BID_MAX} onPress={() => set('bid', clampBid(form.bid + 1))} testID="bid-plus" />
        </View>
        <View style={{ flexDirection: row, justifyContent: 'space-between' }}>
          <Txt variant="small" color={colors.muted}>
            {f.bidLess}
          </Txt>
          <Txt variant="small" color={colors.muted}>
            {f.bidMore}
          </Txt>
        </View>
        <Txt variant="small" color={colors.muted}>
          {f.bidExplain}
        </Txt>
        <Notice tone={views > 0 ? 'info' : 'warning'}>
          {views > 0 ? fill(f.bidEstimate, { n: views, balance: credits }) : f.bidEstimateNone}
        </Notice>
      </Card>

      {/* Dates (Saudi calendar days, inclusive) */}
      <Card>
        <Txt variant="label">{f.datesLabel}</Txt>
        <View style={{ flexDirection: row, gap: space.sm, flexWrap: 'wrap' }}>
          <PresetChip label={f.presetToday} onPress={() => preset(0)} />
          <PresetChip label={f.presetWeek} onPress={() => preset(7)} />
          <PresetChip label={f.presetMonth} onPress={() => preset(30)} />
        </View>
        <DateField label={f.start} value={form.startDate} emptyLabel={f.noStart} onChange={(v) => set('startDate', v)} clearLabel={f.clear} testID="offer-start" />
        <DateField label={f.end} value={form.endDate} emptyLabel={f.noEnd} onChange={(v) => set('endDate', v)} clearLabel={f.clear} testID="offer-end" />
        {errors.includes('end_before_start') ? <Notice tone="danger">{f.endError}</Notice> : null}
        <Txt variant="small" color={colors.muted}>
          {f.datesHint}
        </Txt>
      </Card>

      {/* Optional own translations */}
      <Pressable
        onPress={() => setTranslationsOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: translationsOpen }}
        style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', minHeight: TOUCH }}
      >
        <Txt variant="bodyStrong" color={colors.navy}>
          {f.translationsHeading}
        </Txt>
        <Icon name={translationsOpen ? 'minus' : 'plus'} rtl={rtl} />
      </Pressable>
      {translationsOpen ? (
        <View style={{ gap: space.md }}>
          <Txt variant="small" color={colors.muted}>
            {f.translationsHint}
          </Txt>
          {LOCALES.map((l) => (
            <Card key={l.code}>
              <Txt variant="label">{l.label}</Txt>
              <Field
                label={f.titleLabel}
                value={form.translations[`title_${l.code}` as TranslationKey]}
                onChangeText={(v) => setTr(`title_${l.code}` as TranslationKey, v)}
                maxLength={TITLE_MAX}
              />
              <Field
                label={f.descriptionLabel}
                value={form.translations[`description_${l.code}` as TranslationKey]}
                onChangeText={(v) => setTr(`description_${l.code}` as TranslationKey, v)}
                maxLength={DESCRIPTION_MAX}
                multiline
              />
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  )
}

function StepButton({ icon, label, onPress, disabled, testID }: { icon: 'plus' | 'minus'; label: string; onPress: () => void; disabled: boolean; testID?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.tint : colors.white,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name={icon} size={24} />
    </Pressable>
  )
}

function PresetChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 40,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.line,
        justifyContent: 'center',
        backgroundColor: pressed ? colors.tint : colors.white,
      })}
    >
      <Txt variant="smallStrong" color={colors.navy} align="center">
        {label}
      </Txt>
    </Pressable>
  )
}
