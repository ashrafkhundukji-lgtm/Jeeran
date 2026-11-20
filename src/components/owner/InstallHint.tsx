'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { OWNER_APP_COPY } from '@/lib/i18n/ownerApp'
import { OWNER_UI_COPY } from '@/lib/i18n/ownerUi'
import { CloseIcon, InstallIcon, ShareIcon } from '@/components/customer/icons'
import { isIOS, isStandalone } from '@/lib/push/client'
import { BTN_GHOST, BTN_PRIMARY, Card } from './ui'
import { subscribeFlags, useClientValue } from './useClientValue'

const DISMISS_KEY = 'jeeran:install-banner-dismissed-at'
const DISMISS_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0)
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}

function dismissFor30Days() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // Private mode: the banner just comes back next visit.
  }
  window.dispatchEvent(new Event('jeeran:flags'))
}

// Owner dashboard install banner.
//  - Android/Chrome-family: shown only once the browser fires
//    beforeinstallprompt (= installable and not installed); "Install" opens
//    the browser's own install dialog.
//  - iPhone/iPad, not installed: a short Add to Home Screen guide (iOS has
//    no install event, and push only works from the Home Screen app).
// Hidden when running installed, and for 30 days after "Later"/close.
export default function InstallHint() {
  const [locale] = useLocale()
  const copy = OWNER_APP_COPY[locale].install
  const common = OWNER_UI_COPY[locale].common
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const dismissed = useClientValue(dismissedRecently, true, subscribeFlags)
  const standalone = useClientValue(isStandalone, true)
  const ios = useClientValue(isIOS, false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice.catch(() => null)
    setPromptEvent(null)
    if (choice?.outcome === 'dismissed') dismissFor30Days()
  }

  if (dismissed || standalone || installed) return null
  if (!ios && !promptEvent) return null

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3" data-testid={ios ? 'ios-install-guide' : 'install-banner'}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-navy">
          <InstallIcon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{ios ? copy.iosTitle : copy.title}</p>
          {ios ? (
            <>
              <p className="mt-0.5 text-sm leading-relaxed text-brand-muted">{copy.iosBody}</p>
              <ol className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed">
                {copy.iosSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      {step}
                      {i === 0 && <ShareIcon size={16} className="ms-1 inline-block align-[-3px] text-brand-navy" />}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm leading-relaxed text-brand-muted">{copy.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={install} className={`${BTN_PRIMARY} !min-h-11 !px-4 !text-sm`}>
                  {copy.add}
                </button>
                <button type="button" onClick={dismissFor30Days} className={BTN_GHOST}>
                  {copy.later}
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismissFor30Days}
          aria-label={common.dismiss}
          className="-me-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-muted active:bg-brand-tint"
        >
          <CloseIcon size={20} />
        </button>
      </div>
    </Card>
  )
}
