import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { policySections } from '../../../lib/safetyPolicy'

const tintClasses = {
  accent: 'bg-accent-tint text-accent-strong',
  teal: 'bg-teal-tint text-teal',
  coral: 'bg-coral-tint text-coral',
  neutral: 'bg-bg-raised text-accent-strong',
}

export default function Safety() {
  return (
    <section id="safety" className="border-t border-border bg-bg-sunken">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <div className="max-w-lg">
          <h2 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Safety is the default, not an add-on.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            From your location to your payments to who shows up, safety is built
            into every part of Natio.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {policySections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border p-7">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tintClasses[section.tint]}`}
              >
                <section.icon size={22} weight="regular" />
              </span>
              <h3 className="mt-4 text-[16px] font-medium text-ink">{section.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{section.summary}</p>
            </div>
          ))}
        </div>

        <Link
          to="/safety"
          className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent-strong"
        >
          Read our full safety policy
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}
