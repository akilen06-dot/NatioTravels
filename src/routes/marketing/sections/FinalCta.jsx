import { Link } from 'react-router-dom'
import Button from '../../../components/Button'

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
      <div
        className="rounded-3xl px-8 py-16 text-center md:py-20"
        style={{ background: 'linear-gradient(135deg, var(--color-accent-strong), var(--color-teal))' }}
      >
        <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Your next trip doesn't have to be a solo one.
        </h2>
        <div className="mt-8">
          <Link to="/start">
            <Button size="lg" variant="invert">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
