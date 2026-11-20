import Link from 'next/link'
import AdminNav from '@/components/AdminNav'
import { requireAdminPage } from '@/lib/adminAuth'

// Internal admin — desktop-first, in the same navy/coral/cream system as
// the owner and customer screens. Admins only (ADMIN_EMAILS, see
// src/lib/adminAuth.ts): checked here AND in every page, because a layout
// does not re-run on client navigation between its pages.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage('/admin')
  return (
    <div className="min-h-dvh w-full bg-brand-cream font-body text-brand-navy-deep">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <Link href="/" className="flex w-fit items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/design/jeeran-mark-navy.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
            <span className="font-display text-[22px] font-bold">Jeeran</span>
          </Link>
          <h1 className="font-display text-2xl font-bold">Shops Admin</h1>
          <p className="text-sm text-brand-muted">Internal overview — platform admins only.</p>
        </div>

        <AdminNav />

        {children}
      </main>
    </div>
  )
}
