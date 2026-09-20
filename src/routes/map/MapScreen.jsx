import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { UsersThree } from '@phosphor-icons/react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess } from '../../lib/store'
import { isMapboxConfigured, mapboxToken } from '../../lib/mapbox'
import { useTheme } from '../../lib/useTheme'
import { useT } from '../../lib/i18n'

// Mapbox's current flagship style — soft shading, 3D buildings, real
// depth — instead of the flat, dated-looking classic light-v11/dark-v11
// styles. One style handles both themes via its own lightPreset config
// (below), so there's no setStyle()-driven style swap on theme toggle
// (which is also what makes this simpler than the old approach: config
// properties apply instantly without re-fetching/re-cancelling a style).
const MAP_STYLE = 'mapbox://styles/mapbox/standard'

// Same blue/teal/coral trio used everywhere else in the app (index.css
// --color-accent-strong/--color-teal/--color-coral), rotated per marker so
// groups are visually distinct — deterministic per group id, not random,
// so a group keeps the same color across re-renders.
const PIN_COLORS = {
  light: ['#1d3fc4', '#0f9b8e', '#e2703a'],
  dark: ['#3b5fe0', '#3fbdae', '#f0895c'],
}
function colorForId(id, theme) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const palette = PIN_COLORS[theme] || PIN_COLORS.light
  return palette[hash % palette.length]
}

// Same icon as the Groups nav item, rendered once to an HTML string —
// Mapbox markers are plain DOM, not React, so this is how a React icon
// component ends up inside one. A crisp vector glyph reads far more
// current than a platform emoji, which renders inconsistently and looks
// dated on most systems.
const MARKER_ICON_HTML = renderToStaticMarkup(<UsersThree size={16} weight="bold" color="#ffffff" />)

export default function MapScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const currentUser = useStore((s) => s.currentUser)
  const travelers = useStore((s) => s.travelers)
  const groups = useStore((s) => s.groups)
  const blockedIds = useStore((s) => s.blockedIds)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapError, setMapError] = useState('')

  // Group meetups, not individual people — pinning exactly where a person
  // is standing is a real safety risk (it tells anyone browsing precisely
  // where to find them). A group's meetup is something people are already
  // choosing to show up to publicly, so it doesn't carry that same risk.
  // Position is still the same fuzzed, never-exact coordinate already used
  // for Discover's distances (via the owner's profile) — approximate area
  // only, same privacy design as everywhere else in the app.
  const groupPins = useMemo(() => {
    return groups
      .filter((g) => !blockedIds.includes(g.ownerId))
      .map((g) => {
        const owner =
          g.ownerId === currentUser?.id ? currentUser : travelers.find((p) => p.id === g.ownerId)
        return owner?.lat != null && owner?.lng != null ? { ...g, lat: owner.lat, lng: owner.lng } : null
      })
      .filter(Boolean)
  }, [groups, travelers, blockedIds, currentUser])

  useEffect(() => {
    if (!isMapboxConfigured || !mapContainerRef.current) return
    mapboxgl.accessToken = mapboxToken
    const hasHome = currentUser?.lat != null && currentUser?.lng != null
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: hasHome ? [currentUser.lng, currentUser.lat] : [0, 20],
      zoom: hasHome ? 11 : 1.5,
      pitch: hasHome ? 40 : 0,
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
    // Standard's own config, applied once its default import is ready —
    // 'faded' is a softer, less saturated palette than Mapbox's default
    // (closer to this app's own muted design language) and hiding POI
    // labels cuts the clutter that makes a map feel busy/dated at a glance.
    map.on('style.load', () => {
      map.setConfigProperty('basemap', 'theme', 'faded')
      map.setConfigProperty('basemap', 'lightPreset', theme === 'dark' ? 'night' : 'day')
      map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
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
    // below via setConfigProperty() instead of recreating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // A config property, not setStyle() — Standard's light preset switches
    // instantly with no network refetch, unlike swapping to a whole
    // different style (which is also what used to cause the map to go
    // blank: setStyle() cancels whatever style request is still in flight).
    // isStyleLoaded() guards the very first run, since the map's initial
    // 'style.load' (in the effect above) already applies the starting
    // preset and may not have fired yet on the same tick this runs.
    if (mapRef.current?.isStyleLoaded()) {
      mapRef.current.setConfigProperty('basemap', 'lightPreset', theme === 'dark' ? 'night' : 'day')
    }
  }, [theme])

  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = groupPins.map((group) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', group.name)
      el.title = `${group.name} · ${group.city}`
      el.style.cssText = `width:36px;height:36px;border-radius:9999px;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.22),0 1px 3px rgba(0,0,0,0.18);background:${colorForId(group.id, theme)};cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;`
      el.innerHTML = MARKER_ICON_HTML
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
      el.addEventListener('click', () => navigate(`/groups/${group.id}`))
      return new mapboxgl.Marker({ element: el }).setLngLat([group.lng, group.lat]).addTo(mapRef.current)
    })
    return () => {
      markersRef.current.forEach((marker) => marker.remove())
    }
  }, [groupPins, navigate, theme])

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title={t('Your trip has ended')}
        body={t('Trip passes cover up to 14 days. Renew your plan to browse and match with travelers again.')}
      />
    ) : (
      <TripLockedNotice
        title={t('Map is for paying travelers')}
        body={t('Add a Trip Pass or subscription to see group meetups near you.')}
        ctaLabel={t('Add a plan to unlock')}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-8 pb-4 text-center">
        <h1 className="text-xl font-semibold text-ink">{t('Map')}</h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          {t('Group meetups happening near you.')}
        </p>
      </div>

      <div className="relative mx-4 mb-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-border shadow-sm">
        {!isMapboxConfigured ? (
          <div className="flex h-full flex-col items-center justify-center bg-bg-sunken px-6 text-center">
            <p className="text-[15px] font-medium text-ink">{t("Map isn't set up yet")}</p>
            <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">
              {t('Add a Mapbox access token to enable the map. See SETUP.md for how.')}
            </p>
          </div>
        ) : (
          <>
            {/* h-full/w-full, not absolute+inset-0: mapbox-gl.css forces
                position:relative on this element (class .mapboxgl-map),
                which silently cancels inset-based sizing and collapses it
                to 0 height. Percentage sizing works under any position. */}
            <div ref={mapContainerRef} className="h-full w-full" />
            {mapError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg px-6 text-center">
                <p className="text-[15px] font-medium text-ink">{t("Couldn't load the map")}</p>
                <p className="mt-1.5 max-w-xs text-[13px] text-ink-muted">
                  {t('Your Mapbox token was rejected. Check it’s a public token (starts with "pk."), not restricted to a different domain, and hasn’t been deleted.')}
                </p>
                <p className="mt-3 max-w-xs break-words text-[11.5px] text-ink-faint">{mapError}</p>
              </div>
            ) : (
              groupPins.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                  <span className="rounded-full bg-bg-raised px-4 py-2 text-[13px] text-ink-muted shadow-sm">
                    {t('No groups happening on the map yet.')}
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
