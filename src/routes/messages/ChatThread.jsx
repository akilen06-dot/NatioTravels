import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, File, Paperclip, PaperPlaneTilt, ProhibitInset, X } from '@phosphor-icons/react'
import { fieldClasses } from '../../lib/fieldClasses'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'
import { readAndResizeImage, readFileAsDataUrl } from '../../lib/imageFile'

function Attachment({ attachment }) {
  if (!attachment) return null
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        <img
          src={attachment.url}
          alt=""
          className="max-h-64 max-w-full rounded-xl object-cover"
        />
      </a>
    )
  }
  return (
    <a
      href={attachment.url}
      download={attachment.name || 'file'}
      className="flex items-center gap-2.5 rounded-xl bg-black/10 px-3 py-2.5 underline-offset-2 hover:underline"
    >
      <File size={20} className="shrink-0" />
      <span className="min-w-0 truncate text-[13.5px]">{attachment.name || 'File'}</span>
    </a>
  )
}

export default function ChatThread() {
  const { id } = useParams()
  const navigate = useNavigate()
  const thread = useStore((s) => s.threads[id])
  const sendMessage = useStore((s) => s.sendMessage)
  const blockedIds = useStore((s) => s.blockedIds)
  const unblockUser = useStore((s) => s.unblockUser)
  const refreshThreads = useStore((s) => s.refreshThreads)
  const [text, setText] = useState('')
  const [pendingAttachment, setPendingAttachment] = useState(null)
  const [attachError, setAttachError] = useState('')
  const [attaching, setAttaching] = useState(false)
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef(null)
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

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAttachError('')
    setAttaching(true)
    try {
      if (file.type.startsWith('image/')) {
        const url = await readAndResizeImage(file, { maxDim: 1280, quality: 0.85 })
        setPendingAttachment({ url, type: 'image', name: file.name })
      } else {
        const url = await readFileAsDataUrl(file)
        setPendingAttachment({ url, type: 'file', name: file.name })
      }
    } catch (err) {
      setAttachError(err.message || "Couldn't attach that file.")
    } finally {
      setAttaching(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() && !pendingAttachment) return
    setSending(true)
    try {
      await sendMessage(id, text.trim(), pendingAttachment || undefined)
      setText('')
      setPendingAttachment(null)
    } finally {
      setSending(false)
    }
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
              className={`flex max-w-[75%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                m.from === 'me'
                  ? 'self-end rounded-br-md bg-accent-strong text-white'
                  : 'self-start rounded-bl-md bg-bg-sunken text-ink'
              }`}
            >
              <Attachment attachment={m.attachment} />
              {m.text && <span>{m.text}</span>}
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
        <form onSubmit={handleSend} className="border-t border-border px-5 py-3.5">
          {attachError && <p className="mb-2 text-[12.5px] text-danger">{attachError}</p>}
          {pendingAttachment && (
            <div className="mb-2.5 flex items-center gap-2.5 rounded-xl bg-bg-sunken p-2 pr-3">
              {pendingAttachment.type === 'image' ? (
                <img src={pendingAttachment.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-raised">
                  <File size={20} className="text-ink-muted" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted">
                {pendingAttachment.name}
              </span>
              <button
                type="button"
                onClick={() => setPendingAttachment(null)}
                aria-label="Remove attachment"
                className="shrink-0 text-ink-faint hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attaching}
              aria-label="Attach a photo or file"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken disabled:opacity-50 cursor-pointer"
            >
              <Paperclip size={19} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message"
              className={fieldClasses(false)}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={sending || attaching || (!text.trim() && !pendingAttachment)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-strong text-white transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-50 cursor-pointer"
            >
              <PaperPlaneTilt size={18} weight="fill" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
