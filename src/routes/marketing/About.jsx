import { Compass, Heart, ShieldCheck } from '@phosphor-icons/react'
import Nav from './sections/Nav'
import Footer from './sections/Footer'

const values = [
  {
    icon: Heart,
    title: 'Cultural Connection',
    tint: 'coral',
    body: 'We believe the strongest bonds are built on shared roots, heritage, and home traditions.',
  },
  {
    icon: ShieldCheck,
    title: 'Absolute Privacy',
    tint: 'accent',
    body: 'Your trust is our priority. We utilize smart backend matching while keeping your exact live location completely invisible to others.',
  },
  {
    icon: Compass,
    title: 'Safe Exploration',
    tint: 'teal',
    body: 'We cultivate a vetted, secure space so you can confidently expand your global network.',
  },
]

const tintClasses = {
  accent: 'bg-accent-tint text-accent-strong',
  teal: 'bg-teal-tint text-teal',
  coral: 'bg-coral-tint text-coral',
}

export default function About() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">About us</h1>

        <div className="mt-6 flex flex-col gap-4 text-[15px] leading-relaxed text-ink-muted">
          <p>
            Natio Travels is a global networking platform founded in 2026 in Mauritius.
          </p>
          <p>
            We bridge distances for global citizens by connecting travelers and expatriates from
            the same nation while they are exploring or living abroad anywhere in the world.
          </p>
          <p>
            Whether you are looking to share a meal, speak your native language, or navigate a
            new culture with someone who understands home, our app safely brings fellow nationals
            together.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-accent-strong bg-accent-tint p-8 text-center">
          <p className="text-[13px] font-medium uppercase tracking-wide text-accent-strong">
            Our Mission
          </p>
          <p className="mt-3 text-[19px] font-medium leading-snug tracking-tight text-ink md:text-[22px]">
            To cure homesickness and foster community by making the world feel a little smaller,
            ensuring no traveler ever walks alone.
          </p>
        </div>

        <h2 className="mt-14 text-[17px] font-semibold text-ink">Core Values</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-bg-raised p-6">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tintClasses[v.tint]}`}
              >
                <v.icon size={21} weight="regular" />
              </span>
              <h3 className="mt-4 text-[15px] font-medium text-ink">{v.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{v.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-[17px] font-semibold text-ink">Our Story</h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">
          Born on the vibrant, multicultural island of Mauritius, Natio Travels was inspired by
          the modern nomadic lifestyle. We realized that no matter how far people travel, they
          always look for a piece of home. Launched in 2026, we built a digital bridge that turns
          unfamiliar foreign cities into welcoming spaces filled with familiar faces.
        </p>
      </div>
      <Footer />
    </div>
  )
}
