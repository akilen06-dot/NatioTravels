const GEOCODING_API_KEY = import.meta.env.VITE_GEOCODING_API_KEY
export const isGeocodingConfigured = Boolean(GEOCODING_API_KEY)

// Wraps the browser Geolocation API in a promise. Rejects if the browser
// doesn't support it, the user denies the permission prompt, or it times out.
export function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

// Rounds to ~2 decimal places (roughly a 1-2km grid) so the coordinates we
// ever transmit or store are already approximate — never the user's exact
// position. Do this before the value leaves the browser.
export function fuzzCoordinates({ lat, lng }) {
  const jitter = () => (Math.random() - 0.5) * 0.02
  return {
    lat: Math.round((lat + jitter()) * 100) / 100,
    lng: Math.round((lng + jitter()) * 100) / 100,
  }
}

// Forward-geocodes a free-text address/place to coordinates via OpenCage.
// Returns null (letting the caller fall back to no exact pin at all) when no
// API key is configured, the query is empty, or nothing matches. Unlike
// fuzzCoordinates() above, this is deliberately NOT rounded/jittered — it's
// for a meetup spot someone is choosing to publicize, not a person's
// location, so precision here is the point rather than a privacy risk.
export async function forwardGeocode(query) {
  if (!isGeocodingConfigured || !query?.trim()) return null
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${GEOCODING_API_KEY}&no_annotations=1&limit=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const geometry = data?.results?.[0]?.geometry
    if (!geometry) return null
    return { lat: geometry.lat, lng: geometry.lng }
  } catch {
    return null
  }
}

// Reverse-geocodes fuzzed coordinates to a city/country via OpenCage. Returns
// null (letting the caller fall back to whatever the user typed at signup)
// when no API key is configured or the request fails.
export async function reverseGeocode({ lat, lng }) {
  if (!isGeocodingConfigured) return null
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${GEOCODING_API_KEY}&no_annotations=1&limit=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.results?.[0]
    if (!result?.components) return null
    return {
      city: result.components.city || result.components.town || result.components.village || result.components.state || '',
      country: result.components.country || '',
      // The full "what's actually here" address — used to label a point
      // someone drops a pin on (a specific venue/street), where city/country
      // alone would be too vague to be useful.
      formatted: result.formatted || '',
    }
  } catch {
    return null
  }
}
