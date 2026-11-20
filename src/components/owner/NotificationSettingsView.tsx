'use client'

import { useCallback, useEffect, useState } from 'react'
import OwnerShell, { OwnerTopBar } from '@/components/owner/OwnerShell'
import Switch from '@/components/owner/Switch'
import { BTN_PRIMARY, BTN_SECONDARY, Card, Notice, SectionHeading } from '@/components/owner/ui'
import { AlertIcon, CheckIcon, InfoIcon, LockIcon, ShareIcon, SmartphoneIcon } from '@/components/customer/icons'
import { useLocale } from '@/lib/i18n/useLocale'
import { DASHBOARD_COPY } from '@/lib/i18n/dashboard'
import { INTL_LOCALE } from '@/lib/i18n/ownerUi'
import { OWNER_APP_COPY, type PrefType } from '@/lib/i18n/ownerApp'
import { currentSubscription, isIOS, isStandalone, pushSupported, subscribeThisDevice, unsubscribeThisDevice } from '@/lib/push/client'

const TYPES: PrefType[] = ['redeemed', 'earned', 'signups', 'offer_status', 'trial']

type Prefs = Record<PrefType, boolean>
interface Device {
  id: string
  endpoint: string
  user_agent_label: string | null
  created_at: string
}

type Env = 'checking' | 'unsupported' | 'ios-not-installed' | 'ok'
type Flash = { tone: 'info' | 'warning' | 'success'; text: string } | null

