import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Button from './Button'
import { isMapboxConfigured, mapboxToken, mapboxStyle } from '../lib/mapbox'
import { reverseGeocode } from '../lib/geocode'
import { newSearchSession, searchPlaces, retrievePlace } from '../lib/mapboxSearch'
import { useT } from '../lib/i18n'

// Click-to-drop-pin picker for a group's exact meetup spot, plus a search
// bar for finding a named place (restaurant, bar, landmark) directly — a
// separate Mapbox instance from the Map tab's (a modal, mounted/unmounted
// per open), but built the same way: same style, same h-full/w-full +
// ResizeObserver fix for the flex-layout container-race bug worked out there.
export default function LocationPickerModal({ initialCenter, onConfirm, onClose }) {
  const t = useT()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [picked, setPicked] = useState(null) // { lat, lng }
  const [label, setLabel] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)

  // One id for this whole picker session, not per keystroke — see
  // lib/mapboxSearch.js for why.
  const [sessionToken] = useState(newSearchSession)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)

  function moveMarkerTo(lngLat) {
    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ draggable: true, color: '#1d3fc4' })
        .setLngLat(lngLat)
        .addTo(mapRef.current)
      markerRef.current.on('dragend', () => placeFromClick(markerRef.current.getLngLat()))
    } else {
      markerRef.current.setLngLat(lngLat)
    }
  }

  // Map click / marker drag — coordinates only, so the address has to be
  // looked up.
  async function placeFromClick(lngLat) {
    setPicked({ lat: lngLat.lat, lng: lngLat.lng })
    setLabel('')
    setLabelLoading(true)
    const place = await reverseGeocode(lngLat)
    setLabelLoading(false)
    setLabel(place?.formatted || '')
  }

  // Search result — already has a name/address, so no reverse-geocode call.
  function placeFromSearch({ lat, lng, label: resultLabel }) {
    setPicked({ lat, lng })
    setLabel(resultLabel)
    setLabelLoading(false)
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16 })
    moveMarkerTo({ lat, lng })
    setQuery('')
    setSuggestions([])
  }

  // Debounced as-you-type search — waits for a pause in typing rather than
  // firing on every keystroke, since each call is a billed API request.
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const results = await searchPlaces(query, sessionToken, initialCenter)
      setSuggestions(results)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, sessionToken, initialCenter])

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
      moveMarkerTo(e.lngLat)
      placeFromClick(e.lngLat)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <p className="text-[12.5px] text-ink-muted">{t('Search for a place, or tap the map.')}</p>
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
            <>
              <div ref={mapContainerRef} className="h-full w-full" />
              <div className="pointer-events-none absolute inset-x-3 top-3 z-10">
                <div className="pointer-events-auto relative">
                  <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('Search restaurants, bars, places…')}
                    className="w-full rounded-xl border border-border-strong bg-bg-raised py-2.5 pl-9 pr-3.5 text-[14px] text-ink placeholder:text-ink-faint shadow-sm outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25"
                  />
                  {(searching || suggestions.length > 0) && (
                    <div className="absolute inset-x-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-bg-raised shadow-lg">
                      {searching ? (
                        <p className="px-3.5 py-3 text-[13px] text-ink-muted">{t('Searching…')}</p>
                      ) : (
                        suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={async () => {
                              const result = await retrievePlace(s.id, sessionToken)
                              if (result) placeFromSearch(result)
                            }}
                            className="block w-full px-3.5 py-2.5 text-left transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
                          >
                            <p className="text-[13.5px] font-medium text-ink">{s.name}</p>
                            {s.address && <p className="text-[12px] text-ink-muted">{s.address}</p>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
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
