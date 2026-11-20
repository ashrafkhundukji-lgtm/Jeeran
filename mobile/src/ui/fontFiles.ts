import { fonts } from './theme'

// Loaded at startup by the root layout (also embedded natively by the
// expo-font config plugin in app.json).
export const FONT_FILES = {
  [fonts.display.medium]: require('../../assets/fonts/ReadexPro-Medium.ttf'),
  [fonts.display.semibold]: require('../../assets/fonts/ReadexPro-SemiBold.ttf'),
  [fonts.display.bold]: require('../../assets/fonts/ReadexPro-Bold.ttf'),
  [fonts.body.regular]: require('../../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
  [fonts.body.medium]: require('../../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
  [fonts.body.semibold]: require('../../assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
  [fonts.body.bold]: require('../../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
}
