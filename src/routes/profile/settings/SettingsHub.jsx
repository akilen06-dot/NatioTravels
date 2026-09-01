import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  DeviceMobile,
  Flag,
  Globe,
  LockKey,
  ShieldCheck,
  SignOut,
  Sparkle,
  Ticket,
  UserCircle,
} from '@phosphor-icons/react'
import SettingsRow from '../../../components/SettingsRow'
import { useStore } from '../../../lib/store'
import { useT } from '../../../lib/i18n'

function Section({ title, children }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="px-1 text-[12.5px] font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-4">
        {children}
      </div>
    </section>
  )
}

export default function SettingsHub() {
  const navigate = useNavigate()
  const signOut = useStore((s) => s.signOut)
  const t = useT()

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        <ArrowLeft size={16} />
        {t('Profile')}
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">{t('Settings')}</h1>

      <Section title={t('Account')}>
        <SettingsRow
          icon={UserCircle}
          label={t('Account')}
          hint="Password, ads, billing"
          onClick={() => navigate('/profile/settings/account')}
        />
      </Section>

      <Section title="Content & privacy">
        <SettingsRow
          icon={Sparkle}
          label={t('Archive')}
          hint="Pictures you've hidden from your profile"
          onClick={() => navigate('/profile/settings/archive')}
        />
        <SettingsRow
          icon={LockKey}
          label={t('Account privacy')}
          hint="Control who can view your profile"
          onClick={() => navigate('/profile/settings/privacy')}
        />
        <SettingsRow
          icon={Flag}
          label={t('Blocked & reported')}
          hint="People you've blocked or reported"
          onClick={() => navigate('/profile/settings/blocked')}
        />
      </Section>

      <Section title="Preferences">
        <SettingsRow
          icon={Bell}
          label={t('Notifications')}
          hint="Choose what Natio notifies you about"
          onClick={() => navigate('/profile/settings/notifications')}
        />
        <SettingsRow
          icon={DeviceMobile}
          label={t('Device permissions')}
          hint="Location, camera, and notifications"
          onClick={() => navigate('/profile/settings/devices')}
        />
        <SettingsRow
          icon={Globe}
          label={t('Language')}
          hint="Translate the app automatically"
          onClick={() => navigate('/profile/settings/language')}
        />
      </Section>

      <Section title={t('Plan')}>
        <SettingsRow
          icon={Ticket}
          label={t('Plan')}
          hint="View or change your plan"
          onClick={() => navigate('/onboarding/plan')}
        />
        <SettingsRow
          icon={ShieldCheck}
          label={t('Safety & privacy')}
          hint="How Natio keeps you safe"
          onClick={() => navigate('/profile/safety')}
        />
        <SettingsRow icon={SignOut} label={t('Sign out')} danger onClick={() => signOut()} />
      </Section>
    </div>
  )
}
