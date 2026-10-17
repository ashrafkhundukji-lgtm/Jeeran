'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom marker instead of Leaflet's default icon — sidesteps the well-known
// bundler asset-path issue with the default marker images, and matches the
// brand's pin shape/color.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 24 30" width="36" height="36" style="display:block">
    <path d="M12 0C6 0 1 5 1 11c0 8 11 19 11 19s11-11 11-19c0-6-5-11-11-11z" fill="#CF3B19"/>
    <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
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

// react-leaflet's MapContainer only reads `center`/`zoom` on first mount —
// changing those props later doesn't move the map. This re-pans the
// existing map instance whenever the picked coordinates change (click,
// drag, or the locate-me button), so the pin never ends up off-screen.
function RecenterOnChange({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 15))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude])
  return null
}

function LocateMeButton({ onLocate, label }: { onLocate: (lat: number, lng: number) => void; label: string }) {
  const [locating, setLocating] = useState(false)

  function handleClick() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={locating}
      aria-label={label}
      title={label}
      className="flex items-center justify-center rounded-full border border-brand-line bg-white text-brand-navy shadow-md disabled:opacity-50"
      style={{ position: 'absolute', bottom: 12, insetInlineEnd: 12, zIndex: 1000, height: 44, width: 44 }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={locating ? 'animate-pulse' : ''}
      >
        <path d="m3 11 18-8-8 18-2-8-8-2Z" />
      </svg>
    </button>
  )
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 260,
  locateLabel = 'Use my current location',
}: {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  height?: number
  locateLabel?: string
}) {
  const hasPin = latitude != null && longitude != null
  const center: [number, number] = hasPin ? [latitude, longitude] : DEFAULT_CENTER

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-line" style={{ height }}>
      <MapContainer center={center} zoom={hasPin ? 15 : 11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <RecenterOnChange latitude={latitude} longitude={longitude} />
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
      <LocateMeButton onLocate={onChange} label={locateLabel} />
    </div>
  )
}
