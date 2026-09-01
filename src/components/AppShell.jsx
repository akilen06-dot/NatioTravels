import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  Compass,
  SignOut,
  ChatCircleDots,
  MagnifyingGlass,
  UsersThree,
  UserCircle,
} from '@phosphor-icons/react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { useStore } from '../lib/store'
import { useT } from '../lib/i18n'

const navItems = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/search', label: 'Search', icon: MagnifyingGlass },
  { to: '/groups', label: 'Groups', icon: UsersThree },
  { to: '/messages', label: 'Messages', icon: ChatCircleDots },
  { to: '/profile', label: 'Profile', icon: UserCircle },
]

function NavItems({ orientation }) {
  const t = useT()
  return navItems.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        orientation === 'side'
          ? `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] font-medium transition-colors duration-200 ${
              isActive ? 'bg-accent-tint text-accent-strong' : 'text-ink-muted hover:bg-bg-sunken hover:text-ink'
            }`
          : `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors duration-200 ${
              isActive ? 'text-accent-strong' : 'text-ink-faint'
            }`
      }
    >
      <Icon size={orientation === 'side' ? 19 : 22} weight="regular" />
      {t(label)}
    </NavLink>
  ))
}

export default function AppShell() {
  const navigate = useNavigate()
  const auth = useStore((s) => s.auth)
  const currentUser = useStore((s) => s.currentUser)
  const signOut = useStore((s) => s.signOut)
  const t = useT()

  if (auth !== 'active') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <Logo size={26} />
          <span className="text-[15px] font-semibold text-ink">Natio</span>
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          <NavItems orientation="side" />
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 rounded-xl p-2 text-left transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
          >
            <img src={currentUser?.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-ink">
                {currentUser?.name}
              </span>
              <span className="block text-[12px] text-ink-muted">{t('View profile')}</span>
            </span>
          </button>
          <div className="flex items-center justify-between px-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => signOut()}
              aria-label={t('Sign out')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span className="text-[14.5px] font-semibold text-ink">Natio</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-bg/95 backdrop-blur-md md:hidden">
          <NavItems orientation="bottom" />
        </nav>
      </div>
    </div>
  )
}
