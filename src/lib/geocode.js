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
    const components = data?.results?.[0]?.components
    if (!components) return null
    return {
      city: components.city || components.town || components.village || components.state || '',
      country: components.country || '',
    }
  } catch {
    return null
  }
}
