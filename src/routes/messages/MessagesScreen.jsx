import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChatCircleDots } from '@phosphor-icons/react'
import { useStore } from '../../lib/store'
import Avatar from '../../components/Avatar'
import { useT, useTimeAgo } from '../../lib/i18n'

export default function MessagesScreen() {
  const t = useT()
  const timeAgo = useTimeAgo()
  const threads = useStore((s) => s.threads)
  const blockedIds = useStore((s) => s.blockedIds)
  const refreshThreads = useStore((s) => s.refreshThreads)

  useEffect(() => {
    refreshThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const list = Object.values(threads)
    .filter((thread) => {
      if (thread.type !== 'match') return true
      const personId = thread.id.replace(/^match-/, '')
      return !blockedIds.includes(personId)
    })
    .sort((a, b) => {
      const at = a.messages[a.messages.length - 1]?.at || ''
      const bt = b.messages[b.messages.length - 1]?.at || ''
      return bt.localeCompare(at)
    })

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-xl font-semibold text-ink">{t('Messages')}</h1>

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-14 text-center">
          <ChatCircleDots size={28} className="text-ink-faint" />
          <p className="mt-2 text-[13.5px] text-ink-muted">
            {t('Matches you message will show up here.')}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border">
          {list.map((thread) => {
            const last = thread.messages[thread.messages.length - 1]
            return (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className="flex items-center gap-3.5 py-3.5 transition-colors duration-200 hover:bg-bg-sunken -mx-2 px-2 rounded-xl"
              >
                <Avatar src={thread.photo} className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium text-ink">{thread.name}</p>
                  <p className="truncate text-[13px] text-ink-muted">
                    {last
                      ? last.text || (last.attachment?.type === 'image' ? t('Photo') : last.attachment?.name) || t('Attachment')
                      : t('Say hello')}
                  </p>
                </div>
                {last && <span className="shrink-0 text-[12px] text-ink-faint">{timeAgo(last.at)}</span>}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
