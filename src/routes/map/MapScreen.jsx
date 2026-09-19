import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess } from '../../lib/store'
import { isMapboxConfigured, mapboxToken } from '../../lib/mapbox'
import { useTheme } from '../../lib/useTheme'
import { useT } from '../../lib/i18n'

// The minimal base styles, not Mapbox's default "streets" look — its stock
// oranges/greens/blues belong to Mapbox, not Natio. Starting from the plain
// style and repainting a few layers below (applyBrandColors) is what makes
// the map read as ours instead of a generic Google-Maps-style basemap.
function styleForTheme(theme) {
  return theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'
}

// Same blue/teal/coral trio used everywhere else in the app (index.css
// --color-accent-strong/--color-teal/--color-coral), so the map's land,
// water, and parks read as Natio's palette rather than Mapbox's defaults.
const BRAND_MAP_COLORS = {
  light: { land: '#eef1f8', water: '#c7d6fb', park: '#cfece6' },
  dark: { land: '#0a0e1a', water: '#16224a', park: '#0f2b27' },
}

// Repaints a loaded style's land/water/park layers to match the brand
// palette above. Runs on every 'style.load' (initial load AND every later
// setStyle() from a theme change — Mapbox drops custom paint overrides on
// setStyle, so this has to reapply each time, not just once at creation.
// Layer ids aren't guaranteed to be stable across Mapbox style revisions,
// so this matches by type + a loose id pattern and skips anything that
// doesn't match, rather than hardcoding an exact expected layer list.
function applyBrandColors(map, theme) {
  const colors = BRAND_MAP_COLORS[theme] || BRAND_MAP_COLORS.light
  const layers = map.getStyle()?.layers || []
  layers.forEach((layer) => {
    try {
      if (layer.type === 'background') {
        map.setPaintProperty(layer.id, 'background-color', colors.land)
      } else if (layer.type === 'fill' && /water/i.test(layer.id)) {
        map.setPaintProperty(layer.id, 'fill-color', colors.water)
      } else if (layer.type === 'fill' && /(park|landuse|wood|forest|grass|golf|pitch|cemetery)/i.test(layer.id)) {
        map.setPaintProperty(layer.id, 'fill-color', colors.park)
      }
    } catch {
      /* this style revision doesn't expose this paint property on this layer — skip it */
    }
  })
}

// Same blue/teal/coral trio, rotated per marker so groups are visually
// distinct — deterministic per group id, not random, so a group keeps the
// same color across re-renders.
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

  // 'style.load' fires later (async style/tile loading) and needs the
  // *current* theme at that moment, not whatever it was when the effect
  // that registered the listener last ran — a plain closure over `theme`
  // would go stale across re-renders, so read it from a ref instead.
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

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
    // Fires on this initial load AND again on every later setStyle() call
    // (theme toggling), since a new style has none of our overrides yet.
    map.on('style.load', () => applyBrandColors(map, themeRef.current))
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

  const isInitialThemeSync = useRef(true)
  useEffect(() => {
    // Skip the run that fires on mount alongside the map-creation effect
    // above — the map is already built with this exact style, and calling
    // setStyle() again immediately cancels that still-in-flight initial
    // style request (confirmed via a cancelled network request), leaving
    // the map with no style at all and a blank canvas.
    if (isInitialThemeSync.current) {
      isInitialThemeSync.current = false
      return
    }
    mapRef.current?.setStyle(styleForTheme(theme))
  }, [theme])

  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = groupPins.map((group) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', group.name)
      el.title = `${group.name} · ${group.city}`
      el.style.cssText = `width:38px;height:38px;border-radius:9999px;border:2.5px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);background:${colorForId(group.id, theme)};cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;`
      el.textContent = '👥'
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
