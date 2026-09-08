import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react'
import SwipeCard, { SwipeButton } from './SwipeCard'
import MatchModal from './MatchModal'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess, isPromoLimited, PROMO_WEEKLY_SWIPE_LIMIT } from '../../lib/store'
import { isBackendConfigured } from '../../lib/supabaseClient'
import { distanceKm } from '../../lib/api/matches'

// After a Paddle redirect, the webhook that flips `plan` on the server can
// lag the browser landing back on this page by a second or two — poll a
// few times rather than giving up on the first empty check.
const PAYMENT_CONFIRM_ATTEMPTS = 5
const PAYMENT_CONFIRM_DELAY_MS = 1500

export default function DiscoverScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentUser = useStore((s) => s.currentUser)
  const travelers = useStore((s) => s.travelers)
  const likedIds = useStore((s) => s.likedIds)
  const passedIds = useStore((s) => s.passedIds)
  const blockedIds = useStore((s) => s.blockedIds)
  const swipe = useStore((s) => s.swipe)
  const undoLastSwipe = useStore((s) => s.undoLastSwipe)
  const refreshDiscover = useStore((s) => s.refreshDiscover)
  const refreshCurrentUser = useStore((s) => s.refreshCurrentUser)
  const checkSwipeLimitReached = useStore((s) => s.checkSwipeLimitReached)
  const [matched, setMatched] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [swipeLimitReached, setSwipeLimitReached] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(
    isBackendConfigured && searchParams.get('checkout') === 'success',
  )
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!isPromoLimited(currentUser)) return
    let cancelled = false
    checkSwipeLimitReached().then((reached) => {
      if (!cancelled) setSwipeLimitReached(reached)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  // Coming back from a real Paddle Checkout: the local currentUser is
  // whatever it was before payment, so re-pull it from the server (which
  // the webhook has just updated) before deciding whether this user has
  // access.
  useEffect(() => {
    if (!confirmingPayment) return
    navigate('/discover', { replace: true })
    let cancelled = false
    ;(async () => {
      for (let attempt = 0; attempt < PAYMENT_CONFIRM_ATTEMPTS; attempt++) {
        await refreshCurrentUser()
        if (cancelled) return
        if (hasAccess(useStore.getState().currentUser)) break
        await new Promise((resolve) => setTimeout(resolve, PAYMENT_CONFIRM_DELAY_MS))
      }
      if (!cancelled) setConfirmingPayment(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (confirmingPayment) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8">
        <p className="text-[13.5px] text-ink-muted">Confirming your payment…</p>
      </div>
    )
  }

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

  if (swipeLimitReached) {
    return (
      <TripLockedNotice
        title="You're out of swipes for this week"
        body={`Free access is capped at ${PROMO_WEEKLY_SWIPE_LIMIT} swipes a week. It resets on a rolling basis, or add a plan for unlimited swiping.`}
        ctaLabel="Add a plan to unlock"
      />
    )
  }

  async function handleSwiped(direction) {
    const traveler = deck[0]
    const result = await swipe(traveler.id, direction === 'like')
    if (result?.limitReached) {
      setSwipeLimitReached(true)
      return
    }
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
          aria-label="Review skipped travelers"
          title="Bring back people you've skipped"
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
