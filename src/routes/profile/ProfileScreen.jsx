import { Link, useNavigate } from 'react-router-dom'
import { GearSix, ShieldCheck } from '@phosphor-icons/react'
import Button from '../../components/Button'
import PostGrid from '../../components/PostGrid'
import Avatar from '../../components/Avatar'
import { useStore, isTripLocked, isTripCapped, tripPassExpiry } from '../../lib/store'

function daysLeft(expiry) {
  if (!expiry) return null
  const diff = expiry.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function ProfileScreen() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const signOut = useStore((s) => s.signOut)
  const allPosts = useStore((s) => s.posts)
  const posts = allPosts.filter((p) => p.authorId === currentUser.id && !p.archived)
  const matches = useStore((s) => s.matches)
  const groups = useStore((s) => s.groups)
  const locked = isTripLocked(currentUser)
  const capped = isTripCapped(currentUser)
  const remaining = daysLeft(tripPassExpiry(currentUser))
  const myGroupsCount = groups.filter(
    (g) => g.ownerId === currentUser.id || g.members.includes(currentUser.id),
  ).length

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Avatar src={currentUser.photo} className="h-20 w-20 rounded-full object-cover" />
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-mono text-[17px] font-medium text-ink">{posts.length}</p>
              <p className="text-[12px] text-ink-muted">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[17px] font-medium text-ink">{matches.length}</p>
              <p className="text-[12px] text-ink-muted">Matches</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[17px] font-medium text-ink">{myGroupsCount}</p>
              <p className="text-[12px] text-ink-muted">Groups</p>
            </div>
          </div>
        </div>
        <Link
          to="/profile/settings"
          aria-label="Settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <GearSix size={20} />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h1 className="text-[16px] font-semibold text-ink">{currentUser.name}</h1>
        <ShieldCheck size={16} weight="fill" className="text-accent-strong" />
      </div>
      {currentUser.username && (
        <p className="text-[13px] text-ink-faint">@{currentUser.username}</p>
      )}
      <p className="mt-1 text-[13.5px] text-ink-muted">
        {currentUser.country} · {currentUser.city}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-ink">{currentUser.bio}</p>

      <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate('/profile/edit')}>
        Edit profile
      </Button>

      <div className="mt-5 rounded-2xl border border-border bg-bg-raised p-5">
        {currentUser.plan ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[14.5px] font-medium text-ink">
                {currentUser.plan === 'subscription' ? 'Frequent Traveler' : 'Trip Pass'}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                  locked ? 'bg-danger-tint text-danger' : 'bg-accent-tint text-accent-strong'
                }`}
              >
                {locked ? 'Expired' : 'Active'}
              </span>
            </div>
            {currentUser.plan === 'subscription' ? (
              <p className="mt-1.5 text-[13px] text-ink-muted">
                Billed {currentUser.billing === 'annual' ? 'yearly' : 'monthly'}. Unlimited trips.
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-[13px] text-ink-muted">
                  {locked
                    ? 'Your 14-day pass window has closed.'
                    : `${remaining ?? 0} day${remaining === 1 ? '' : 's'} left on this pass.`}
                </p>
                {capped && !locked && (
                  <p className="mt-1 text-[12px] text-ink-faint">
                    Your trip runs longer than 14 days. This pass covers only the first 14, from{' '}
                    {new Date(currentUser.tripStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.
                  </p>
                )}
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/onboarding/plan')}
            >
              {locked ? 'Renew plan' : 'Manage plan'}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[14.5px] font-medium text-ink">No active plan</p>
              <span className="rounded-full bg-bg-sunken px-2.5 py-1 text-[12px] font-medium text-ink-muted">
                Free
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              You're browsing Natio without a Trip Pass or subscription. Add one whenever you're ready.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/onboarding/plan')}
            >
              Add a plan
            </Button>
          </>
        )}
      </div>

      <div className="mt-8">
        <PostGrid
          posts={posts}
          onAddClick={() => navigate('/profile/new')}
          emptyHint="Share a photo from your trip and it'll show up here."
        />
      </div>

      <button
        type="button"
        onClick={() => signOut()}
        className="mt-8 text-[13.5px] font-medium text-ink-muted transition-colors duration-200 hover:text-danger cursor-pointer"
      >
        Sign out
      </button>
    </div>
  )
}
