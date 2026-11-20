// Design tokens: the website's owner palette (navy / coral / cream) and its
// two typefaces. Every screen reads colours, spacing and type from here.

export const colors = {
  navy: '#1E3A8A',
  navyDeep: '#12296B',
  coral: '#CF3B19', // text/buttons on light backgrounds (AA contrast)
  coralBright: '#FF6B4A', // accents, the pin in the mark
  coralTint: '#FDECE7',
  cream: '#FFF8F1',
  line: '#EDE3D6',
  muted: '#5A6385',
  tint: '#EAF0FC',
  white: '#FFFFFF',
  ink: '#12296B',
  success: '#1D7A4C',
  successTint: '#E3F4EA',
  warning: '#8A5A00',
  warningTint: '#FFF3D6',
  danger: '#B42318',
  dangerTint: '#FDE8E6',
  overlay: 'rgba(18, 41, 107, 0.45)',
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const

// Android needs one family per weight for custom fonts (fontWeight on a
// custom family is ignored or faked). Names are the TTF file names, which is
// what the expo-font config plugin and useFonts register.
export const fonts = {
  display: { medium: 'ReadexPro-Medium', semibold: 'ReadexPro-SemiBold', bold: 'ReadexPro-Bold' },
  body: {
    regular: 'IBMPlexSansArabic-Regular',
    medium: 'IBMPlexSansArabic-Medium',
    semibold: 'IBMPlexSansArabic-SemiBold',
    bold: 'IBMPlexSansArabic-Bold',
  },
} as const

export const type = {
  title: { fontFamily: fonts.display.bold, fontSize: 24, lineHeight: 34 },
  heading: { fontFamily: fonts.display.semibold, fontSize: 18, lineHeight: 28 },
  subheading: { fontFamily: fonts.display.medium, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.body.regular, fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.body.semibold, fontSize: 15, lineHeight: 24 },
  small: { fontFamily: fonts.body.regular, fontSize: 13, lineHeight: 20 },
  smallStrong: { fontFamily: fonts.body.semibold, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.body.medium, fontSize: 14, lineHeight: 22 },
  number: { fontFamily: fonts.display.bold, fontSize: 34, lineHeight: 44 },
  button: { fontFamily: fonts.body.semibold, fontSize: 16, lineHeight: 24 },
} as const

export type TypeVariant = keyof typeof type

// Minimum touch target (Material: 48dp).
export const TOUCH = 48
