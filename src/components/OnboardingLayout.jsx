import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from '@phosphor-icons/react'
import Logo from './Logo'
import { useT, languages } from '../lib/i18n'
import { useStore } from '../lib/store'

export function InlineLanguagePicker() {
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      aria-label="Language"
      className="h-8 rounded-full border border-border-strong bg-bg-raised px-2 text-[12px] font-medium text-ink-muted outline-none transition-colors duration-200 hover:text-ink cursor-pointer"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.code.toUpperCase()}
        </option>
      ))}
    </select>
  )
}

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onSkip,
  skipLabel,
}) {
  const t = useT()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-16 items-center justify-between px-5">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label={t('Go back')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <ArrowLeft size={19} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Logo size={24} />
        </Link>
        <div className="flex items-center gap-2">
          <InlineLanguagePicker />
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              aria-label={skipLabel ?? t('Skip')}
              className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
            >
              {skipLabel ?? t('Skip')}
              <X size={16} weight="bold" />
            </button>
          )}
        </div>
      </header>

      {step && totalSteps && (
        <div className="mx-auto flex w-full max-w-sm gap-1.5 px-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < step ? 'bg-accent-strong' : 'bg-border'}`}
            />
          ))}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-8">
        {title && (
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        )}
        {subtitle && <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{subtitle}</p>}
        <div className="mt-7 flex-1">{children}</div>
      </main>
    </div>
  )
}
