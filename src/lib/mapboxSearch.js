import { isMapboxConfigured, mapboxToken } from './mapbox'

// A fresh id per picker session — Mapbox's Search Box API bills/rate-limits
// a suggest+retrieve pair as one search session when they share this token,
// rather than as unrelated one-off requests.
export function newSearchSession() {
  return crypto.randomUUID()
}

// Roughly "how specific is this result" — used only to sort results below,
// never to exclude any. An earlier version hard-filtered to types=poi,address
// server-side, which fixed cities crowding out restaurants in well-mapped
// areas but caused empty results entirely in places with sparser business
// listings (small markets, e.g. Mauritius) where poi/address coverage is
// thin but locality/place data still exists. Sorting client-side instead
// means a venue still wins when Mapbox has one, without ever hiding
// whatever it does have.
const TYPE_RANK = { poi: 0, address: 1, street: 2, neighborhood: 3, locality: 4, place: 5, district: 6, postcode: 7, region: 8, country: 9 }

// Autocomplete-as-you-type: restaurants, bars, cafes, landmarks, addresses,
// and (as a fallback where those are sparse) broader places — anything
// Mapbox's index knows about. `proximity` (optional, {lat, lng}) biases
// ranking toward nearby results.
export async function searchPlaces(query, sessionToken, proximity) {
  if (!isMapboxConfigured || !query?.trim()) return []
  try {
    const params = new URLSearchParams({
      q: query,
      access_token: mapboxToken,
      session_token: sessionToken,
      limit: '8',
    })
    if (proximity) params.set('proximity', `${proximity.lng},${proximity.lat}`)
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.suggestions || [])
      .map((s) => ({
        id: s.mapbox_id,
        name: s.name,
        address: s.place_formatted || s.full_address || '',
        rank: TYPE_RANK[s.feature_type] ?? 5,
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6)
  } catch {
    return []
  }
}

// Suggestions from /suggest don't carry coordinates — this is the required
// follow-up call to actually get a lat/lng for the one the user picked.
export async function retrievePlace(id, sessionToken) {
  if (!isMapboxConfigured || !id) return null
  try {
    const params = new URLSearchParams({ access_token: mapboxToken, session_token: sessionToken })
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${id}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature?.geometry?.coordinates) return null
    const [lng, lat] = feature.geometry.coordinates
    return { lat, lng, label: feature.properties?.full_address || feature.properties?.name || '' }
  } catch {
    return null
  }
}
