// Decorative, non-interactive backdrop evoking a map view — a faint street
// grid with a scatter of location pins (shops), linked by paths with an
// animated dot traveling along each one (ad credits flowing shop to shop)
// and an arrowhead showing direction. Deliberately low-opacity so page
// content stays the clear focal point.
const PIN_POSITIONS: [number, number][] = [
  [140, 160],
  [430, 80],
  [760, 210],
  [1060, 110],
  [1340, 230],
  [1500, 420],
  [90, 460],
  [360, 560],
  [660, 480],
  [980, 560],
  [1260, 500],
  [1450, 700],
  [200, 760],
  [520, 820],
  [860, 760],
  [1140, 820],
]

const CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [0, 6],
  [1, 3],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [6, 12],
  [12, 13],
  [13, 14],
  [14, 15],
  [8, 13],
]

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M 0 0 C -8 -8, -12 -16, -12 -24 C -12 -33, -5 -39, 0 -39 C 5 -39, 12 -33, 12 -24 C 12 -16, 8 -8, 0 0 Z"
        fill="#FF6B4A"
      />
      <circle cx="0" cy="-24" r="4" fill="#FFFFFF" />
    </g>
  )
}

function Connection({
  x1,
  y1,
  x2,
  y2,
  index,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  index: number
}) {
  // Deterministic (not Math.random) so server-rendered and hydrated markup
  // match — varying duration/delay by index instead gives the same
  // "organic, not synchronized" feel.
  const duration = 3.5 + (index % 5) * 0.6
  const delay = -(index * 0.7)
  const d = `M ${x1} ${y1} L ${x2} ${y2}`

  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        opacity="0.12"
        markerEnd="url(#arrowhead)"
      />
      <circle r="3.5" fill="#FF6B4A" opacity="0.65">
        <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
      </circle>
    </>
  )
}

export default function MapBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg viewBox="0 0 1600 1200" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <defs>
          <pattern id="street-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E2E8F0" strokeWidth="1" />
          </pattern>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1E3A8A" opacity="0.4" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="#FBFCFD" />
        <rect width="100%" height="100%" fill="url(#street-grid)" opacity="0.35" />

        {CONNECTIONS.map(([a, b], i) => {
          const [x1, y1] = PIN_POSITIONS[a]
          const [x2, y2] = PIN_POSITIONS[b]
          return <Connection key={i} x1={x1} y1={y1} x2={x2} y2={y2} index={i} />
        })}

        {PIN_POSITIONS.map(([x, y], i) => (
          <g key={i} opacity="0.28">
            <Pin x={x} y={y} />
          </g>
        ))}
      </svg>
    </div>
  )
}
