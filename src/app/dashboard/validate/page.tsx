import ValidateView from '@/components/ValidateView'

// Coupon validation, inside the owner app scope (/dashboard/). Sign-in is
// enforced by src/proxy.ts; /api/validate checks the coupon belongs to this
// shop.
export default function DashboardValidatePage() {
  return <ValidateView />
}
