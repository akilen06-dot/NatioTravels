import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { CheckCircle, UserCircle } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

export default function FaceScan() {
  const navigate = useNavigate()
  const completeVerification = useStore((s) => s.completeVerification)
  const [phase, setPhase] = useState('ready')
  const reduce = useReducedMotion()

  useEffect(() => {
    if (phase !== 'scanning') return
    const t = setTimeout(() => setPhase('verified'), 2200)
    return () => clearTimeout(t)
  }, [phase])

  function handleContinue() {
    completeVerification()
    navigate('/onboarding/photo')
  }

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title="Face scan"
      subtitle="A quick liveness check confirms the person in front of the camera matches your ID photo."
    >
      <div className="flex flex-col items-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {phase === 'scanning' && !reduce && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent, var(--color-accent) 60deg, transparent 120deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div
            className={`absolute inset-[6px] flex items-center justify-center rounded-full border-2 bg-bg-sunken ${
              phase === 'verified' ? 'border-success' : 'border-border-strong'
            }`}
          >
            {phase === 'verified' ? (
              <CheckCircle size={56} weight="fill" className="text-success" />
            ) : (
              <UserCircle size={64} className="text-ink-faint" />
            )}
          </div>
        </div>

        <p className="mt-6 text-[15px] font-medium text-ink">
          {phase === 'ready' && 'Center your face in the frame'}
          {phase === 'scanning' && 'Scanning, hold still'}
          {phase === 'verified' && 'Face verified'}
        </p>
        <p className="mt-1 max-w-[240px] text-center text-[13px] text-ink-muted">
          {phase === 'verified'
            ? 'This matches your ID photo. This is a simulated check for the prototype.'
            : 'Good lighting helps the scan complete faster.'}
        </p>

        <div className="mt-8 w-full">
          {phase === 'ready' && (
            <Button size="lg" className="w-full" onClick={() => setPhase('scanning')}>
              Start face scan
            </Button>
          )}
          {phase === 'scanning' && (
            <Button size="lg" className="w-full" disabled>
              Scanning…
            </Button>
          )}
          {phase === 'verified' && (
            <Button size="lg" className="w-full" onClick={handleContinue}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </OnboardingLayout>
  )
}
