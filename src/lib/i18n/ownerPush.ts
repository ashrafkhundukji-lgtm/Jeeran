// Owner push notifications: the text (ar/en/ur) and the payload builder.
//
// Self-contained on purpose (type-only imports): the unit tests run this
// file directly under Node (scripts/tests/owner-push.test.ts) without the
// Next bundler.
//
// Privacy: a payload carries only counts, the shop's own offer title and
// another shop's name. Never a customer name, phone number or location —
// the builder has no input through which one could arrive.

import type { Locale } from './locale'

export type OwnerPushType = 'redeemed' | 'earned' | 'signups' | 'offer_status' | 'trial' | 'test'

export type OfferStatusReason =
  | 'frozen'
  | 'subscription'
  | 'no_offer'
  | 'switched_off'
  | 'not_started'
  | 'ended'
  | 'credits'
  | 'unknown'

export type OwnerPushInput =
  | { type: 'redeemed'; offerTitle: string; creditsSpent: number }
  | { type: 'earned'; shopName: string; creditsEarned: number }
  | { type: 'signups'; count: number }
  | { type: 'offer_status'; reason: OfferStatusReason; offerId: string | null }
  | { type: 'trial'; trialEndsAt: string }
  | { type: 'test' }

export interface OwnerPushPayload {
  v: 1
  type: OwnerPushType
  title: string
  body: string
  tag: string
  url: string
  lang: Locale
  dir: 'rtl' | 'ltr'
}

const PUSH_LOCALES: readonly Locale[] = ['ar', 'en', 'ur']

// Owner's stored language, else Arabic (primary market).
export function resolvePushLocale(value: unknown): Locale {
  return typeof value === 'string' && (PUSH_LOCALES as readonly string[]).includes(value) ? (value as Locale) : 'ar'
}

const INTL: Record<Locale, string> = {
  ar: 'ar-u-ca-gregory-nu-latn',
  en: 'en-GB',
  ur: 'ur-u-ca-gregory-nu-latn',
}

type Copy = {
  redeemed: { title: string; body: (offer: string) => string; spent: (n: number) => string }
  earned: { title: string; body: (shop: string, n: number) => string }
  signups: { title: string; body: (n: number) => string }
  offerStatus: { title: string; reasons: Record<OfferStatusReason, string> }
  trial: { title: string; body: (date: string) => string }
  test: { title: string; body: string }
}

export const OWNER_PUSH_COPY: Record<Locale, Copy> = {
  ar: {
    redeemed: {
      title: 'تم استخدام عرضك',
      body: (offer) => `استخدم زبون عرض «${offer}».`,
      spent: (n) => ` خُصم من رصيدك: ${n}.`,
    },
    earned: {
      title: 'ربحت رصيدًا',
      body: (shop, n) => `زبون جاء عن طريقك استخدم عرضًا لدى ${shop}. أُضيف إلى رصيدك: ${n}.`,
    },
    signups: {
      title: 'زبائن جدد',
      body: (n) => `انضم زبائن جدد عبر رمز QR في محلك. العدد: ${n}.`,
    },
    offerStatus: {
      title: 'عرضك لم يعد يظهر للزبائن',
      reasons: {
        credits: 'رصيدك أقل من سعر عرضك. أضف رصيدًا ليظهر عرضك من جديد.',
        ended: 'انتهت مدة عرضك. عدّل التواريخ أو أنشئ عرضًا جديدًا.',
        not_started: 'لم يبدأ عرضك بعد. تحقق من تاريخ البداية.',
        switched_off: 'عرضك متوقف. شغّله ليظهر للزبائن.',
        no_offer: 'لا يوجد لديك عرض. أنشئ عرضًا ليظهر للزبائن.',
        subscription: 'انتهت فترة التجربة أو الاشتراك. اشترك ليظهر عرضك من جديد.',
        frozen: 'تم إيقاف حساب محلك. افتح التطبيق لمعرفة التفاصيل.',
        unknown: 'افتح التطبيق لمعرفة السبب.',
      },
    },
    trial: {
      title: 'التجربة المجانية تنتهي قريبًا',
      body: (date) => `تنتهي تجربتك في ${date}. اشترك ليبقى عرضك ظاهرًا للزبائن.`,
    },
    test: { title: 'جيران', body: 'الإشعارات تعمل على هذا الهاتف.' },
  },
  en: {
    redeemed: {
      title: 'Your offer was redeemed',
      body: (offer) => `A customer redeemed “${offer}”.`,
      spent: (n) => ` ${n} ${n === 1 ? 'credit' : 'credits'} spent.`,
    },
    earned: {
      title: 'You earned credits',
      body: (shop, n) => `A customer you brought redeemed an offer at ${shop}. +${n} ${n === 1 ? 'credit' : 'credits'}.`,
    },
    signups: {
      title: 'New customers',
      body: (n) => (n === 1 ? 'A new customer joined through your QR stand.' : `${n} new customers joined through your QR stand.`),
    },
    offerStatus: {
      title: 'Your offer stopped showing to customers',
      reasons: {
        credits: 'Your credits are below your offer’s price. Add credits to show it again.',
        ended: 'Your offer has ended. Change the dates or create a new offer.',
        not_started: 'Your offer hasn’t started yet. Check the start date.',
        switched_off: 'Your offer is switched off. Turn it on to show it to customers.',
        no_offer: 'You have no offer. Create one to show to customers.',
        subscription: 'Your trial or subscription has ended. Subscribe to show your offer again.',
        frozen: 'Your shop account is paused. Open the app for details.',
        unknown: 'Open the app to see why.',
      },
    },
    trial: {
      title: 'Your free trial ends soon',
      body: (date) => `Your trial ends on ${date}. Subscribe to keep your offer showing to customers.`,
    },
    test: { title: 'Jeeran', body: 'Notifications work on this phone.' },
  },
  ur: {
    redeemed: {
      title: 'آپ کی پیشکش استعمال ہوئی',
      body: (offer) => `ایک گاہک نے «${offer}» استعمال کی۔`,
      spent: (n) => ` آپ کے کریڈٹ سے کٹے: ${n}۔`,
    },
    earned: {
      title: 'آپ نے کریڈٹ کمائے',
      body: (shop, n) => `آپ کے لائے ہوئے گاہک نے ${shop} پر پیشکش استعمال کی۔ آپ کے کریڈٹ میں شامل: ${n}۔`,
    },
    signups: {
      title: 'نئے گاہک',
      body: (n) => `آپ کے QR اسٹینڈ کے ذریعے نئے گاہک شامل ہوئے۔ تعداد: ${n}۔`,
    },
    offerStatus: {
      title: 'آپ کی پیشکش گاہکوں کو نظر نہیں آ رہی',
      reasons: {
        credits: 'آپ کے کریڈٹ پیشکش کی قیمت سے کم ہیں۔ دوبارہ دکھانے کے لیے کریڈٹ شامل کریں۔',
        ended: 'آپ کی پیشکش ختم ہو گئی۔ تاریخیں بدلیں یا نئی پیشکش بنائیں۔',
        not_started: 'آپ کی پیشکش ابھی شروع نہیں ہوئی۔ شروع کی تاریخ دیکھیں۔',
        switched_off: 'آپ کی پیشکش بند ہے۔ گاہکوں کو دکھانے کے لیے اسے آن کریں۔',
        no_offer: 'آپ کی کوئی پیشکش نہیں۔ گاہکوں کو دکھانے کے لیے ایک بنائیں۔',
        subscription: 'آپ کا ٹرائل یا سبسکرپشن ختم ہو گیا۔ پیشکش دوبارہ دکھانے کے لیے سبسکرائب کریں۔',
        frozen: 'آپ کی دکان کا اکاؤنٹ روک دیا گیا ہے۔ تفصیل کے لیے ایپ کھولیں۔',
        unknown: 'وجہ جاننے کے لیے ایپ کھولیں۔',
      },
    },
    trial: {
      title: 'مفت ٹرائل جلد ختم ہو رہا ہے',
      body: (date) => `آپ کا ٹرائل ${date} کو ختم ہو گا۔ پیشکش دکھاتے رہنے کے لیے سبسکرائب کریں۔`,
    },
    test: { title: 'جیران', body: 'اس فون پر اطلاعات کام کر رہی ہیں۔' },
  },
}

