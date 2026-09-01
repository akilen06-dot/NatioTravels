import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlass, Plus, UsersThree } from '@phosphor-icons/react'
import TripLockedNotice from '../../components/TripLockedNotice'
import { fieldClasses } from '../../lib/fieldClasses'
import { useStore, hasAccess } from '../../lib/store'

function GroupCard({ group }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="block rounded-2xl border border-border bg-bg-raised p-4 transition-colors duration-200 hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium text-ink">{group.name}</h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {group.nationality} · {group.city}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-[12px] font-medium text-accent-strong">
          {group.members.length} going
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-ink-muted">
        {group.description}
      </p>
    </Link>
  )
}

export default function GroupsScreen() {
  const currentUser = useStore((s) => s.currentUser)
  const groups = useStore((s) => s.groups)
  const blockedIds = useStore((s) => s.blockedIds)
  const [query, setQuery] = useState('')

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title="Group details are locked"
        body="Trip passes cover up to 14 days. Renew your plan to see group meetups and locations again."
      />
    ) : (
      <TripLockedNotice
        title="Groups are for paying travelers"
        body="Add a Trip Pass or subscription to browse, join, and create group meetups."
        ctaLabel="Add a plan to unlock"
      />
    )
  }

  const mine = groups.filter(
    (g) => g.ownerId === currentUser.id || g.members.includes(currentUser.id),
  )
  const discoverable = groups
    .filter((g) => !mine.includes(g))
    .filter((g) => !blockedIds.includes(g.ownerId))
    .filter((g) => g.nationality.toLowerCase().includes(query.toLowerCase()) || query === '')

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Groups</h1>
          <p className="mt-1 text-[13.5px] text-ink-muted">Meet up with travelers from home.</p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent-strong px-4 text-[13.5px] font-medium text-white transition-colors duration-200 hover:bg-accent-strong/90"
        >
          <Plus size={16} weight="bold" />
          Create
        </Link>
      </div>

      {mine.length > 0 && (
        <section className="mt-7">
          <h2 className="text-[13px] font-medium text-ink-muted">My groups</h2>
          <div className="mt-3 flex flex-col gap-3">
            {mine.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[13px] font-medium text-ink-muted">Find a group by nationality</h2>
        <div className="relative mt-3">
          <MagnifyingGlass size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nationality, like Brazil"
            className={fieldClasses(false, { icon: true })}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {discoverable.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-10 text-center">
              <UsersThree size={28} className="text-ink-faint" />
              <p className="mt-2 text-[13.5px] text-ink-muted">No groups match that search yet.</p>
            </div>
          ) : (
            discoverable.map((g) => <GroupCard key={g.id} group={g} />)
          )}
        </div>
      </section>
    </div>
  )
}
