import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, ShieldSlash, UserCircleMinus } from '@phosphor-icons/react'
import Button from '../../../components/Button'
import { useStore, findPersonById } from '../../../lib/store'

const REASON_LABEL = {
  spam: 'Spam',
  harassment: 'Harassment or abuse',
  fake: 'Fake profile',
  inappropriate: 'Inappropriate content',
  other: 'Other',
}

function BlockedRow({ id }) {
  const person = useStore((s) => findPersonById(s, id))
  const unblockUser = useStore((s) => s.unblockUser)
  if (!person) return null
  return (
    <div className="flex items-center gap-3 py-3.5">
      <img src={person.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-ink">{person.name}</p>
        <p className="truncate text-[13px] text-ink-muted">{person.country}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => unblockUser(id)}>
        Unblock
      </Button>
    </div>
  )
}

function ReportedRow({ report }) {
  const person = useStore((s) => findPersonById(s, report.targetId))
  if (!person) return null
  return (
    <div className="flex items-center gap-3 py-3.5">
      <img src={person.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-ink">{person.name}</p>
        <p className="truncate text-[13px] text-ink-muted">
          {REASON_LABEL[report.reason] || report.reason} ·{' '}
          {new Date(report.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

export default function BlockedReported() {
  const navigate = useNavigate()
  const blockedIds = useStore((s) => s.blockedIds)
  const reports = useStore((s) => s.reports)

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

      <h1 className="mt-4 text-xl font-semibold text-ink">Blocked & reported</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        Block or report anyone from the flag icon on their profile.
      </p>

      <section className="mt-6">
        <h2 className="text-[13px] font-medium text-ink-muted">Blocked</h2>
        {blockedIds.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-10 text-center">
            <UserCircleMinus size={26} className="text-ink-faint" />
            <p className="mt-2 text-[13.5px] text-ink-muted">You haven't blocked anyone.</p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-4">
            {blockedIds.map((id) => (
              <BlockedRow key={id} id={id} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-[13px] font-medium text-ink-muted">Reported</h2>
        {reports.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border-strong py-10 text-center">
            <Flag size={26} className="text-ink-faint" />
            <p className="mt-2 text-[13.5px] text-ink-muted">You haven't reported anyone.</p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-4">
            {reports.map((r) => (
              <ReportedRow key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 flex items-center gap-1.5 text-[12.5px] text-ink-faint">
        <ShieldSlash size={14} />
        Blocked people can't message you or see your profile in Discover or Search.
      </p>
    </div>
  )
}
