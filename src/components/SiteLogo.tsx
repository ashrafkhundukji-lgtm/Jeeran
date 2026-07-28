// Shared logo lockup, linked back to the main landing page ("/"). Used in the
// header of every page so the brand mark doubles as a "take me home" control.
// src/app/page.tsx itself already redirects a signed-in owner straight back
// to /dashboard, so this is a safe, working "home" link even from inside an
// authenticated dashboard page.
export default function SiteLogo({ className = 'h-20' }: { className?: string }) {
  return (
    <a href="/" className={`inline-flex items-center shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jeeran-logo.svg" alt="Jeeran Network" className="h-full w-auto" />
    </a>
  )
}