export default function NotificationSettingsView() {
  const [locale] = useLocale()
  const copy = OWNER_APP_COPY[locale].settings
  const install = OWNER_APP_COPY[locale].install
  const back = DASHBOARD_COPY[locale].common.back

  const [env, setEnv] = useState<Env>('checking')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [busy, setBusy] = useState<'on' | 'test' | string | null>(null)
  const [flash, setFlash] = useState<Flash>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/owner/push/preferences', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { prefs: Prefs; devices: Device[] }
    setPrefs(data.prefs)
    setDevices(data.devices)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ios = isIOS()
      let next: Env
      if (ios && !isStandalone()) next = 'ios-not-installed'
      else if (!pushSupported()) next = 'unsupported'
      else next = 'ok'
      const sub = next === 'ok' ? await currentSubscription().catch(() => null) : null
      await load().catch(() => setFlash({ tone: 'warning', text: copy.error }))
      if (cancelled) return
      setEnv(next)
      if (next === 'ok') setPermission(Notification.permission)
      setThisEndpoint(sub?.endpoint ?? null)
    })()
    return () => {
      cancelled = true
    }
    // copy.error only matters for the message text; load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const subscribedHere = !!thisEndpoint && devices.some((d) => d.endpoint === thisEndpoint)

  async function turnOn() {
    setBusy('on')
    setFlash(null)
    const outcome = await subscribeThisDevice(locale)
    setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default')
    if (outcome === 'subscribed') {
      const sub = await currentSubscription()
      setThisEndpoint(sub?.endpoint ?? null)
      await load().catch(() => {})
    } else if (outcome === 'dismissed') setFlash({ tone: 'info', text: copy.dismissed })
    else if (outcome === 'unsupported') setEnv('unsupported')
    else if (outcome === 'not-configured') setFlash({ tone: 'warning', text: copy.notConfigured })
    else if (outcome === 'error') setFlash({ tone: 'warning', text: copy.error })
    setBusy(null)
  }

  async function turnOff(device: Device) {
    setBusy(device.id)
    setFlash(null)
    let ok: boolean
    if (device.endpoint === thisEndpoint) {
      ok = await unsubscribeThisDevice().catch(() => false)
      setThisEndpoint(null)
    } else {
      const res = await fetch('/api/owner/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: device.id }),
      }).catch(() => null)
      ok = !!res?.ok
    }
    if (!ok) setFlash({ tone: 'warning', text: copy.error })
    await load().catch(() => {})
    setBusy(null)
  }

  async function sendTest() {
    setBusy('test')
    setFlash(null)
    const res = await fetch('/api/owner/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thisEndpoint ? { endpoint: thisEndpoint } : {}),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setFlash(res?.ok && body.ok ? { tone: 'success', text: copy.testSent } : { tone: 'warning', text: copy.testFailed })
    setBusy(null)
  }

  async function toggle(type: PrefType, value: boolean) {
    if (!prefs) return
    const previous = prefs
    setPrefs({ ...prefs, [type]: value })
    const res = await fetch('/api/owner/push/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [type]: value, locale }),
    }).catch(() => null)
    if (!res?.ok) {
      setPrefs(previous)
      setFlash({ tone: 'warning', text: copy.saveFailed })
    }
  }

  const fmtDate = (iso: string) => new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  const blockedText = isIOS() ? copy.blockedIos : /android/i.test(typeof navigator === 'undefined' ? '' : navigator.userAgent) ? copy.blockedAndroid : copy.blockedOther

  return (
    <OwnerShell tab="profile" header={<OwnerTopBar variant="subpage" title={copy.heading} backHref="/dashboard/profile" backLabel={back} />}>
      <div className="flex flex-col gap-6" data-testid="notification-settings">
        <Card className="p-5">
          <h2 className="font-display text-[18px] font-semibold text-brand-navy-deep">{copy.introTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-brand-muted">{copy.introBody}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {TYPES.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[15px] leading-snug">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-navy">
                  <CheckIcon size={13} strokeWidth={3} />
                </span>
                <span>{copy.types[t].label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5" aria-live="polite">
            {env === 'checking' && <div className="h-12 animate-pulse rounded-2xl bg-brand-tint motion-reduce:animate-none" />}

            {env === 'unsupported' && (
              <Notice tone="warning" icon={<AlertIcon size={20} />}>
                {copy.unsupported}
              </Notice>
            )}

            {env === 'ios-not-installed' && (
              <div className="rounded-2xl bg-brand-tint px-4 py-3.5" data-testid="ios-settings-guide">
                <p className="text-[15px] font-semibold text-brand-navy-deep">{copy.iosTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-navy-deep">{copy.iosBody}</p>
                <ol className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-brand-navy-deep">
                  {install.iosSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        {step}
                        {i === 0 && <ShareIcon size={16} className="ms-1 inline-block align-[-3px] text-brand-navy" />}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {env === 'ok' && permission === 'denied' && (
              <Notice tone="warning" icon={<LockIcon size={20} />}>
                <p className="font-semibold">{copy.blockedTitle}</p>
                <p className="mt-0.5">{blockedText}</p>
              </Notice>
            )}

            {env === 'ok' && permission !== 'denied' && !subscribedHere && (
              <button type="button" onClick={turnOn} disabled={busy === 'on'} aria-busy={busy === 'on'} className={`${BTN_PRIMARY} w-full`}>
                {busy === 'on' ? copy.turningOn : copy.turnOn}
              </button>
            )}

            {env === 'ok' && permission !== 'denied' && subscribedHere && (
              <div className="flex flex-col gap-3">
                <Notice tone="success" icon={<CheckIcon size={20} />}>
                  {copy.onHere}
                </Notice>
                <button type="button" onClick={sendTest} disabled={busy === 'test'} aria-busy={busy === 'test'} className={`${BTN_SECONDARY} w-full`}>
                  {busy === 'test' ? copy.sending : copy.sendTest}
                </button>
              </div>
            )}

            {flash && (
              <Notice tone={flash.tone} icon={flash.tone === 'success' ? <CheckIcon size={20} /> : <InfoIcon size={20} />} className="mt-3">
                {flash.text}
              </Notice>
            )}
          </div>
        </Card>

        <section>
          <SectionHeading>{copy.typesHeading}</SectionHeading>
          <Card className="divide-y divide-brand-line">
            {TYPES.map((t) => (
              <div key={t} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">{copy.types[t].label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-brand-muted">{copy.types[t].hint}</p>
                </div>
                <Switch checked={prefs ? prefs[t] : true} disabled={!prefs} onChange={(v) => toggle(t, v)} label={copy.types[t].label} />
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionHeading>{copy.devicesHeading}</SectionHeading>
          {devices.length === 0 ? (
            <p className="text-sm text-brand-muted">{copy.noDevices}</p>
          ) : (
            <Card className="divide-y divide-brand-line">
              {devices.map((d) => {
                const here = d.endpoint === thisEndpoint
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3" data-testid={here ? 'this-device' : 'device'}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-navy">
                      <SmartphoneIcon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug">
                        {here ? copy.thisDevice : copy.otherDevice}
                        {d.user_agent_label && <span className="font-normal text-brand-muted" dir="ltr"> · {d.user_agent_label}</span>}
                      </p>
                      <p className="mt-0.5 text-[13px] text-brand-muted">{copy.addedOn(fmtDate(d.created_at))}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => turnOff(d)}
                      disabled={busy === d.id}
                      className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand-coral active:bg-brand-coral-tint disabled:opacity-50"
                    >
                      {copy.turnOff}
                    </button>
                  </div>
                )
              })}
            </Card>
          )}
        </section>

        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-brand-muted">
          <LockIcon size={16} className="mt-0.5 shrink-0" />
          <span>{copy.privacy}</span>
        </p>
      </div>
    </OwnerShell>
  )
}
