import { Archivo, Work_Sans } from 'next/font/google'

// Site-wide type system. Weights/subsets mirror the Claude Design source
// spec (docs/Jeeran Landing Redesign - Standalone.html): Archivo carries
// display type (500/700/900), Work Sans carries body copy (400/500/600).
// Loaded once here and applied on the root <html> so every page shares the
// same font instances — next/font downloads these at build time and serves
// them from our own domain (self-hosted, no runtime requests to Google).
export const archivo = Archivo({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['500', '700', '900'],
  variable: '--font-archivo',
  display: 'swap',
})

export const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-work-sans',
  display: 'swap',
})
