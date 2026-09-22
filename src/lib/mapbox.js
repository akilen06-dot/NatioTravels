const token = import.meta.env.VITE_MAPBOX_TOKEN

// True once you've created a Mapbox account and added a token to .env.local
// (see SETUP.md). Until then the Map tab shows a friendly "not set up yet"
// notice instead of a blank/broken map.
export const isMapboxConfigured = Boolean(token)
export const mapboxToken = token

// Custom style designed in Mapbox Studio (not a Mapbox stock style) — shared
// by the Map tab and the exact-location picker so both look the same. Edit
// it at studio.mapbox.com/styles/akilen06/cmu9r4gyh007401qt3piw2a1s/edit;
// it updates on next deploy without touching any code.
export const mapboxStyle = 'mapbox://styles/akilen06/cmu9r4gyh007401qt3piw2a1s'
