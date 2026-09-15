import { useNavigate } from 'react-router-dom'
import { LockSimple } from '@phosphor-icons/react'
import Button from './Button'
import { useT } from '../lib/i18n'

export default function TripLockedNotice({ title, body, ctaLabel }) {
  const navigate = useNavigate()
  const t = useT()

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-sunken text-ink-faint">
        <LockSimple size={24} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
      <Button className="mt-6" onClick={() => navigate('/onboarding/plan')}>
        {ctaLabel ?? t('Renew to unlock')}
      </Button>
    </div>
  )
}
