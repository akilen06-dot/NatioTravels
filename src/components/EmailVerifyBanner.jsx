import { useState } from 'react'
import { EnvelopeSimple } from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import { isBackendConfigured } from '../lib/supabaseClient'

// Soft verification only — this never blocks anything, it's just a nudge.
// Only meaningful once a real backend is configured (mock-mode users have
// no real email to verify).
export default function EmailVerifyBanner() {
  const currentUser = useStore((s) => s.currentUser)
  const sendVerificationEmail = useStore((s) => s.sendVerificationEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isBackendConfigured || !currentUser || currentUser.emailVerified) return null

  async function handleResend() {
    setSending(true)
    await sendVerificationEmail()
    setSending(false)
    setSent(true)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-border bg-accent-tint px-4 py-2 text-center text-[12.5px] text-accent-strong">
      <EnvelopeSimple size={15} className="shrink-0" />
      <span>Verify your email to secure your account.</span>
      <button
        type="button"
        onClick={handleResend}
        disabled={sending || sent}
        className="font-medium underline underline-offset-2 disabled:opacity-60 cursor-pointer"
      >
        {sent ? 'Email sent' : sending ? 'Sending…' : 'Resend email'}
      </button>
    </div>
  )
}
