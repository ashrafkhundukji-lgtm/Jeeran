import type { Locale } from '@/lib/i18n/locale'
import { CATEGORY_LABELS } from '@/lib/categories'
import { CategoryIcon, GridIcon } from './icons'

// Horizontally scrollable 44px filter chips (icon + label). `null` is "All".
// Active = navy fill, white text; inactive = white with a hairline border.
// The row bleeds to the screen edge on the end side, like the artboards.
export default function CategoryChips({
  categories,
  selected,
  onSelect,
  allLabel,
  locale,
}: {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
  allLabel: string
  locale: Locale
}) {
  const chip = (active: boolean) =>
    `flex h-11 flex-none items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
      active ? 'bg-brand-navy text-white' : 'border border-brand-line bg-white text-brand-navy-deep'
    }`

  return (
    <div
      className="-me-6 flex gap-2 overflow-x-auto pe-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
    >
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)} className={chip(selected === null)}>
        <GridIcon size={18} />
        {allLabel}
      </button>
      {categories.map((c) => (
        <button key={c} type="button" aria-pressed={selected === c} onClick={() => onSelect(c)} className={chip(selected === c)}>
          <CategoryIcon category={c} size={18} className={selected === c ? '' : 'text-brand-navy'} />
          {CATEGORY_LABELS[locale][c] ?? c}
        </button>
      ))}
    </div>
  )
}
