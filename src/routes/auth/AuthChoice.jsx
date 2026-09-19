import { useNavigate } from 'react-router-dom'
import { UserPlus, SignIn as SignInIcon } from '@phosphor-icons/react'
import Logo from '../../components/Logo'
import { InlineLanguagePicker } from '../../components/OnboardingLayout'
import { useT } from '../../lib/i18n'

export default function AuthChoice() {
  const t = useT()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="fixed right-5 top-5">
        <InlineLanguagePicker />
      </div>
      <Logo size={40} />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">{t('Welcome to Natio')}</h1>
      <p className="mt-1.5 text-[14.5px] text-ink-muted">{t("Let's get you set up.")}</p>

      <div className="mt-9 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="flex items-center gap-3.5 rounded-2xl border border-border-strong bg-bg-raised p-4 text-left transition-colors duration-200 hover:border-accent cursor-pointer"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-strong">
            <UserPlus size={20} />
          </span>
          <span>
            <span className="block text-[15px] font-medium text-ink">{t('Create an account')}</span>
            <span className="block text-[13.5px] text-ink-muted">{t('New to Natio')}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/signin')}
          className="flex items-center gap-3.5 rounded-2xl border border-border-strong bg-bg-raised p-4 text-left transition-colors duration-200 hover:border-accent cursor-pointer"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-ink-muted">
            <SignInIcon size={20} />
          </span>
          <span>
            <span className="block text-[15px] font-medium text-ink">{t('I already have an account')}</span>
            <span className="block text-[13.5px] text-ink-muted">{t('Sign in')}</span>
          </span>
        </button>
      </div>
    </div>
  )
}
