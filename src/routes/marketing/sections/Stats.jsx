import { useStore } from '../../../lib/store'

export default function Stats() {
  const verifiedTravelers = useStore((s) => s.verifiedTravelers)
  const meetupsThisYear = useStore((s) => s.meetupsThisYear)

  const stats = [
    { value: `${verifiedTravelers.toLocaleString()}+`, label: 'verified travelers', color: 'text-accent-strong' },
    { value: meetupsThisYear.toLocaleString(), label: 'meetups this year', color: 'text-coral' },
    { value: '92', label: 'countries represented', color: 'text-teal' },
    { value: '4.8/5', label: 'average trip rating', color: 'text-accent-strong' },
  ]

  return (
    <section className="border-y border-border bg-bg-sunken">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <div className={`font-mono text-2xl font-medium tracking-tight md:text-3xl ${s.color}`}>
              {s.value}
            </div>
            <div className="mt-1 text-[13.5px] text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
