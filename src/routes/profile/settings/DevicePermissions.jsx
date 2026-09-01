import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Camera, MapPinLine } from '@phosphor-icons/react'
import Switch from '../../../components/Switch'
import { useStore, DEFAULT_DEVICE_PERMISSIONS } from '../../../lib/store'

const ROWS = [
  { key: 'location', icon: MapPinLine, label: 'Location', hint: 'Needed to match you with nearby travelers' },
  { key: 'camera', icon: Camera, label: 'Camera', hint: 'Used for ID verification and the face scan' },
  { key: 'notifications', icon: Bell, label: 'Push notifications', hint: 'Alerts for matches, messages, and meetups' },
]

export default function DevicePermissions() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const setDevicePermission = useStore((s) => s.setDevicePermission)
  const perms = { ...DEFAULT_DEVICE_PERMISSIONS, ...currentUser.devicePermissions }

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

      <h1 className="mt-4 text-xl font-semibold text-ink">Device permissions</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        These mirror the permissions your phone or browser grants Natio. Turning one off here is a
        prototype toggle — on a real device you'd also need to update it in your system settings.
      </p>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-ink-muted">
                <row.icon size={18} />
              </span>
              <div>
                <p className="text-[14.5px] font-medium text-ink">{row.label}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">{row.hint}</p>
              </div>
            </div>
            <Switch
              checked={perms[row.key]}
              onChange={(v) => setDevicePermission(row.key, v)}
              label={row.label}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