// Shop-typed text inside a sentence: first-strong isolate so a Latin name
// in an Arabic sentence (or the reverse) can't reorder the punctuation, and
// a hard length cap so one long title can't push the payload over the
// push service limit.
function isolate(text: string, max = 60): string {
  const clean = text.replace(/[\u0000-\u001f⁦-⁩‪-‮]/g, ' ').trim()
  const cut = clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
  return `⁨${cut}⁩`
}

function count(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

// Where each notification opens. Always an owner path inside the app scope.
export function offerStatusUrl(reason: OfferStatusReason, offerId: string | null): string {
  switch (reason) {
    case 'credits':
    case 'subscription':
      return '/dashboard/billing'
    case 'frozen':
      return '/dashboard/frozen'
    case 'no_offer':
      return '/dashboard/owner/campaigns/new'
    case 'ended':
    case 'not_started':
    case 'switched_off':
      return offerId ? `/dashboard/owner/campaigns/${offerId}` : '/dashboard/owner'
    default:
      return '/dashboard/owner'
  }
}

export function buildOwnerPushPayload(input: OwnerPushInput, localeValue: unknown): OwnerPushPayload {
  const lang = resolvePushLocale(localeValue)
  const copy = OWNER_PUSH_COPY[lang]
  const dir = lang === 'en' ? 'ltr' : 'rtl'
  const base = { v: 1 as const, type: input.type, tag: `jeeran-${input.type}`, lang, dir: dir as 'rtl' | 'ltr' }

  switch (input.type) {
    case 'redeemed': {
      const n = count(input.creditsSpent)
      return {
        ...base,
        title: copy.redeemed.title,
        body: copy.redeemed.body(isolate(input.offerTitle)) + (n > 0 ? copy.redeemed.spent(n) : ''),
        url: '/dashboard/redeem',
      }
    }
    case 'earned':
      return {
        ...base,
        title: copy.earned.title,
        body: copy.earned.body(isolate(input.shopName, 40), count(input.creditsEarned)),
        url: '/dashboard/billing',
      }
    case 'signups':
      return { ...base, title: copy.signups.title, body: copy.signups.body(Math.max(1, count(input.count))), url: '/dashboard/owner' }
    case 'offer_status':
      return {
        ...base,
        title: copy.offerStatus.title,
        body: copy.offerStatus.reasons[input.reason] ?? copy.offerStatus.reasons.unknown,
        url: offerStatusUrl(input.reason, input.offerId),
      }
    case 'trial': {
      const date = new Intl.DateTimeFormat(INTL[lang], { day: 'numeric', month: 'long', timeZone: 'Asia/Riyadh' }).format(new Date(input.trialEndsAt))
      return { ...base, title: copy.trial.title, body: copy.trial.body(date), url: '/dashboard/billing' }
    }
    case 'test':
      return { ...base, title: copy.test.title, body: copy.test.body, url: '/dashboard/notifications' }
  }
}
