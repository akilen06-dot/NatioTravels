import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, MagnifyingGlass, ShieldCheck, UsersFour } from '@phosphor-icons/react'
import { fieldClasses } from '../../lib/fieldClasses'
import TripLockedNotice from '../../components/TripLockedNotice'
import Button from '../../components/Button'
import { useStore, hasAccess, isTripLocked } from '../../lib/store'

const FREE_SEARCH_LIMIT = 5

export default function SearchScreen() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const travelers = useStore((s) => s.travelers)
  const existingUsers = useStore((s) => s.existingUsers)
  const blockedIds = useStore((s) => s.blockedIds)
  const [query, setQuery] = useState('')
  const locked = isTripLocked(currentUser)
  const unlimited = hasAccess(currentUser)

  const allResults = useMemo(() => {
    const pool = [...travelers, ...existingUsers].filter(
      (p) => p.id !== currentUser.id && !blockedIds.includes(p.id),
    )
    const q = query.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q),
    )
  }, [travelers, existingUsers, currentUser.id, blockedIds, query])

  const people = unlimited ? allResults : allResults.slice(0, FREE_SEARCH_LIMIT)
  const hiddenCount = allResults.length - people.length

  if (locked) {
    return (
      <TripLockedNotice
        title="Search is locked"
        body="Trip passes cover up to 14 days. Renew your plan to search for other travelers."
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="text-xl font-semibold text-ink">Search</h1>

      <div className="relative mt-5">
        <MagnifyingGlass
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or nationality"
          className={fieldClasses(false, { icon: true })}
        />
      </div>

      <div className="mt-5 flex flex-col divide-y divide-border">
        {people.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <UsersFour size={28} className="text-ink-faint" />
            <p className="mt-2 text-[13.5px] text-ink-muted">No one matches that search.</p>
          </div>
        ) : (
          people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/people/${p.id}`)}
              className="flex items-center gap-3.5 py-3 text-left transition-colors duration-200 hover:bg-bg-sunken -mx-2 px-2 rounded-xl cursor-pointer"
            >
              <img src={p.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[14.5px] font-medium text-ink">{p.name}</p>
                  <ShieldCheck size={14} weight="fill" className="shrink-0 text-accent-strong" />
                </div>
                <p className="truncate text-[13px] text-ink-muted">
                  {p.country}
                  {p.city ? ` · ${p.city}` : ''}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {!unlimited && hiddenCount > 0 && (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-5 py-6 text-center">
          <Lock size={20} className="text-ink-faint" />
          <p className="mt-2 text-[13.5px] font-medium text-ink">
            {hiddenCount} more {hiddenCount === 1 ? 'result' : 'results'} hidden
          </p>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Free search is limited to {FREE_SEARCH_LIMIT} people. Add a plan to see everyone.
          </p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/onboarding/plan')}>
            Add a plan to unlock
          </Button>
        </div>
      )}
    </div>
  )
}
