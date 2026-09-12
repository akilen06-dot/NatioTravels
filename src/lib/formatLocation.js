// `currentCountry`/`currentCity` are only ever set (see refreshCurrentLocation
// in store.js) when someone's detected location differs from their home
// country — so their presence alone means "currently traveling."
export function formatLocation(person) {
  if (!person) return ''
  if (person.currentCountry && person.currentCountry !== person.country) {
    return `From ${person.country}, visiting ${person.currentCity || person.currentCountry}`
  }
  return person.city ? `${person.country} · ${person.city}` : person.country || ''
}
