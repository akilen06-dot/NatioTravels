import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

const DEMO_PASSWORD = 'password123'

const demoAccounts = [
  { email: 'maria@example.com', label: 'Maria · active subscription, 35-day trip' },
  { email: 'james@example.com', label: 'James · trip pass, ended naturally' },
  { email: 'elena@example.com', label: 'Elena · still traveling, pass capped at 14 days' },
]

export default function SignIn() {
  const navigate = useNavigate()
  const attemptSignIn = useStore((s) => s.attemptSignIn)
  const signInError = useStore((s) => s.signInError)
  const clearSignInError = useStore((s) => s.clearSignInError)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (await attemptSignIn(identifier, password)) navigate('/discover')
  }

  return (
    <OnboardingLayout title="Welcome back" subtitle="Sign in to continue.">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        onChange={() => signInError && clearSignInError()}
      >
        <Field label="Email or username" htmlFor="signin-identifier" error={signInError}>
          <input
            id="signin-identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or username"
            className={fieldClasses(!!signInError)}
          />
        </Field>

        <Field label="Password" htmlFor="signin-password">
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${fieldClasses(!!signInError)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors duration-200 hover:text-ink-muted cursor-pointer"
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Link
          to="/forgot-password"
          className="-mt-3 self-end text-[13px] font-medium text-accent-strong hover:text-accent-strong/80"
        >
          Forgot password?
        </Link>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-8 rounded-2xl border border-border bg-bg-sunken p-4">
        <p className="text-[13px] font-medium text-ink-muted">
          Prototype demo accounts · password is{' '}
          <span className="font-mono text-ink">{DEMO_PASSWORD}</span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {demoAccounts.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setIdentifier(d.email)
                setPassword(DEMO_PASSWORD)
                if (signInError) clearSignInError()
              }}
              className="rounded-lg border border-border-strong bg-bg-raised px-3 py-2 text-left text-[13.5px] text-ink transition-colors duration-200 hover:border-accent cursor-pointer"
            >
              {d.email}
              <span className="block text-[12px] text-ink-faint">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[13.5px] text-ink-muted">
        New to Natio?{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="font-medium text-accent-strong cursor-pointer"
        >
          Create an account
        </button>
      </p>
    </OnboardingLayout>
  )
}
