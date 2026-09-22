import { isMapboxConfigured, mapboxToken } from './mapbox'

// A fresh id per picker session — Mapbox's Search Box API bills/rate-limits
// a suggest+retrieve pair as one search session when they share this token,
// rather than as unrelated one-off requests.
export function newSearchSession() {
  return crypto.randomUUID()
}

// Autocomplete-as-you-type: restaurants, bars, cafes, landmarks, addresses
// — anything Mapbox's places index knows about. `proximity` (optional,
// {lat, lng}) biases ranking toward nearby results — without it (or without
// the `types` restriction below), Mapbox's default ranking favors broad,
// globally-recognized places like cities and regions over small local
// venues, which is the wrong bias for picking a meetup spot.
export async function searchPlaces(query, sessionToken, proximity) {
  if (!isMapboxConfigured || !query?.trim()) return []
  try {
    const params = new URLSearchParams({
      q: query,
      access_token: mapboxToken,
      session_token: sessionToken,
      limit: '6',
      // Businesses/landmarks and specific addresses only — excludes cities,
      // regions, postcodes, etc., which otherwise crowd out the venue
      // someone is actually searching for.
      types: 'poi,address',
    })
    if (proximity) params.set('proximity', `${proximity.lng},${proximity.lat}`)
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.suggestions || []).map((s) => ({
      id: s.mapbox_id,
      name: s.name,
      address: s.place_formatted || s.full_address || '',
    }))
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
