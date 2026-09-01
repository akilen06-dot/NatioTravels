import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from '@phosphor-icons/react'
import Button from '../../../components/Button'

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  const annualMonthly = (142.99 / 12).toFixed(2)

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <div className="max-w-lg">
        <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Pay for the trip, or pay for the habit.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          Occasional travelers get a simple trip pass. Frequent flyers get a
          subscription that's cheaper across the year.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-bg-raised p-8">
          <h3 className="text-lg font-medium text-ink">Trip Pass</h3>
          <p className="mt-1 text-[14px] text-ink-muted">For one or two trips a year</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="font-mono text-4xl font-medium tracking-tight text-ink">$9.99</span>
            <span className="text-[14px] text-ink-muted">/ trip</span>
          </div>
          <p className="mt-2 text-[13.5px] text-ink-muted">
            Active for up to 14 days, then it ends on its own.
          </p>

          <ul className="mt-7 space-y-3">
            {[
              'Full access for your trip dates',
              'Solo matching and group events',
              'Auto-expires, nothing to cancel',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-teal" />
                {f}
              </li>
            ))}
          </ul>

          <Link to="/signup?plan=trip" className="mt-8 block">
            <Button variant="secondary" className="w-full">
              Get a trip pass
            </Button>
          </Link>
        </div>

        <div className="relative rounded-3xl border border-accent-strong bg-bg-raised p-8">
          <span className="absolute -top-3 left-8 rounded-full bg-accent-strong px-3 py-1 text-[12px] font-medium text-white">
            Most popular
          </span>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-ink">Frequent Traveler</h3>
              <p className="mt-1 text-[14px] text-ink-muted">For travelers on the move often</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-bg-sunken p-1 text-[12.5px]">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-2.5 py-1 cursor-pointer transition-colors duration-200 ${!annual ? 'bg-bg-raised text-ink shadow-sm' : 'text-ink-muted'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-2.5 py-1 cursor-pointer transition-colors duration-200 ${annual ? 'bg-bg-raised text-ink shadow-sm' : 'text-ink-muted'}`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-baseline gap-1">
            <span className="font-mono text-4xl font-medium tracking-tight text-ink">
              ${annual ? annualMonthly : '16.99'}
            </span>
            <span className="text-[14px] text-ink-muted">/ month</span>
          </div>
          <p className="mt-2 text-[13.5px] text-ink-muted">
            {annual ? 'Billed $142.99 yearly, about 30% off.' : 'Billed monthly, cancel anytime.'}
          </p>

          <ul className="mt-7 space-y-3">
            {[
              'Unlimited trips, no per-trip fees',
              'Solo matching and group events',
              'Priority safety support',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-ink">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-accent-strong" />
                {f}
              </li>
            ))}
          </ul>

          <Link to="/signup?plan=subscription" className="mt-8 block">
            <Button className="w-full">Start subscription</Button>
          </Link>
        </div>
      </div>

      <p className="mt-6 text-[13px] text-ink-faint">
        Fees are non-refundable except as described in our{' '}
        <Link
          to="/terms#fees-and-billing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          Terms
        </Link>
        . Prices shown in USD.
      </p>
    </section>
  )
}
