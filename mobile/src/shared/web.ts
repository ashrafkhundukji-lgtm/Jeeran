// The only door from the app into the website's code. Everything imported
// here is plain data or pure functions (no React, no Next, no Supabase), so
// the app and the website share one source for their strings and rules.
// src/shared/web.test.ts checks that this stays true.
export { DASHBOARD_COPY, type DashboardCopy } from '../../../src/lib/i18n/dashboard'
export { OWNER_UI_COPY, fill, type OwnerUiCopy } from '../../../src/lib/i18n/ownerUi'
export {
  LOGIN_COPY,
  SIGNUP_COPY,
  FORGOT_COPY,
  MIN_PASSWORD_LENGTH,
  type AuthErrorCopy,
} from '../../../src/lib/i18n/auth'
export { LOCALES, isLocale, type Locale } from '../../../src/lib/i18n/locale'
export { CATEGORIES, CATEGORY_LABELS } from '../../../src/lib/categories'
export { campaignErrorCopyFor } from '../../../src/lib/campaignErrors'

// Files reachable through the exports above. Kept here so the guard test
// can check each one.
export const SHARED_WEB_FILES = [
  'src/lib/i18n/dashboard.ts',
  'src/lib/i18n/ownerUi.ts',
  'src/lib/i18n/auth.ts',
  'src/lib/i18n/trial.ts',
  'src/lib/i18n/locale.ts',
  'src/lib/categories.ts',
  'src/lib/campaignErrors.ts',
]
