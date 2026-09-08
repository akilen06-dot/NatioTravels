import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, ChatCircle, Heart, PersonSimpleRun } from '@phosphor-icons/react'
import { useStore, findPersonById } from '../lib/store'
import Avatar from './Avatar'

const ICON = { post_like: Heart, swipe_like: PersonSimpleRun, message: ChatCircle }

function describe(notif, actorName) {
  if (notif.type === 'post_like') return `${actorName} liked your post`
  if (notif.type === 'swipe_like') return `${actorName} swiped right on you`
  if (notif.type === 'message') return `${actorName}: ${notif.preview || 'sent you a message'}`
  return `${actorName}`
}

function linkFor(notif) {
  if (notif.type === 'post_like' && notif.postId) return `/posts/${notif.postId}`
  if (notif.type === 'message') return `/messages/match-${notif.actorId}`
  return `/people/${notif.actorId}`
}

function Toast({ notif }) {
  const navigate = useNavigate()
  const actor = useStore((s) => findPersonById(s, notif.actorId))
  const dismissToast = useStore((s) => s.dismissToast)
  const Icon = ICON[notif.type] || Bell

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => {
        dismissToast(notif.toastId)
        navigate(linkFor(notif))
      }}
      className="pointer-events-auto flex w-80 items-center gap-3 rounded-2xl border border-border bg-bg-raised p-3.5 text-left shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)] cursor-pointer"
    >
      <div className="relative shrink-0">
        <Avatar src={actor?.photo} className="h-10 w-10 rounded-full object-cover bg-bg-sunken" />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-white ring-2 ring-bg-raised">
          <Icon size={11} weight="fill" />
        </span>
      </div>
      <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
        {describe(notif, actor?.name || 'Someone')}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation()
          dismissToast(notif.toastId)
        }}
        className="shrink-0 text-[12px] text-ink-faint hover:text-ink cursor-pointer"
      >
        ✕
      </button>
    </motion.button>
  )
}

export default function NotificationToasts() {
  const toasts = useStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.toastId} notif={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
