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
