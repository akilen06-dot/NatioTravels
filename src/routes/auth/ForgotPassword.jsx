import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeSimple } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const requestPasswordReset = useStore((s) => s.requestPasswordReset)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(null) // null | { real: boolean }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    const result = await requestPasswordReset(email.trim())
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent({ real: result.real })
  }

  if (sent) {
    return (
      <OnboardingLayout title="Check your email">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-bg-sunken p-7 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent-strong">
            <EnvelopeSimple size={26} />
          </span>
          <p className="mt-4 text-[15px] font-medium text-ink">
            If an account exists for {email}, we've sent a link to reset your password.
          </p>
          {!sent.real && (
            <p className="mt-2 text-[12.5px] text-ink-faint">
              Prototype mode: no real email was sent, since no backend is configured. Once
              Supabase is set up (see SETUP.md), this sends a real email.
            </p>
          )}
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => navigate('/signin')}>
            Back to sign in
          </Button>
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a link to reset your password."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="forgot-email" error={error}>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="you@example.com"
            className={fieldClasses(!!error)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>

        <button
          type="button"
          onClick={() => navigate('/signin')}
          className="text-center text-[13.5px] font-medium text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
        >
          Back to sign in
        </button>
      </form>
    </OnboardingLayout>
  )
}
