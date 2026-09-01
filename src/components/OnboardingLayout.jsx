import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from '@phosphor-icons/react'
import Logo from './Logo'

export default function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onSkip,
  skipLabel = 'Skip',
}) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-16 items-center justify-between px-5">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="Go back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <ArrowLeft size={19} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <Logo size={24} />
        </Link>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            aria-label={skipLabel}
            className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
          >
            {skipLabel}
            <X size={16} weight="bold" />
          </button>
        ) : (
          <div className="w-9" />
        )}
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
