'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom marker instead of Leaflet's default icon — sidesteps the well-known
// bundler asset-path issue with the default marker images, and matches the
// brand's pin shape/color.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 24 30" width="30" height="30" style="display:block">
    <path d="M12 0C6 0 1 5 1 11c0 8 11 19 11 19s11-11 11-19c0-6-5-11-11-11z" fill="#FF6B4A"/>
    <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Default center: Riyadh — the map opens somewhere sensible even before the
// owner has picked anything.
const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753]

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const hasPin = latitude != null && longitude != null
  const center: [number, number] = hasPin ? [latitude, longitude] : DEFAULT_CENTER

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-300" style={{ height: 260 }}>
      <MapContainer center={center} zoom={hasPin ? 15 : 11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {hasPin && (
          <Marker
            position={[latitude, longitude]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng()
                onChange(pos.lat, pos.lng)
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
