import * as Sentry from '@sentry/react'

// True once you've set VITE_SENTRY_DSN (see SETUP.md). Until then this is a
// no-op — the app behaves exactly as it does today, just without crash
// reporting.
export const isSentryConfigured = Boolean(import.meta.env.VITE_SENTRY_DSN)

export function initSentry() {
  if (!isSentryConfigured) return
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Error tracking only — no performance tracing or session replay, to
    // keep this lightweight and avoid recording user sessions.
    tracesSampleRate: 0,
  })
}

export { Sentry }
