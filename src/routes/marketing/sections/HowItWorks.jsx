import { Airplane, Fingerprint, UsersThree } from '@phosphor-icons/react'

const steps = [
  {
    icon: Fingerprint,
    title: 'Verify who you are',
    body: 'A quick passport photo and face scan confirm you are who you say you are, before you can message anyone.',
    tint: 'bg-accent-tint text-accent-strong',
  },
  {
    icon: Airplane,
    title: 'Tell us your trip',
    body: 'Add your arrival and departure dates. That window is what unlocks matching and sets your plan.',
    tint: 'bg-coral-tint text-coral',
  },
  {
    icon: UsersThree,
    title: 'Meet your people',
    body: 'Match one-on-one, or find a group of your nationality already meeting up nearby.',
    tint: 'bg-teal-tint text-teal',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        From landing to meeting up, in three steps.
      </h2>

      <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-px bg-border md:block"
        />
        {steps.map((step) => (
          <div key={step.title} className="relative">
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${step.tint}`}>
              <step.icon size={22} weight="regular" />
            </div>
            <h3 className="mt-5 text-lg font-medium text-ink">{step.title}</h3>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-ink-muted">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
