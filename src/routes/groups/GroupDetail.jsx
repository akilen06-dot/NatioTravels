import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarBlank, Check, MapPinLine, ProhibitInset, Star, Trash, UserMinus, X } from '@phosphor-icons/react'
import Button from '../../components/Button'
import TripLockedNotice from '../../components/TripLockedNotice'
import RatingPrompt from '../../components/RatingPrompt'
import Avatar from '../../components/Avatar'
import { useStore, hasAccess, findPersonById } from '../../lib/store'

function Person({ id }) {
  const person = useStore((s) => findPersonById(s, id))
  const isYou = useStore((s) => s.currentUser?.id === id)
  if (!person) return null
  return (
    <div className="flex items-center gap-3">
      <Avatar src={person.photo} className="h-10 w-10 rounded-full object-cover" />
      <div>
        <p className="text-[14px] font-medium text-ink">
          {person.name}
          {isYou && <span className="text-ink-muted"> (you)</span>}
        </p>
        <p className="text-[12.5px] text-ink-muted">{person.country}</p>
      </div>
    </div>
  )
}

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const group = useStore((s) => s.groups.find((g) => g.id === id))
  const acceptRequest = useStore((s) => s.acceptRequest)
  const declineRequest = useStore((s) => s.declineRequest)
  const kickMember = useStore((s) => s.kickMember)
  const leaveGroup = useStore((s) => s.leaveGroup)
  const requestToJoin = useStore((s) => s.requestToJoin)
  const deleteGroup = useStore((s) => s.deleteGroup)
  const blockedIds = useStore((s) => s.blockedIds)
  const [confirmKick, setConfirmKick] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title="Group details are locked"
        body="Trip passes cover up to 14 days. Renew your plan to see meetup locations again."
      />
    ) : (
      <TripLockedNotice
        title="Groups are for paying travelers"
        body="Add a Trip Pass or subscription to see meetup locations and join in."
        ctaLabel="Add a plan to unlock"
      />
    )
  }

  if (!group) {
    return <p className="p-8 text-center text-ink-muted">Group not found.</p>
  }

  const isOwner = group.ownerId === currentUser.id
  const isMember = group.members.includes(currentUser.id)
  const hasRequested = group.pendingRequests.includes(currentUser.id)
  const ratings = group.ratings || []
  const hasHappened = new Date(group.date) < new Date()
  const hasRated = ratings.some((r) => r.userId === currentUser.id)
  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null

  if (!isOwner && !isMember && blockedIds.includes(group.ownerId)) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger">
          <ProhibitInset size={24} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-ink">Group unavailable</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          You've blocked the organizer of this group, so it's hidden from you.
        </p>
      </div>
    )
  }

  const visibleMembers = group.members.filter((uid) => !blockedIds.includes(uid))
  const visiblePendingRequests = group.pendingRequests.filter((uid) => !blockedIds.includes(uid))

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        ← Back to groups
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{group.name}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">{group.nationality} nationality meetup</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full bg-accent-tint px-3 py-1 text-[12.5px] font-medium text-accent-strong">
            {visibleMembers.length} going
          </span>
          {avgRating && (
            <span className="flex items-center gap-1 text-[12.5px] text-ink-muted">
              <Star size={13} weight="fill" className="text-coral" />
              {avgRating} ({ratings.length})
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-[14px] text-ink-muted">
        <div className="flex items-center gap-2">
          <CalendarBlank size={17} />
          {new Date(group.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2">
          <MapPinLine size={17} />
          Approximate area only, {group.city} · exact spot shared once you join
        </div>
      </div>

      <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-ink">{group.description}</p>

      {hasHappened && isMember && !hasRated && (
        <div className="mt-6">
          <RatingPrompt groupId={group.id} groupName={group.name} />
        </div>
      )}

      {!isMember && !isOwner && (
        <Button className="mt-6" onClick={() => requestToJoin(group.id)} disabled={hasRequested}>
          {hasRequested ? 'Request sent' : 'Request to join'}
        </Button>
      )}

      {isMember && !isOwner && (
        <Button variant="secondary" className="mt-6" onClick={() => leaveGroup(group.id)}>
          Leave group
        </Button>
      )}

      {isOwner && (
        <div className="mt-6">
          {confirmDelete ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-danger/40 bg-danger-tint p-3.5">
              <p className="flex-1 text-[13px] text-danger">
                Delete this group for everyone? This can't be undone.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-2.5 py-1.5 text-[12.5px] text-ink-muted hover:bg-bg-sunken cursor-pointer"
              >
                Cancel
              </button>
              <Button
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  await deleteGroup(group.id)
                  navigate('/groups')
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-danger cursor-pointer"
            >
              <Trash size={15} />
              Delete group
            </button>
          )}
        </div>
      )}

      {isOwner && visiblePendingRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[13px] font-medium text-ink-muted">
            Requests to join ({visiblePendingRequests.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {visiblePendingRequests.map((uid) => (
              <div
                key={uid}
                className="flex items-center justify-between rounded-2xl border border-border bg-bg-raised p-3.5"
              >
                <Person id={uid} />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => declineRequest(group.id, uid)}
                    aria-label="Decline"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-ink-muted transition-colors duration-200 hover:text-danger hover:border-danger/40 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptRequest(group.id, uid)}
                    aria-label="Accept"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-strong text-white transition-colors duration-200 hover:bg-accent-strong/90 cursor-pointer"
                  >
                    <Check size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[13px] font-medium text-ink-muted">Members</h2>
        <div className="mt-3 flex flex-col gap-3">
          {visibleMembers.map((uid) => (
            <div
              key={uid}
              className="flex items-center justify-between rounded-2xl border border-border bg-bg-raised p-3.5"
            >
              <Person id={uid} />
              {isOwner && uid !== currentUser.id && (
                confirmKick === uid ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] text-ink-muted">Remove?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmKick(null)}
                      className="rounded-full px-2.5 py-1 text-[12.5px] text-ink-muted hover:bg-bg-sunken cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        kickMember(group.id, uid)
                        setConfirmKick(null)
                      }}
                      className="rounded-full bg-danger px-2.5 py-1 text-[12.5px] font-medium text-white hover:bg-danger/90 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmKick(uid)}
                    aria-label="Remove member"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:text-danger hover:bg-danger-tint cursor-pointer"
                  >
                    <UserMinus size={17} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
