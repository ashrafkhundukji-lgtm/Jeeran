'use client'

// The one on/off control for the owner dashboard (offer active state, both
// on the active-offer card and in the offers list). On = navy track, off =
// muted grey; the knob sits at the inline END when on — mirrored in RTL, the
// iOS/Android convention for Arabic — and carries a check mark so the state
// never depends on position or color alone. 44px tap target around a
// 52×32 track.
export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group -m-1.5 inline-flex h-11 w-16 shrink-0 items-center justify-center rounded-full p-1.5 disabled:opacity-50"
    >
      <span
        className={`flex h-8 w-[52px] items-center rounded-full p-1 transition-colors duration-200 motion-reduce:transition-none ${
          checked ? 'bg-brand-navy' : 'bg-brand-muted/40'
        } group-focus-visible:ring-2 group-focus-visible:ring-brand-tint-2 group-focus-visible:ring-offset-2`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        >
          {checked && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brand-navy">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
