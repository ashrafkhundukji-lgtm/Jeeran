import Link from 'next/link'

// 403 page (forbidden() — see src/lib/adminAuth.ts).
export default function Forbidden() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-brand-cream px-4 text-center font-body text-brand-navy-deep">
      <h1 className="font-display text-2xl font-bold">403</h1>
      <p className="max-w-sm text-brand-muted">This page is for Jeeran admins only.</p>
      <Link href="/" className="font-semibold text-brand-navy underline underline-offset-4">
        Jeeran
      </Link>
    </main>
  )
}
