import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, parseISO } from 'date-fns'
import { Check, CreditCard } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'
import { isBackendConfigured } from '../../lib/supabaseClient'
import { isStripeConfigured, createCheckoutSession } from '../../lib/api/billing'

const useRealCheckout = isBackendConfigured && isStripeConfigured

const paymentMethods = [
  { id: 'card', label: 'Card' },
  { id: 'applepay', label: 'Apple Pay' },
  { id: 'googlepay', label: 'Google Pay' },
  { id: 'paypal', label: 'PayPal' },
]

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function expiryError(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return 'Enter a valid expiry date (MM/YY).'
  const month = parseInt(match[1], 10)
  const year = 2000 + parseInt(match[2], 10)
  if (month < 1 || month > 12) return 'Enter a valid month.'
  const validThrough = new Date(year, month, 0, 23, 59, 59, 999)
  if (validThrough < new Date()) return 'This card has expired.'
  return ''
}

export default function PlanSelect() {
  const navigate = useNavigate()
  const auth = useStore((s) => s.auth)
  const draft = useStore((s) => s.draft)
  const setTripDates = useStore((s) => s.setTripDates)
  const choosePlanAndFinish = useStore((s) => s.choosePlanAndFinish)
  const skipPlanAndFinish = useStore((s) => s.skipPlanAndFinish)
  const renewTrip = useStore((s) => s.renewTrip)
  const upgradeToSubscription = useStore((s) => s.upgradeToSubscription)
  const isRenewal = auth === 'active'
  const [plan, setPlan] = useState(draft.intendedPlan || 'trip')
  const [billing, setBilling] = useState('annual')
  const [tripStart, setTripStart] = useState(draft.tripStart || '')
  const [tripEnd, setTripEnd] = useState(draft.tripEnd || '')
  const [tripError, setTripError] = useState('')
  const [method, setMethod] = useState('card')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function completePayment() {
    setSubmitError('')
    setSubmitting(true)
    try {
      if (useRealCheckout) {
        // The Edge Function needs an authenticated Supabase user to attach
        // the Checkout session to. For a brand-new signup that account
        // doesn't exist yet, so create it first (with no plan — the Stripe
        // webhook sets the real plan once payment succeeds).
        if (!isRenewal) await skipPlanAndFinish()
        const url = await createCheckoutSession(plan, billing)
        window.location.href = url
        return
      }
      if (isRenewal) {
        if (plan === 'trip') {
          const start = new Date()
          const end = new Date()
          end.setDate(end.getDate() + 14)
          await renewTrip(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
        } else {
          await upgradeToSubscription(billing)
        }
      } else {
        await choosePlanAndFinish(plan, billing)
      }
      navigate('/discover')
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function validateTrip() {
    if (isRenewal) return true
    if (!tripStart || !tripEnd) {
      setTripError('Add both an arrival and a departure date.')
      return false
    }
    if (new Date(tripEnd) <= new Date(tripStart)) {
      setTripError('Your departure date should be after your arrival date.')
      return false
    }
    const days = Math.round((new Date(tripEnd) - new Date(tripStart)) / (1000 * 60 * 60 * 24))
    if (plan === 'trip' && days > 14) {
      setTripError(
        "Your trip is longer than 14 days, so a Trip Pass won't cover it. Choose Frequent Traveler, or shorten your trip.",
      )
      return false
    }
    setTripError('')
    setTripDates(tripStart, tripEnd)
    return true
  }

  function handleCardPay(e) {
    e.preventDefault()
    if (!validateTrip()) return
    const next = {}
    if (card.replace(/\D/g, '').length < 12) next.card = 'Enter a valid card number.'
    const expErr = expiryError(expiry)
    if (expErr) next.expiry = expErr
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = 'Enter a valid CVC.'
    setErrors(next)
    if (Object.keys(next).length) return
    completePayment()
  }

  function handleAltPay() {
    if (!validateTrip()) return
    completePayment()
  }

  async function skipForNow() {
    setSubmitError('')
    setSubmitting(true)
    try {
      await skipPlanAndFinish()
      navigate('/discover')
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const annualMonthly = (142.99 / 12).toFixed(2)

  const tripLengthDays =
    tripStart && tripEnd
      ? Math.round((new Date(tripEnd) - new Date(tripStart)) / (1000 * 60 * 60 * 24))
      : null
  const tripExceeds14Days = !isRenewal && tripLengthDays !== null && tripLengthDays > 14

  const dueNow = plan === 'trip' ? '$9.99' : billing === 'annual' ? '$142.99' : '$16.99'
  const dueCadence = plan === 'trip' ? 'one time' : billing === 'annual' ? 'billed yearly' : 'billed monthly'

  return (
    <OnboardingLayout
      title="Choose your plan"
      subtitle={isRenewal ? 'Pick what fits how you travel.' : 'Add your trip dates, then pick a plan.'}
      onSkip={!isRenewal ? skipForNow : undefined}
      skipLabel="Skip for now"
    >
      {!isRenewal && (
        <div className="mb-7 flex flex-col gap-5">
          <Field label="Arrival date" htmlFor="trip-start">
            <DatePicker
              id="trip-start"
              value={tripStart}
              onChange={(next) => {
                setTripStart(next)
                setTripError('')
                if (tripEnd && new Date(tripEnd) <= new Date(next)) setTripEnd('')
              }}
              placeholder="When do you arrive?"
            />
          </Field>
          <Field label="Departure date" htmlFor="trip-end" error={tripError}>
            <DatePicker
              id="trip-end"
              value={tripEnd}
              onChange={(next) => {
                setTripEnd(next)
                setTripError('')
              }}
              placeholder="When do you leave?"
              error={!!tripError}
              disabledMatcher={tripStart ? { before: addDays(parseISO(tripStart), 1) } : undefined}
              defaultMonth={tripStart ? parseISO(tripStart) : undefined}
            />
          </Field>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setPlan('trip')}
          className={`rounded-2xl border p-5 text-left transition-colors duration-200 cursor-pointer ${
            plan === 'trip' ? 'border-accent-strong bg-accent-tint' : 'border-border-strong bg-bg-raised'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-ink">Trip Pass</span>
            <span className="font-mono text-lg font-medium text-ink">$9.99</span>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">Up to 14 days, then it ends on its own.</p>
          {tripExceeds14Days && plan === 'trip' && (
            <p className="mt-3 rounded-lg bg-danger-tint px-3 py-2 text-[12.5px] leading-relaxed text-danger">
              Your trip is {tripLengthDays} days. This pass still expires 14 days after you
              arrive, not at the end of your trip. Frequent Traveler covers the whole thing.
            </p>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPlan('subscription')}
          className={`rounded-2xl border p-5 text-left transition-colors duration-200 cursor-pointer ${
            plan === 'subscription' ? 'border-accent-strong bg-accent-tint' : 'border-border-strong bg-bg-raised'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-ink">Frequent Traveler</span>
            <span className="font-mono text-lg font-medium text-ink">
              ${billing === 'annual' ? annualMonthly : '16.99'}
              <span className="text-[12px] text-ink-muted">/mo</span>
            </span>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">Unlimited trips, no per-trip fees.</p>

          {plan === 'subscription' && (
            <div className="mt-3 flex w-fit items-center gap-1 rounded-full border border-border bg-bg-raised p-1 text-[12.5px]">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setBilling('monthly')
                }}
                className={`rounded-full px-2.5 py-1 cursor-pointer ${billing === 'monthly' ? 'bg-bg-sunken text-ink' : 'text-ink-muted'}`}
              >
                Monthly
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setBilling('annual')
                }}
                className={`rounded-full px-2.5 py-1 cursor-pointer ${billing === 'annual' ? 'bg-bg-sunken text-ink' : 'text-ink-muted'}`}
              >
                Annual, save 30%
              </span>
            </div>
          )}
        </button>
      </div>

      <div className="mt-7 flex items-center justify-between rounded-xl bg-bg-sunken px-4 py-3">
        <span className="text-[13.5px] text-ink-muted">Due now</span>
        <span className="font-mono text-[15px] font-medium text-ink">
          {dueNow} <span className="font-sans text-[12px] text-ink-muted">{dueCadence}</span>
        </span>
      </div>

      {submitError && (
        <p className="mt-4 rounded-lg bg-danger-tint px-3 py-2 text-[12.5px] leading-relaxed text-danger">
          {submitError}
        </p>
      )}

      {useRealCheckout ? (
        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={submitting}
          onClick={completePayment}
        >
          <Check size={18} weight="bold" />
          {submitting ? 'Redirecting…' : 'Continue to Stripe Checkout'}
        </Button>
      ) : (
        <>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {paymentMethods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`rounded-xl border py-2.5 text-center text-[12.5px] font-medium transition-colors duration-200 cursor-pointer ${
              method === m.id
                ? 'border-accent-strong bg-accent-tint text-accent-strong'
                : 'border-border-strong bg-bg-raised text-ink-muted hover:border-border'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'card' ? (
        <form onSubmit={handleCardPay} className="mt-5 flex flex-col gap-5">
          <Field label="Card number" htmlFor="card" error={errors.card}>
            <div className="relative">
              <CreditCard size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="card"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                className={fieldClasses(!!errors.card, { icon: true })}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry" htmlFor="exp" error={errors.expiry}>
              <input
                id="exp"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                className={fieldClasses(!!errors.expiry)}
              />
            </Field>
            <Field label="CVC" htmlFor="cvc" error={errors.cvc}>
              <input
                id="cvc"
                inputMode="numeric"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={fieldClasses(!!errors.cvc)}
              />
            </Field>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            <Check size={18} weight="bold" />
            {submitting
              ? 'Processing…'
              : plan === 'trip'
                ? isRenewal
                  ? 'Pay $9.99 and renew'
                  : 'Pay $9.99 and enter Natio'
                : 'Start subscription'}
          </Button>
        </form>
      ) : (
        <div className="mt-5">
          {method === 'applepay' && (
            <button
              type="button"
              onClick={handleAltPay}
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white transition-opacity duration-200 hover:opacity-90 cursor-pointer"
            >
              <img src="https://cdn.simpleicons.org/apple/ffffff" alt="" className="h-5 w-5" />
              <span className="text-[16px] font-medium">Pay</span>
            </button>
          )}
          {method === 'googlepay' && (
            <button
              type="button"
              onClick={handleAltPay}
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-strong bg-white text-black transition-colors duration-200 hover:bg-zinc-50 cursor-pointer"
            >
              <img src="https://cdn.simpleicons.org/googlepay/000000" alt="" className="h-5 w-5" />
              <span className="text-[16px] font-medium">Pay</span>
            </button>
          )}
          {method === 'paypal' && (
            <button
              type="button"
              onClick={handleAltPay}
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0070BA] text-white transition-opacity duration-200 hover:opacity-90 cursor-pointer"
            >
              <img src="https://cdn.simpleicons.org/paypal/ffffff" alt="" className="h-5 w-5" />
              <span className="text-[16px] font-medium">PayPal</span>
            </button>
          )}
        </div>
      )}
        </>
      )}

      <p className="mt-4 text-center text-[12px] text-ink-faint">
        {useRealCheckout
          ? "You'll enter your card on Stripe's secure checkout page."
          : 'Prototype checkout. No real payment is processed.'}
      </p>
      <p className="mt-2 text-center text-[12px] text-ink-faint">
        By paying, you agree to our{' '}
        <Link
          to="/terms#fees-and-billing"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ink-muted"
        >
          Terms
        </Link>
        .
      </p>

      {!isRenewal && (
        <button
          type="button"
          onClick={skipForNow}
          className="mt-5 w-full text-center text-[13px] font-medium text-ink-muted underline underline-offset-2 transition-colors duration-200 hover:text-ink cursor-pointer"
        >
          Skip for now — you can add a plan anytime from your profile
        </button>
      )}
    </OnboardingLayout>
  )
}
