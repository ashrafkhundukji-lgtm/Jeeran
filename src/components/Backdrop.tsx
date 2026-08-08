// Shared decorative page backdrop: a "community network" graphic —
// scattered nodes connected by thin lines, evoking a connected local
// network — plus two large blurred color blobs for depth. Matches the
// landing page's background treatment so every top-level page shares the
// same brand texture. Node/line coordinates are lifted directly from the
// design handoff's SVG (docs/design/design_handoff_landing_redesign) for
// pixel fidelity. Purely decorative — render inside a `relative` ancestor,
// above z-0 content.
export default function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1240 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g stroke="#1E3A8A" strokeWidth="1.4" opacity="0.16" fill="none">
          <line x1="120" y1="90" x2="300" y2="180" />
          <line x1="300" y1="180" x2="260" y2="340" />
          <line x1="300" y1="180" x2="480" y2="140" />
          <line x1="480" y1="140" x2="620" y2="240" />
          <line x1="620" y1="240" x2="820" y2="150" />
          <line x1="620" y1="240" x2="700" y2="400" />
          <line x1="700" y1="400" x2="540" y2="470" />
          <line x1="540" y1="470" x2="380" y2="420" />
          <line x1="380" y1="420" x2="260" y2="340" />
          <line x1="820" y1="150" x2="1020" y2="220" />
          <line x1="1020" y1="220" x2="1120" y2="380" />
          <line x1="700" y1="400" x2="880" y2="480" />
          <line x1="880" y1="480" x2="1020" y2="600" />
          <line x1="540" y1="470" x2="600" y2="650" />
          <line x1="600" y1="650" x2="420" y2="720" />
          <line x1="260" y1="340" x2="140" y2="500" />
          <line x1="140" y1="500" x2="220" y2="680" />
        </g>
        <g fill="#FF6B4A" opacity="0.55">
          <circle cx="120" cy="90" r="5" />
          <circle cx="480" cy="140" r="4" />
          <circle cx="820" cy="150" r="6" />
          <circle cx="700" cy="400" r="5" />
          <circle cx="1020" cy="600" r="4" />
          <circle cx="420" cy="720" r="5" />
          <circle cx="140" cy="500" r="4" />
        </g>
        <g fill="#1E3A8A" opacity="0.45">
          <circle cx="300" cy="180" r="6" />
          <circle cx="260" cy="340" r="5" />
          <circle cx="620" cy="240" r="7" />
          <circle cx="380" cy="420" r="4" />
          <circle cx="540" cy="470" r="6" />
          <circle cx="1020" cy="220" r="4" />
          <circle cx="1120" cy="380" r="5" />
          <circle cx="880" cy="480" r="5" />
          <circle cx="600" cy="650" r="4" />
          <circle cx="220" cy="680" r="4" />
        </g>
      </svg>
      <div className="absolute -top-[120px] -right-[160px] h-[520px] w-[520px] rounded-full bg-[#FF6B4A] opacity-[0.16] blur-[60px]" />
      <div className="absolute -bottom-[140px] -left-[140px] h-[460px] w-[460px] rounded-full bg-[#1E3A8A] opacity-[0.14] blur-[70px]" />
    </div>
  )
}
