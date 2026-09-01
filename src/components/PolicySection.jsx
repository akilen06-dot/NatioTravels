export default function PolicySection({ icon: Icon, title, items }) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-bg-raised p-5 first:mt-0">
      <div className="flex items-center gap-2.5">
        <Icon size={19} className="text-accent-strong" />
        <p className="text-[14.5px] font-medium text-ink">{title}</p>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.term} className="text-[13.5px] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">{item.term}: </span>
            {item.body}
          </li>
        ))}
      </ul>
    </section>
  )
}
