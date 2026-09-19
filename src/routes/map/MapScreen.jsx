import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess } from '../../lib/store'
import { isMapboxConfigured, mapboxToken } from '../../lib/mapbox'
import { useTheme } from '../../lib/useTheme'
import { useT } from '../../lib/i18n'

function styleForTheme(theme) {
  return theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
}

export default function MapScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const currentUser = useStore((s) => s.currentUser)
  const travelers = useStore((s) => s.travelers)
  const blockedIds = useStore((s) => s.blockedIds)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapError, setMapError] = useState('')

  // Same fuzzed coordinates already used for Discover's distance — never
  // exact, matches the privacy design everywhere else in the app.
  const located = travelers.filter((p) => p.lat != null && p.lng != null && !blockedIds.includes(p.id))

  useEffect(() => {
    if (!isMapboxConfigured || !mapContainerRef.current) return
    mapboxgl.accessToken = mapboxToken
    const hasHome = currentUser?.lat != null && currentUser?.lng != null
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleForTheme(theme),
      center: hasHome ? [currentUser.lng, currentUser.lat] : [0, 20],
      zoom: hasHome ? 11 : 1.5,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    // Mapbox fails completely silently by default (a bad/restricted token,
    // a network block, etc. all just leave a blank container with no
    // feedback) — surface it instead of leaving the screen looking broken.
    map.on('error', (e) => {
      const err = e?.error
      console.error('Mapbox error:', err)
      // Style/tile load failures come back as an AjaxError-like object
      // (status/statusText), not a plain Error with .message.
      const detail = err?.message || (err?.status ? `HTTP ${err.status} ${err.statusText || ''}`.trim() : 'Unknown error')
      setMapError(detail)
    })
    mapRef.current = map

    // The container sits inside a flex layout (sized by its parent, not by
    // its own content) — Mapbox measures it once at construction time via
    // getBoundingClientRect(), and if that happens before the flex layout
    // has settled to its final size, the map silently renders at 0x0 and
    // never repaints on its own afterward. Watching for any size change and
    // calling resize() covers both that race and later layout changes
    // (sidebar toggling, window resize, etc).
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
    // Only ever created once — theme changes are handled by the effect
    // below via setStyle() instead of recreating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    mapRef.current?.setStyle(styleForTheme(theme))
  }, [theme])

  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = located.map((person) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', person.name)
      el.style.cssText = `width:36px;height:36px;border-radius:9999px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);background-image:url(${person.photo || ''});background-size:cover;background-position:center;background-color:#d4d4d8;cursor:pointer;padding:0;`
      el.addEventListener('click', () => navigate(`/people/${person.id}`))
      return new mapboxgl.Marker({ element: el }).setLngLat([person.lng, person.lat]).addTo(mapRef.current)
    })
    return () => {
      markersRef.current.forEach((marker) => marker.remove())
    }
  }, [located, navigate])

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title={t('Your trip has ended')}
        body={t('Trip passes cover up to 14 days. Renew your plan to browse and match with travelers again.')}
      />
    ) : (
      <TripLockedNotice
        title={t('Map is for paying travelers')}
        body={t('Add a Trip Pass or subscription to see travelers of your nationality on a map.')}
        ctaLabel={t('Add a plan to unlock')}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-8 pb-4 text-center">
        <h1 className="text-xl font-semibold text-ink">{t('Map')}</h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {t('Travelers of your nationality, nearby right now.')}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        {!isMapboxConfigured ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-[15px] font-medium text-ink">{t("Map isn't set up yet")}</p>
            <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">
              {t('Add a Mapbox access token to enable the map. See SETUP.md for how.')}
            </p>
          </div>
        ) : (
          <>
            <div ref={mapContainerRef} className="absolute inset-0" />
            {mapError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg px-6 text-center">
                <p className="text-[15px] font-medium text-ink">{t("Couldn't load the map")}</p>
                <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">
                  {t('Your Mapbox token was rejected. Check it’s a public token (starts with "pk."), not restricted to a different domain, and hasn’t been deleted.')}
                </p>
                <p className="mt-3 max-w-xs break-words text-[11.5px] text-ink-faint">{mapError}</p>
              </div>
            ) : (
              located.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                  <span className="rounded-full bg-bg-raised px-4 py-2 text-[13px] text-ink-muted shadow-sm">
                    {t('No one to show on the map yet.')}
                  </span>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
