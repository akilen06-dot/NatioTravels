import Nav from './sections/Nav'
import Footer from './sections/Footer'
import PolicySection from '../../components/PolicySection'
import { policySections } from '../../lib/safetyPolicy'

export default function SafetyPolicy() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Safety & privacy
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          How Natio keeps your location, payments, and meetups safe, in full.
        </p>

        <div className="mt-10">
          {policySections.map((section) => (
            <PolicySection key={section.title} {...section} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
