import Svg, { Circle, G, Path } from 'react-native-svg'
import { colors } from './theme'

// The Jeeran mark (public/design/jeeran-mark-navy.svg).
export function JeeranMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={(size * 215) / 235} height={size} viewBox="75 95 215 235" accessibilityLabel="Jeeran">
      <Path d="M 100 110 L 260 110" stroke={colors.navy} strokeWidth={24} strokeLinecap="round" />
      <Path
        d="M 230 110 C 230 110, 280 180, 230 250 C 180 320, 90 290, 90 220"
        fill="none"
        stroke={colors.navy}
        strokeWidth={24}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M 230 110 L 230 180" stroke={colors.navy} strokeWidth={24} strokeLinecap="round" />
      <G transform="translate(160, 205)">
        <Path d="M 0 0 C -12 -12, -18 -24, -18 -36 C -18 -50, -8 -58, 0 -58 C 8 -58, 18 -50, 18 -36 C 18 -24, 12 -12, 0 0 Z" fill={colors.coralBright} />
        <Circle cx={0} cy={-36} r={6} fill={colors.cream} />
      </G>
    </Svg>
  )
}
