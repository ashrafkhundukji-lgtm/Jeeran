import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { colors } from './theme'

// Stroke icons (24-grid, 1.8 stroke, round caps) in the website's style.
// No emoji anywhere in the app.
export type IconName =
  | 'home'
  | 'tag'
  | 'scan'
  | 'wallet'
  | 'user'
  | 'chevron-forward'
  | 'chevron-back'
  | 'arrow-back'
  | 'plus'
  | 'minus'
  | 'alert'
  | 'check-circle'
  | 'info'
  | 'pin'
  | 'navigation'
  | 'globe'
  | 'logout'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'calendar'
  | 'edit'
  | 'power'
  | 'refresh'
  | 'cloud-off'
  | 'store'
  | 'coffee'
  | 'scissors'
  | 'shirt'
  | 'wrench'
  | 'car'
  | 'x'
  | 'lock'

// Icons that point in a reading direction and must mirror in RTL.
const DIRECTIONAL: ReadonlySet<IconName> = new Set(['chevron-forward', 'chevron-back', 'arrow-back', 'logout'])

export function Icon({
  name,
  size = 22,
  color = colors.navy,
  strokeWidth = 1.8,
  rtl = false,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  // Pass the current direction; directional icons flip in RTL.
  rtl?: boolean
}) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const flip = rtl && DIRECTIONAL.has(name) ? { transform: [{ scaleX: -1 }] } : undefined
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={flip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {render(name, p)}
    </Svg>
  )
}

type P = { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: string }

function render(name: IconName, p: P) {
  switch (name) {
    case 'home':
      return (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...p} />
          <Path d="M5 9.5V20h5v-6h4v6h5V9.5" {...p} />
        </>
      )
    case 'tag':
      return (
        <>
          <Path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" {...p} />
          <Circle cx="7.5" cy="7.5" r="1.5" {...p} />
        </>
      )
    case 'scan':
      return (
        <>
          <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" {...p} />
          <Path d="M7 12h10" {...p} />
        </>
      )
    case 'wallet':
      return (
        <>
          <Rect x="3" y="6" width="18" height="14" rx="2" {...p} />
          <Path d="M3 10h18M16 15h2M6 6l9-3 1 3" {...p} />
        </>
      )
    case 'user':
      return (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" {...p} />
        </>
      )
    case 'chevron-forward':
      return <Path d="m9 5 7 7-7 7" {...p} />
    case 'chevron-back':
      return <Path d="m15 5-7 7 7 7" {...p} />
    case 'arrow-back':
      return <Path d="M20 12H4m6-7-7 7 7 7" {...p} />
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...p} />
    case 'minus':
      return <Path d="M5 12h14" {...p} />
    case 'x':
      return <Path d="M6 6l12 12M18 6 6 18" {...p} />
    case 'alert':
      return (
        <>
          <Path d="M12 3 2 20h20L12 3Z" {...p} />
          <Path d="M12 10v4M12 17h.01" {...p} />
        </>
      )
    case 'check-circle':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="m8 12.5 2.5 2.5L16 9.5" {...p} />
        </>
      )
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 11v5M12 8h.01" {...p} />
        </>
      )
    case 'pin':
      return (
        <>
          <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" {...p} />
          <Circle cx="12" cy="9.5" r="2.5" {...p} />
        </>
      )
    case 'navigation':
      return <Path d="M3 11 21 3l-8 18-2-8-8-2Z" {...p} />
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" {...p} />
        </>
      )
    case 'logout':
      return (
        <>
          <Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" {...p} />
          <Path d="M10 8l-4 4 4 4M6 12h10" {...p} />
        </>
      )
    case 'eye':
      return (
        <>
          <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" {...p} />
          <Circle cx="12" cy="12" r="3" {...p} />
        </>
      )
    case 'eye-off':
      return (
        <>
          <Path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" {...p} />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...p} />
        </>
      )
    case 'mail':
      return (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="2" {...p} />
          <Path d="m3 7 9 6 9-6" {...p} />
        </>
      )
    case 'calendar':
      return (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="2" {...p} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...p} />
        </>
      )
    case 'edit':
      return (
        <>
          <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" {...p} />
          <Path d="m13.5 6.5 4 4" {...p} />
        </>
      )
    case 'power':
      return (
        <>
          <Path d="M12 3v9" {...p} />
          <Path d="M6.3 6.3a8 8 0 1 0 11.4 0" {...p} />
        </>
      )
    case 'refresh':
      return (
        <>
          <Path d="M20 11a8 8 0 0 0-14.7-4.3L3 9" {...p} />
          <Path d="M3 4v5h5M4 13a8 8 0 0 0 14.7 4.3L21 15" {...p} />
          <Path d="M21 20v-5h-5" {...p} />
        </>
      )
    case 'cloud-off':
      return (
        <>
          <Path d="M3 3l18 18M8 8a5 5 0 0 0-1 9.9h10.5M12.6 6.2A5 5 0 0 1 18 10a4 4 0 0 1 2.7 6.7" {...p} />
        </>
      )
    case 'lock':
      return (
        <>
          <Rect x="4" y="10" width="16" height="11" rx="2" {...p} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} />
        </>
      )
    case 'store':
      return (
        <>
          <Path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5Z" {...p} />
          <Path d="M10 20v-5h4v5" {...p} />
        </>
      )
    case 'coffee':
      return (
        <>
          <Path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" {...p} />
          <Path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3" {...p} />
        </>
      )
    case 'scissors':
      return (
        <>
          <Circle cx="6" cy="6" r="3" {...p} />
          <Circle cx="6" cy="18" r="3" {...p} />
          <Path d="M8.1 8.1 20 20M8.1 15.9 20 4" {...p} />
        </>
      )
    case 'shirt':
      return <Path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0Z" {...p} />
    case 'wrench':
      return <Path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.7-6.7M14.7 6.3 13 4.6a4 4 0 0 0-5.7 5.7L3 14.6 6.4 18l4.3-4.3" {...p} />
    case 'car':
      return (
        <>
          <Path d="M3 16v-4l2-5h14l2 5v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM3 12h18" {...p} />
          <Circle cx="7.5" cy="17" r="1.8" {...p} />
          <Circle cx="16.5" cy="17" r="1.8" {...p} />
        </>
      )
  }
}

export const CATEGORY_ICON: Record<string, IconName> = {
  cafe: 'coffee',
  salon: 'scissors',
  'dry-clean': 'shirt',
  hardware: 'wrench',
  auto: 'car',
  other: 'store',
}
