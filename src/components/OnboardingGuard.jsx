import { Navigate, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'

export default function OnboardingGuard() {
  const auth = useStore((s) => s.auth)
  if (auth !== 'onboarding') return <Navigate to="/start" replace />
  return <Outlet />
}

export function PlanGuard() {
  const auth = useStore((s) => s.auth)
  if (auth === 'signed-out') return <Navigate to="/start" replace />
  return <Outlet />
}

// Wraps the landing/auth entry points (/, /start, /auth, /signup, /signin) —
// currentUser/auth persist across closing and reopening a tab, but nothing
// previously redirected an already-signed-in visitor away from these pages,
// so reopening the app always looked like it required signing in again even
// though the session was never actually lost.
export function RedirectIfAuthed() {
  const auth = useStore((s) => s.auth)
  if (auth === 'active') return <Navigate to="/discover" replace />
  return <Outlet />
}
