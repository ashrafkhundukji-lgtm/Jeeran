'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/useLocale'
import { OWNER_UI_COPY } from '@/lib/i18n/ownerUi'
import { CloseIcon, InstallIcon } from '@/components/customer/icons'
import { BTN_PRIMARY, Card } from './ui'
import { readFlag, subscribeFlags, useClientValue, writeFlag } from './useClientValue'

const DISMISS_KEY = 'jeeran:install-hint-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// "Add to home screen" hint for owners (they open the dashboard daily).
// Chrome/Samsung/Edge fire beforeinstallprompt (needs the dashboard
// manifest, see src/app/dashboard/layout.tsx) → a real Add button. iOS
// Safari has no such event, so it gets the Share → Add to Home Screen
// instruction instead. Hidden when already installed (standalone) or once
// dismissed on this device.
export default function InstallHint() {
  const [locale] = useLocale()
  const copy = OWNER_UI_COPY[locale]
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const dismissed = useClientValue(() => readFlag(DISMISS_KEY), true, subscribeFlags)
  const standalone = useClientValue(
    () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    true,
  )
  const ios = useClientValue(() => /iphone|ipad|ipod/i.test(navigator.userAgent), false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice.catch(() => null)
    setPromptEvent(null)
  }

  if (dismissed || standalone || (!ios && !promptEvent)) return null

  return (
    <Card className="flex items-start gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-navy">
        <InstallIcon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{copy.install.title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-brand-muted">{ios ? copy.install.iosBody : copy.install.body}</p>
        {promptEvent && (
          <button type="button" onClick={install} className={`${BTN_PRIMARY} mt-3 !min-h-11 !px-4 !text-sm`}>
            {copy.install.add}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => writeFlag(DISMISS_KEY)}
        aria-label={copy.common.dismiss}
        className="-me-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-muted active:bg-brand-tint"
      >
        <CloseIcon size={20} />
      </button>
    </Card>
  )
}
