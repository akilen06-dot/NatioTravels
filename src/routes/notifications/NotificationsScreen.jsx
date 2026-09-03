import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChatCircle, Heart, PersonSimpleRun } from '@phosphor-icons/react'
import { useStore, findPersonById } from '../../lib/store'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const ICON = { post_like: Heart, swipe_like: PersonSimpleRun, message: ChatCircle }

function describe(notif, actorName) {
  if (notif.type === 'post_like') return `${actorName} liked your post`
  if (notif.type === 'swipe_like') return `${actorName} swiped right on you`
  if (notif.type === 'message') return `${actorName}: ${notif.preview || 'sent you a message'}`
  return ''
}

function linkFor(notif) {
  if (notif.type === 'post_like' && notif.postId) return `/posts/${notif.postId}`
  if (notif.type === 'message') return `/messages/match-${notif.actorId}`
  return `/people/${notif.actorId}`
}

function NotificationRow({ notif }) {
  const actor = useStore((s) => findPersonById(s, notif.actorId))
  const Icon = ICON[notif.type] || Bell
  return (
    <Link
      to={linkFor(notif)}
      className={`flex items-center gap-3.5 py-3.5 -mx-2 rounded-xl px-2 transition-colors duration-200 hover:bg-bg-sunken ${
        notif.read ? '' : 'bg-accent-tint/40'
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={actor?.photo}
          alt=""
          className="h-11 w-11 rounded-full object-cover bg-bg-sunken"
        />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-white ring-2 ring-bg">
          <Icon size={11} weight="fill" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">{describe(notif, actor?.name || 'Someone')}</p>
      </div>
      <span className="shrink-0 text-[12px] text-ink-faint">{timeAgo(notif.at)}</span>
      {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent-strong" />}
    </Link>
  )
}

export default function NotificationsScreen() {
  const notifications = useStore((s) => s.notifications)
  const markNotificationsRead = useStore((s) => s.markNotificationsRead)

  useEffect(() => {
    markNotificationsRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-xl font-semibold text-ink">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-14 text-center">
          <Bell size={28} className="text-ink-faint" />
          <p className="mt-2 text-[13.5px] text-ink-muted">
            Likes, matches, and messages will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notif={n} />
          ))}
        </div>
      )}
    </div>
  )
}
