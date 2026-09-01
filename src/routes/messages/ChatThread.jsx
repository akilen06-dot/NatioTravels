import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PaperPlaneTilt, ProhibitInset } from '@phosphor-icons/react'
import { fieldClasses } from '../../lib/fieldClasses'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

export default function ChatThread() {
  const { id } = useParams()
  const navigate = useNavigate()
  const thread = useStore((s) => s.threads[id])
  const sendMessage = useStore((s) => s.sendMessage)
  const blockedIds = useStore((s) => s.blockedIds)
  const unblockUser = useStore((s) => s.unblockUser)
  const refreshThreads = useStore((s) => s.refreshThreads)
  const [text, setText] = useState('')
  // A thread can exist on the server before it's in this device's local
  // cache (e.g. the other person just completed the match) — refresh once
  // before concluding it really doesn't exist.
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    refreshThreads().finally(() => setChecked(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!thread) {
    if (!checked) return <p className="p-8 text-center text-ink-muted">Loading…</p>
    return <p className="p-8 text-center text-ink-muted">Conversation not found.</p>
  }

  const personId = thread.type === 'match' ? id.replace(/^match-/, '') : null
  const isBlocked = personId && blockedIds.includes(personId)

  function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(id, text.trim())
    setText('')
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-0">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate('/messages')}
          aria-label="Back"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <img src={thread.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
        <p className="text-[14.5px] font-medium text-ink">{thread.name}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
        {thread.messages.length === 0 ? (
          <p className="mt-8 text-center text-[13.5px] text-ink-muted">
            Say hi to {thread.name}.
          </p>
        ) : (
          thread.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                m.from === 'me'
                  ? 'self-end rounded-br-md bg-accent-strong text-white'
                  : 'self-start rounded-bl-md bg-bg-sunken text-ink'
              }`}
            >
              {m.text}
            </div>
          ))
        )}
      </div>

      {isBlocked ? (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-danger-tint px-5 py-3.5">
          <p className="flex items-center gap-2 text-[13px] text-danger">
            <ProhibitInset size={16} />
            You've blocked {thread.name}. Unblock to send messages.
          </p>
          <Button variant="secondary" size="sm" onClick={() => unblockUser(personId)}>
            Unblock
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2.5 border-t border-border px-5 py-3.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message"
            className={fieldClasses(false)}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!text.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-strong text-white transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-50 cursor-pointer"
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </form>
      )}
    </div>
  )
}
