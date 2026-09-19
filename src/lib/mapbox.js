const token = import.meta.env.VITE_MAPBOX_TOKEN

// True once you've created a Mapbox account and added a token to .env.local
// (see SETUP.md). Until then the Map tab shows a friendly "not set up yet"
// notice instead of a blank/broken map.
export const isMapboxConfigured = Boolean(token)
export const mapboxToken = token
