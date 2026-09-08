import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import PhoneField from '../../components/PhoneField'
import Button from '../../components/Button'
import { useStore, isUsernameTaken } from '../../lib/store'
import { countries } from '../../lib/mockData'

const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/i

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const intendedPlan = searchParams.get('plan')
  const beginSignUp = useStore((s) => s.beginSignUp)
  const existingUsers = useStore((s) => s.existingUsers)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [dialCode, setDialCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    const next = {}
    if (name.trim().length < 2) next.name = 'Enter your name.'
    if (!USERNAME_PATTERN.test(username.trim())) {
      next.username = '3-20 characters: letters, numbers, underscores, or periods.'
    } else if (await isUsernameTaken(useStore.getState(), username)) {
      next.username = 'That username is taken. Try another.'
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      next.email = 'Enter a valid email address.'
    } else if (existingUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      next.email = 'An account with this email already exists. Try signing in instead.'
    }
    if (password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (phoneNumber.replace(/\D/g, '').length < 6) next.phone = 'Enter a valid phone number.'
    if (!country) next.country = 'Select your country of origin.'
    if (!agreedToTerms) next.terms = 'You need to agree to the Terms and Privacy Policy to continue.'
    setErrors(next)
    if (Object.keys(next).length) return
    beginSignUp({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email,
      password,
      phone: `${dialCode} ${phoneNumber}`,
      country,
      intendedPlan,
    })
    navigate('/onboarding/location')
  }

  return (
    <OnboardingLayout
      step={1}
      totalSteps={4}
      title="Create your account"
      subtitle="We'll use this to verify you and match you with travelers from home."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={fieldClasses(!!errors.name)}
          />
        </Field>

        <Field
          label="Username"
          htmlFor="username"
          error={errors.username}
          helper={errors.username ? undefined : "Others will find you by this. Letters, numbers, '_' or '.'"}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink-faint">
              @
            </span>
            <input
              id="username"
              autoComplete="off"
              autoCapitalize="off"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="yourname"
              className={fieldClasses(!!errors.username, { icon: true })}
            />
          </div>
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClasses(!!errors.email)}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password} helper={errors.password ? undefined : 'At least 8 characters.'}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className={`${fieldClasses(!!errors.password)} pr-10`}
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

        <Field label="Phone number" htmlFor="phone" error={errors.phone}>
          <PhoneField
            id="phone"
            dialCode={dialCode}
            onDialCodeChange={setDialCode}
            number={phoneNumber}
            onNumberChange={setPhoneNumber}
            error={!!errors.phone}
          />
        </Field>

        <Field label="Country of origin" htmlFor="country" error={errors.country}>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={fieldClasses(!!errors.country)}
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent-strong"
            />
            <span>
              I agree to Natio's{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-strong underline underline-offset-2"
              >
                Terms &amp; Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-[12.5px] text-danger">{errors.terms}</p>}
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Continue
        </Button>

        <p className="text-center text-[13.5px] text-ink-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="font-medium text-accent-strong cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </form>
    </OnboardingLayout>
  )
}
