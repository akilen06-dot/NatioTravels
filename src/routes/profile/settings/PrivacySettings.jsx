import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKey } from '@phosphor-icons/react'
import Switch from '../../../components/Switch'
import { useStore } from '../../../lib/store'

export default function PrivacySettings() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const setAccountPrivacy = useStore((s) => s.setAccountPrivacy)

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile/settings')}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        <ArrowLeft size={16} />
        Settings
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">Account privacy</h1>

      <div className="mt-6 rounded-2xl border border-border bg-bg-raised p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-ink-muted">
              <LockKey size={18} />
            </span>
            <div>
              <p className="text-[14.5px] font-medium text-ink">Private account</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                When your account is private, other travelers can't view your profile, posts, or
                trip details unless you've already matched with them. Your profile still appears
                in Discover and Search.
              </p>
            </div>
          </div>
          <Switch
            checked={!!currentUser.private}
            onChange={(v) => setAccountPrivacy(v)}
            label="Private account"
          />
        </div>
      </div>

      {currentUser.private && (
        <p className="mt-3 px-1 text-[12.5px] text-ink-muted">
          Your account is currently private. People you haven't matched with will see a locked
          profile.
        </p>
      )}
    </div>
  )
}
