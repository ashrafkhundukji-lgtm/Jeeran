'use client'

import { BrowseError } from '@/components/BrowseRouteStates'

export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <BrowseError error={error} retry={unstable_retry} />
}
