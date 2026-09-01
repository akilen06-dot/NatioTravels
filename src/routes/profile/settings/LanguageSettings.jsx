import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from '@phosphor-icons/react'
import { useStore } from '../../../lib/store'
import { languages, useT } from '../../../lib/i18n'

export default function LanguageSettings() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const setLanguage = useStore((s) => s.setLanguage)
  const t = useT()
  const current = currentUser.language || 'en'

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile/settings')}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        <ArrowLeft size={16} />
        {t('Settings')}
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">{t('Language')}</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        Natio automatically translates the app into your chosen language. This prototype
        translates navigation and settings as a demo — full app-wide coverage would follow in a
        real build.
      </p>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-bg-raised px-5">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className="flex w-full items-center justify-between py-3.5 text-left cursor-pointer"
          >
            <span className="text-[14.5px] text-ink">{lang.name}</span>
            {current === lang.code && <Check size={18} weight="bold" className="text-accent-strong" />}
          </button>
        ))}
      </div>
    </div>
  )
}
