import { useNavigate } from 'react-router-dom'
import { LockSimple } from '@phosphor-icons/react'
import Button from './Button'

export default function TripLockedNotice({ title, body, ctaLabel = 'Renew to unlock' }) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-sunken text-ink-faint">
        <LockSimple size={24} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
      <Button className="mt-6" onClick={() => navigate('/onboarding/plan')}>
        {ctaLabel}
      </Button>
    </div>
  )
}
