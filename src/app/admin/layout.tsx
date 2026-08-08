import SiteLogo from '@/components/SiteLogo'
import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 w-full">
      <div className="mb-8">
        <SiteLogo className="h-14 sm:h-16 mb-4" />
        <h1 className="font-[family-name:var(--font-archivo)] text-xl font-black tracking-[-0.01em]">Shops Admin</h1>
        <p className="text-sm text-[#5a5a5a]">
          Internal overview — no login required yet, do not expose this URL publicly.
        </p>
      </div>

      <AdminNav />

      {children}
    </main>
  )
}
