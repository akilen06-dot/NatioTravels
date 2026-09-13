// `currentCountry`/`currentCity` are only ever set (see refreshCurrentLocation
// in store.js) when someone's detected location differs from their home
// country — so their presence alone means "currently traveling."
export function formatLocation(person) {
  if (!person) return ''
  if (person.currentCountry && person.currentCountry !== person.country) {
    const visiting = person.currentCity
      ? `${person.currentCity}, ${person.currentCountry}`
      : person.currentCountry
    return `From: ${person.country}  Visiting: ${visiting}`
  }
  return `From: ${person.country || ''}`
}
