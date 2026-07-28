'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import LevelBadge from '@/components/LevelBadge'
import type { AdminShopRow } from '@/lib/admin'

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753]

function pinIcon(frozen: boolean) {
  const color = frozen ? '#9CA3AF' : '#FF6B4A'
  return L.divIcon({
    className: '',
    html: `<svg viewBox="0 0 24 30" width="26" height="26" style="display:block">
      <path d="M12 0C6 0 1 5 1 11c0 8 11 19 11 19s11-11 11-19c0-6-5-11-11-11z" fill="${color}"/>
      <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
    </svg>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

// Fits the map to every located shop on first render — MapContainer's
// center/zoom props only apply at mount, so this is the reliable way to
// show the true geographic spread instead of guessing a starting zoom.
function FitToShops({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 13)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [30, 30] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function AdminSpreadMap({ shops }: { shops: AdminShopRow[] }) {
  const located = shops.filter(
    (s): s is AdminShopRow & { latitude: number; longitude: number } => s.latitude != null && s.longitude != null,
  )
  const positions: [number, number][] = located.map((s) => [s.latitude, s.longitude])

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-3">
        {located.length} of {shops.length} shops have a location set. Gray pins are frozen shops.
      </p>
      <div className="rounded-xl overflow-hidden border border-neutral-200" style={{ height: 520 }}>
        <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToShops positions={positions} />
          {located.map((shop) => (
            <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={pinIcon(shop.isFrozen)}>
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{shop.name}</div>
                  <div className="text-neutral-500">{shop.category}</div>
                  <div className="mt-1">
                    <LevelBadge level={shop.promotionLevel} />
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
