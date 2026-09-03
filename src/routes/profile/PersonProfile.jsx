import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChatCircle,
  Flag,
  LockKey,
  ProhibitInset,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react'
import Button from '../../components/Button'
import PostGrid from '../../components/PostGrid'
import { useStore, findPersonById } from '../../lib/store'

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'fake', label: 'Fake profile' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'other', label: 'Other' },
]

function FlagMenu({ personId, personName, isBlocked }) {
  const navigate = useNavigate()
  const blockUser = useStore((s) => s.blockUser)
  const unblockUser = useStore((s) => s.unblockUser)
  const reportUser = useStore((s) => s.reportUser)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('menu') // menu | report | reported

  function handleBlock() {
    blockUser(personId)
    setOpen(false)
    setMode('menu')
    navigate('/profile/settings/blocked')
  }

  function handleReport(reasonId) {
    reportUser(personId, reasonId)
    setMode('reported')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setMode('menu')
        }}
        aria-label="Block or report"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
      >
        <Flag size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-border bg-bg-raised p-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]">
          {mode === 'menu' && (
            <div className="flex flex-col">
              {isBlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    unblockUser(personId)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-ink transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
                >
                  <ProhibitInset size={17} />
                  Unblock {personName}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBlock}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-danger transition-colors duration-200 hover:bg-danger-tint cursor-pointer"
                >
                  <ProhibitInset size={17} />
                  Block {personName}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode('report')}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-ink transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
              >
                <WarningCircle size={17} />
                Report {personName}
              </button>
            </div>
          )}

          {mode === 'report' && (
            <div className="flex flex-col">
              <p className="px-3 pb-1 text-[12.5px] font-medium text-ink-muted">Why are you reporting this profile?</p>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleReport(r.id)}
                  className="rounded-xl px-3 py-2.5 text-left text-[13.5px] text-ink transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {mode === 'reported' && (
            <div className="px-3 py-4 text-center">
              <p className="text-[13.5px] font-medium text-ink">Report submitted</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Thanks for letting us know. Our safety team will review this profile.
              </p>
              <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PersonProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const person = useStore((s) => findPersonById(s, id))
  const allPosts = useStore((s) => s.posts)
  const posts = allPosts.filter((p) => p.authorId === id && !p.archived)
  const threadId = `match-${id}`
  const hasThread = useStore((s) => !!s.threads[threadId] || s.matches.includes(id))
  const blockedIds = useStore((s) => s.blockedIds)
  const isBlocked = blockedIds.includes(id)
  const refreshThreads = useStore((s) => s.refreshThreads)

  // A match made from the other side (or on another device) might not be in
  // this session's local threads/matches cache yet — refresh once so the
  // "Message" button shows up without needing to sign back in.
  useEffect(() => {
    refreshThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!person) {
    return <p className="p-8 text-center text-ink-muted">Profile not found.</p>
  }

  const unblockUser = useStore((s) => s.unblockUser)
  const isSelf = person.id === currentUser?.id
  const isPrivateToViewer = !!person.private && !isSelf && !hasThread

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {!isSelf && <FlagMenu personId={id} personName={person.name} isBlocked={isBlocked} />}
      </div>

      <div className="mt-4 flex items-center gap-5">
        <img src={person.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
        {!isPrivateToViewer && !isBlocked && (
          <div className="text-center">
            <p className="font-mono text-[17px] font-medium text-ink">{posts.length}</p>
            <p className="text-[12px] text-ink-muted">Posts</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h1 className="text-[16px] font-semibold text-ink">{person.name}</h1>
        <ShieldCheck size={16} weight="fill" className="text-accent-strong" />
      </div>
      {person.username && <p className="text-[13px] text-ink-faint">@{person.username}</p>}

      {isBlocked ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-danger/40 bg-danger-tint py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-raised text-danger">
            <ProhibitInset size={22} />
          </span>
          <p className="mt-4 text-[14.5px] font-medium text-ink">You've blocked {person.name}</p>
          <p className="mt-1 max-w-[260px] text-[13px] text-ink-muted">
            They can't message you, and you won't see them in Discover or Search. Unblock to see
            their profile and messages again.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => unblockUser(id)}>
            Unblock {person.name}
          </Button>
        </div>
      ) : isPrivateToViewer ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-sunken text-ink-faint">
            <LockKey size={22} />
          </span>
          <p className="mt-4 text-[14.5px] font-medium text-ink">This account is private</p>
          <p className="mt-1 max-w-[240px] text-[13px] text-ink-muted">
            Match with {person.name} to see their trip details and posts.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            {person.country}
            {person.city ? ` · ${person.city}` : ''}
          </p>
          {person.bio && <p className="mt-2 text-[14px] leading-relaxed text-ink">{person.bio}</p>}

          {hasThread && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-5"
              onClick={() => navigate(`/messages/${threadId}`)}
            >
              <ChatCircle size={16} />
              Message
            </Button>
          )}

          <div className="mt-8">
            <PostGrid posts={posts} emptyHint={`${person.name} hasn't shared anything yet.`} />
          </div>
        </>
      )}
    </div>
  )
}
