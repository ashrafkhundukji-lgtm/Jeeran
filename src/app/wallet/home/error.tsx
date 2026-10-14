'use client'

import { CustomerRouteError } from '@/components/customer/RouteStates'

export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <CustomerRouteError error={error} retry={unstable_retry} />
}
