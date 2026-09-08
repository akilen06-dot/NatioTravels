import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const verifyEmail = useStore((s) => s.verifyEmail)
  const auth = useStore((s) => s.auth)
  const [status, setStatus] = useState('checking') // checking | verified | invalid

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    verifyEmail(token).then((ok) => setStatus(ok ? 'verified' : 'invalid'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const continuePath = auth === 'active' ? '/profile' : '/signin'

  return (
    <OnboardingLayout title="Email verification" onBack={() => navigate(continuePath)}>
      <div className="flex flex-col items-center rounded-2xl border border-border bg-bg-sunken p-7 text-center">
        {status === 'checking' && <p className="text-[14.5px] text-ink-muted">Checking…</p>}

        {status === 'verified' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent-strong">
              <CheckCircle size={26} weight="fill" />
            </span>
            <p className="mt-4 text-[15px] font-medium text-ink">Email confirmed</p>
            <p className="mt-1.5 text-[13px] text-ink-muted">Thanks — your email address is now verified.</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger">
              <WarningCircle size={26} weight="fill" />
            </span>
            <p className="mt-4 text-[15px] font-medium text-ink">Link expired or already used</p>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              You can request a new verification email from your profile settings.
            </p>
          </>
        )}

        {status !== 'checking' && (
          <Button size="sm" className="mt-5" onClick={() => navigate(continuePath)}>
            Continue
          </Button>
        )}
      </div>
    </OnboardingLayout>
  )
}
