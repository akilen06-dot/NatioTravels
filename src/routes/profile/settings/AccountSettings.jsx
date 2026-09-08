import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CheckCircle } from '@phosphor-icons/react'
import Field from '../../../components/Field'
import { fieldClasses } from '../../../lib/fieldClasses'
import Button from '../../../components/Button'
import Switch from '../../../components/Switch'
import { useStore, DEFAULT_AD_PREFERENCES } from '../../../lib/store'
import { isBackendConfigured } from '../../../lib/supabaseClient'

const PLAN_LABEL = { trip: 'Trip Pass', subscription: 'Frequent Traveler' }

export default function AccountSettings() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const changePassword = useStore((s) => s.changePassword)
  const setAdPreference = useStore((s) => s.setAdPreference)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const adPrefs = { ...DEFAULT_AD_PREFERENCES, ...currentUser.adPreferences }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setSuccess('')
    const next = {}
    if (!currentPassword) next.currentPassword = 'Enter your current password.'
    if (newPassword.length < 8) next.newPassword = 'New password must be at least 8 characters.'
    if (newPassword !== confirmPassword) next.confirmPassword = "Passwords don't match."
    setErrors(next)
    if (Object.keys(next).length) return

    const result = await changePassword(currentPassword, newPassword)
    if (!result.ok) {
      setErrors({ currentPassword: result.error })
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess('Password updated.')
  }

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

      <h1 className="mt-4 text-xl font-semibold text-ink">Account</h1>

      <section className="mt-6 rounded-2xl border border-border bg-bg-raised p-5">
        <h2 className="text-[14.5px] font-medium text-ink">Account details</h2>
        <dl className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[13px] text-ink-muted">Name</dt>
            <dd className="truncate text-[13.5px] font-medium text-ink">{currentUser.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[13px] text-ink-muted">Username</dt>
            <dd className="truncate text-[13.5px] font-medium text-ink">@{currentUser.username}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[13px] text-ink-muted">Email</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-[13.5px] font-medium text-ink">
              <span className="truncate">{currentUser.email}</span>
              {isBackendConfigured &&
                (currentUser.emailVerified ? (
                  <CheckCircle size={14} weight="fill" className="shrink-0 text-success" />
                ) : (
                  <span className="shrink-0 text-[11px] font-normal text-ink-faint">(unverified)</span>
                ))}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-bg-raised p-5">
        <h2 className="text-[14.5px] font-medium text-ink">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
          <Field label="Current password" htmlFor="current-password" error={errors.currentPassword}>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={fieldClasses(!!errors.currentPassword)}
            />
          </Field>
          <Field label="New password" htmlFor="new-password" error={errors.newPassword}>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldClasses(!!errors.newPassword)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-password" error={errors.confirmPassword}>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClasses(!!errors.confirmPassword)}
            />
          </Field>
          {success && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-success">
              <Check size={15} weight="bold" />
              {success}
            </p>
          )}
          <Button type="submit" size="sm" className="w-fit">
            Update password
          </Button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-bg-raised p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[14.5px] font-medium text-ink">Personalized ads</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              Use your activity on Natio to show you more relevant ads. Turning this off shows
              generic ads instead.
            </p>
          </div>
          <Switch
            checked={adPrefs.personalized}
            onChange={(v) => setAdPreference('personalized', v)}
            label="Personalized ads"
          />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-bg-raised p-5">
        <h2 className="text-[14.5px] font-medium text-ink">Billing information</h2>
        {currentUser.plan ? (
          <>
            <p className="mt-2 text-[13.5px] text-ink-muted">
              {PLAN_LABEL[currentUser.plan]}
              {currentUser.plan === 'subscription'
                ? ` · billed ${currentUser.billing === 'annual' ? 'yearly' : 'monthly'}`
                : ''}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              Payment method on file. This is a prototype — no real card data is stored.
            </p>
          </>
        ) : (
          <p className="mt-2 text-[13.5px] text-ink-muted">
            No billing information on file. You're browsing without a plan.
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/onboarding/plan')}
        >
          {currentUser.plan ? 'Manage payment method' : 'Add a plan'}
        </Button>
      </section>
    </div>
  )
}
