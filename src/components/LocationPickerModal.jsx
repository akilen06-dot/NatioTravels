import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Button from './Button'
import { isMapboxConfigured, mapboxToken, mapboxStyle } from '../lib/mapbox'
import { reverseGeocode } from '../lib/geocode'
import { useT } from '../lib/i18n'

// Click-to-drop-pin picker for a group's exact meetup spot. A separate
// Mapbox instance from the Map tab's (a modal, mounted/unmounted per open),
// but built the same way — same style, same h-full/w-full + ResizeObserver
// fix for the flex-layout container-race bug worked out there.
export default function LocationPickerModal({ initialCenter, onConfirm, onClose }) {
  const t = useT()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [picked, setPicked] = useState(null) // { lat, lng }
  const [label, setLabel] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)

  async function place(lngLat) {
    setPicked({ lat: lngLat.lat, lng: lngLat.lng })
    setLabel('')
    setLabelLoading(true)
    const place = await reverseGeocode(lngLat)
    setLabelLoading(false)
    setLabel(place?.formatted || '')
  }

  useEffect(() => {
    if (!isMapboxConfigured || !mapContainerRef.current) return
    mapboxgl.accessToken = mapboxToken
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapboxStyle,
      center: initialCenter ? [initialCenter.lng, initialCenter.lat] : [0, 20],
      zoom: initialCenter ? 13 : 1.5,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    map.on('click', (e) => {
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ draggable: true, color: '#1d3fc4' })
          .setLngLat(e.lngLat)
          .addTo(map)
        markerRef.current.on('dragend', () => place(markerRef.current.getLngLat()))
      } else {
        markerRef.current.setLngLat(e.lngLat)
      }
      place(e.lngLat)
    })

    // Same fix as the Map tab: the container is sized by a flex layout, and
    // Mapbox only measures it once at construction — a ResizeObserver keeps
    // it correct once the modal's own layout settles.
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [initialCenter])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(600px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-bg-raised"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{t('Pick the exact spot')}</h2>
            <p className="text-[12.5px] text-ink-muted">{t('Tap the map where you’re meeting.')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
          >
            {t('Cancel')}
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {isMapboxConfigured ? (
            <div ref={mapContainerRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-bg-sunken px-6 text-center">
              <p className="text-[15px] font-medium text-ink">{t('Map picker isn’t set up yet')}</p>
              <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">
                {t('Add a Mapbox access token to enable it. See SETUP.md for how.')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <p className="flex-1 truncate text-[13px] text-ink-muted">
            {picked ? (labelLoading ? t('Finding the address…') : label || t('Pin placed — no address found for it')) : t('No spot picked yet')}
          </p>
          <Button
            size="sm"
            disabled={!picked}
            onClick={() => picked && onConfirm({ ...picked, label })}
          >
            {t('Use this location')}
          </Button>
        </div>
      </div>
    </div>
  )
}
