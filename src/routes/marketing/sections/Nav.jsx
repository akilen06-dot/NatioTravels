import { useState } from 'react'
import { Link } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'
import Button from '../../../components/Button'
import ThemeToggle from '../../../components/ThemeToggle'
import Logo from '../../../components/Logo'

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Safety', href: '#safety' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[17px] font-semibold tracking-tight">Natio</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14.5px] text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link to="/signin" className="text-[14.5px] text-ink-muted transition-colors duration-200 hover:text-ink px-2">
            Sign in
          </Link>
          <Link to="/start">
            <Button size="sm">Get started</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink cursor-pointer"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-bg px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[15px] text-ink-muted"
              >
                {l.label}
              </a>
            ))}
            <Link to="/signin" onClick={() => setOpen(false)} className="text-[15px] text-ink-muted">
              Sign in
            </Link>
            <Link to="/start" onClick={() => setOpen(false)}>
              <Button size="md" className="w-full">
                Get started
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
