import { useCallback, useEffect, useState } from 'react'

const THEME_EVENT = 'natio-theme-change'

function readInitialTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Not a shared store — every caller gets its own useState. Without the event
// below, toggling theme from one instance (e.g. the sidebar ThemeToggle)
// would never update another mounted instance (e.g. a themed map), leaving
// it stuck on the old theme until it happens to re-render for other reasons.
export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('natio-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    const onThemeChange = (e) => setTheme(e.detail)
    window.addEventListener(THEME_EVENT, onThemeChange)
    return () => window.removeEventListener(THEME_EVENT, onThemeChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }))
      return next
    })
  }, [])

  return { theme, toggle }
}
