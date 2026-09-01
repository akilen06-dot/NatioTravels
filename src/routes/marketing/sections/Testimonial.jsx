import { Quotes } from '@phosphor-icons/react'

export default function Testimonial() {
  return (
    <section className="border-t border-border bg-bg-sunken">
      <div className="mx-auto max-w-3xl px-5 py-24 text-center md:py-28">
        <Quotes size={30} weight="fill" className="mx-auto mb-5 text-coral" />
        <blockquote className="text-2xl font-medium leading-snug tracking-tight text-ink md:text-3xl">
          "I landed in Seoul knowing no one. Three days later I had a group
          of fellow Australians showing me around like old friends."
        </blockquote>
        <p className="mt-6 text-[14.5px] text-ink-muted">
          Ella Whitfield · Melbourne, Australia
        </p>
      </div>
    </section>
  )
}
