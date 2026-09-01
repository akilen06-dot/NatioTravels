import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'
import { supabase, isBackendConfigured } from '../../lib/supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const confirmPasswordReset = useStore((s) => s.confirmPasswordReset)
  // checking | ready | invalid | not-configured
  const [status, setStatus] = useState(isBackendConfigured ? 'checking' : 'not-configured')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isBackendConfigured) return
    let settled = false

    // Clicking the emailed link lands here with Supabase turning the URL's
    // recovery token into a temporary session automatically. That fires a
    // PASSWORD_RECOVERY auth event — that's our signal it's safe to show
    // the "set a new password" form.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        settled = true
        setStatus('ready')
      }
    })

    // Covers the case where the link was already processed before this
    // listener attached — a session already exists.
    supabase.auth.getSession().then(({ data }) => {
      if (!settled && data.session) {
        settled = true
        setStatus('ready')
      }
    })

    const timeout = setTimeout(() => {
      if (!settled) setStatus('invalid')
    }, 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    setError('')
    setSubmitting(true)
    const result = await confirmPasswordReset(password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/discover'), 1200)
  }

  if (status === 'not-configured') {
    return (
      <OnboardingLayout title="Reset link">
        <p className="text-[14px] leading-relaxed text-ink-muted">
          Password reset by email needs the real backend configured — see SETUP.md.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/signin')}>
          Back to sign in
        </Button>
      </OnboardingLayout>
    )
  }

  if (status === 'checking') {
    return (
      <OnboardingLayout title="Checking your link…">
        <p className="text-[14px] text-ink-muted">One moment.</p>
      </OnboardingLayout>
    )
  }

  if (status === 'invalid') {
    return (
      <OnboardingLayout title="This link isn't valid">
        <p className="text-[14px] leading-relaxed text-ink-muted">
          It may have expired, or already been used. Request a new one.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/forgot-password')}>
          Send a new link
        </Button>
      </OnboardingLayout>
    )
  }

  if (done) {
    return (
      <OnboardingLayout title="Password updated">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-bg-sunken p-7 text-center">
          <CheckCircle size={40} weight="fill" className="text-success" />
          <p className="mt-3 text-[14px] text-ink-muted">Taking you into Natio…</p>
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="New password" htmlFor="new-password" error={error}>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            className={fieldClasses(!!error)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password">
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (error) setError('')
            }}
            className={fieldClasses(!!error)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Reset password'}
        </Button>
      </form>
    </OnboardingLayout>
  )
}
