import { useRef, useState } from 'react'
import { ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react'
import SwipeCard, { SwipeButton } from './SwipeCard'
import MatchModal from './MatchModal'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess } from '../../lib/store'
import { isBackendConfigured } from '../../lib/supabaseClient'
import { distanceKm } from '../../lib/api/matches'

export default function DiscoverScreen() {
  const currentUser = useStore((s) => s.currentUser)
  const travelers = useStore((s) => s.travelers)
  const likedIds = useStore((s) => s.likedIds)
  const passedIds = useStore((s) => s.passedIds)
  const blockedIds = useStore((s) => s.blockedIds)
  const swipe = useStore((s) => s.swipe)
  const undoLastSwipe = useStore((s) => s.undoLastSwipe)
  const refreshDiscover = useStore((s) => s.refreshDiscover)
  const [matched, setMatched] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const triggerRef = useRef(null)

  async function handleRefresh() {
    setRefreshing(true)
    await refreshDiscover()
    setRefreshing(false)
  }

  const deck = travelers
    .filter((t) => !likedIds.includes(t.id) && !passedIds.includes(t.id) && !blockedIds.includes(t.id))
    .map((t) =>
      isBackendConfigured ? { ...t, distanceKm: distanceKm(currentUser, t) ?? '?' } : t,
    )

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title="Your trip has ended"
        body="Trip passes cover up to 14 days. Renew your plan to browse and match with travelers again."
      />
    ) : (
      <TripLockedNotice
        title="Discover is for paying travelers"
        body="Add a Trip Pass or subscription to browse and match with travelers of your nationality."
        ctaLabel="Add a plan to unlock"
      />
    )
  }

  async function handleSwiped(direction) {
    const traveler = deck[0]
    const result = await swipe(traveler.id, direction === 'like')
    if (direction === 'like' && result?.matched) setMatched(traveler)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-8">
      <div className="relative w-full text-center">
        <h1 className="text-xl font-semibold text-ink">Discover</h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Travelers of your nationality, nearby right now.
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken disabled:opacity-50 cursor-pointer"
        >
          <ArrowClockwise size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative mt-6 h-[480px] w-full max-w-[340px]">
        {deck.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong text-center">
            <p className="text-[15px] font-medium text-ink">You're all caught up</p>
            <p className="mt-1 max-w-[220px] text-[13.5px] text-ink-muted">
              Check back soon for more travelers nearby.
            </p>
          </div>
        ) : (
          deck
            .slice(0, 3)
            .reverse()
            .map((t, i, arr) => {
              const isTop = i === arr.length - 1
              return (
                <SwipeCard
                  key={t.id}
                  ref={isTop ? triggerRef : undefined}
                  traveler={t}
                  active={isTop}
                  onSwiped={handleSwiped}
                />
              )
            })
        )}
      </div>

      {deck.length > 0 && (
        <div className="mt-7 flex items-center gap-5">
          <button
            type="button"
            onClick={undoLastSwipe}
            aria-label="Undo"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
          >
            <ArrowCounterClockwise size={19} />
          </button>
          <SwipeButton variant="pass" onClick={() => triggerRef.current?.trigger('pass')} />
          <SwipeButton variant="like" onClick={() => triggerRef.current?.trigger('like')} />
          <div className="w-10" />
        </div>
      )}

      <MatchModal traveler={matched} onClose={() => setMatched(null)} />
    </div>
  )
}
