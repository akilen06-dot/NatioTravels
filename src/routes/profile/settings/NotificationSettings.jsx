import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import Switch from '../../../components/Switch'
import { useStore, DEFAULT_NOTIFICATION_PREFS } from '../../../lib/store'

const ROWS = [
  { key: 'matches', label: 'New matches', hint: 'When someone you liked matches back' },
  { key: 'messages', label: 'Messages', hint: 'New messages from matches and groups' },
  { key: 'groupActivity', label: 'Group activity', hint: 'Join requests, approvals, and updates' },
  { key: 'meetupReminders', label: 'Meetup reminders', hint: 'Reminders before a group meetup starts' },
  { key: 'marketing', label: 'Marketing & promotions', hint: 'Product news, offers, and tips' },
]

export default function NotificationSettings() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const setNotificationPref = useStore((s) => s.setNotificationPref)
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...currentUser.notificationPrefs }

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

      <h1 className="mt-4 text-xl font-semibold text-ink">Notifications</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        Choose what Natio can notify you about.
      </p>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-[14.5px] font-medium text-ink">{row.label}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">{row.hint}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              onChange={(v) => setNotificationPref(row.key, v)}
              label={row.label}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
