import type { InputHTMLAttributes } from 'react'
import { SearchIcon } from './icons'

// 52px white search field: the whole row is a <label>, so tapping the icon
// focuses the input too. All input props pass through (controlled value,
// or `name` for a plain GET form).
export default function SearchField({
  label,
  className = '',
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={`flex h-[52px] items-center gap-2.5 rounded-2xl border border-brand-line bg-white px-4 text-brand-muted focus-within:border-brand-navy/50 ${className}`}
    >
      <SearchIcon size={20} />
      <input
        type="search"
        enterKeyHint="search"
        aria-label={label}
        {...input}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-brand-navy-deep outline-none placeholder:text-brand-muted [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  )
}
