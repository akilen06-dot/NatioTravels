import { Link } from 'react-router-dom'
import Logo from '../../../components/Logo'

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Safety', href: '#safety' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'natiotravels@gmail.com', href: 'mailto:natiotravels@gmail.com' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-[15px] font-semibold text-ink">Natio</span>
            </div>
            <p className="mt-3 max-w-[220px] text-[13.5px] leading-relaxed text-ink-muted">
              Meet verified travelers from home, wherever your trip takes you.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[13px] font-medium text-ink">{col.heading}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-[13px] text-ink-faint md:flex-row md:items-center md:justify-between">
          <span>© 2026 Natio Travels. All rights reserved.</span>
          <Link to="/signin" className="hover:text-ink-muted">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
