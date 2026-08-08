// Shared decorative page backdrop: grid-line pattern + two large blurred
// color blobs, matching the landing page's background treatment
// (docs/Jeeran Landing Redesign - Standalone.html) so other top-level pages
// can share the same brand texture. Purely decorative — render inside a
// `relative` ancestor, above z-0 content.
//
// The rotated diamond accents are opt-in (`diamonds`) rather than always
// on: their positions were tuned to land in the landing hero's empty space
// specifically. Other pages have shorter, narrower, differently-shaped
// content up top, so the same fixed coordinates can and do land on top of
// real text (confirmed on /browse, where the second diamond sat on top of
// the "Dry-Clean" category link). Only opt in on a page after checking the
// diamond positions actually land somewhere empty there.
export default function Backdrop({ diamonds = false }: { diamonds?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(30,58,138,0.06) 0px, rgba(30,58,138,0.06) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, rgba(30,58,138,0.06) 0px, rgba(30,58,138,0.06) 1px, transparent 1px, transparent 64px)',
        }}
      />
      <div className="absolute -top-[120px] -right-[160px] h-[520px] w-[520px] rounded-full bg-[#FF6B4A] opacity-[0.16] blur-[60px]" />
      <div className="absolute -bottom-[140px] -left-[140px] h-[460px] w-[460px] rounded-full bg-[#1E3A8A] opacity-[0.14] blur-[70px]" />
      {diamonds && (
        <>
          {/* Hidden below sm: at narrow widths page headers wrap taller and
              these fixed-position accents start colliding with nav text. */}
          <Diamond top={120} left="38%" size={26} opacity={0.5} className="hidden sm:block" />
          <Diamond top={340} left="46%" size={14} opacity={0.3} className="hidden sm:block" />
        </>
      )}
    </div>
  )
}

function Diamond({
  top,
  left,
  size,
  opacity,
  className,
}: {
  top: number
  left: string
  size: number
  opacity: number
  className?: string
}) {
  return (
    <div
      className={`absolute rotate-45 border-2 border-[#FF6B4A] ${className ?? ''}`}
      style={{ top, left, width: size, height: size, opacity }}
    />
  )
}
