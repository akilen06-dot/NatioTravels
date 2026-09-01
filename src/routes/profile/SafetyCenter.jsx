import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldWarning, Trash, UserCircleMinus } from '@phosphor-icons/react'
import Button from '../../components/Button'
import PolicySection from '../../components/PolicySection'
import { policySections } from '../../lib/safetyPolicy'
import { useStore } from '../../lib/store'

export default function SafetyCenter() {
  const navigate = useNavigate()
  const deleteMyData = useStore((s) => s.deleteMyData)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        <ArrowLeft size={16} />
        Profile
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">Safety & privacy</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        How Natio keeps your location, payments, and meetups safe.
      </p>

      {policySections.map((section) => (
        <PolicySection key={section.title} {...section} />
      ))}

      <section className="mt-4 rounded-2xl border border-border bg-bg-raised p-5">
        <div className="flex items-center gap-2.5">
          <UserCircleMinus size={19} className="text-accent-strong" />
          <p className="text-[14.5px] font-medium text-ink">Blocked & reported users</p>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          You haven't blocked anyone yet. You can block or report someone from their profile or a
          conversation at any time.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-danger/30 bg-danger-tint p-5">
        <div className="flex items-center gap-2.5">
          <ShieldWarning size={19} className="text-danger" />
          <p className="text-[14.5px] font-medium text-ink">Delete my data</p>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          Permanently deletes your profile, verification photos, matches, and messages. This
          can't be undone.
        </p>

        {!confirming ? (
          <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirming(true)}>
            <Trash size={16} />
            Delete my data
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-danger/40 bg-bg-raised p-4">
            <p className="text-[13.5px] font-medium text-ink">
              Are you sure? This permanently deletes your account.
            </p>
            <div className="flex gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => deleteMyData()}>
                Yes, delete permanently
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
