import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '../lib/useTheme'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors duration-200 hover:text-ink hover:border-border-strong cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {isDark ? <Sun size={17} weight="regular" /> : <Moon size={17} weight="regular" />}
    </button>
  )
}
