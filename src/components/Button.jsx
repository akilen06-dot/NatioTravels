import { forwardRef } from 'react'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

const variants = {
  primary:
    'bg-accent-strong text-white hover:bg-accent-strong/90 active:scale-[0.98]',
  secondary:
    'bg-bg-raised text-ink border border-border hover:border-border-strong active:scale-[0.98]',
  ghost: 'text-ink-muted hover:text-ink hover:bg-bg-sunken active:scale-[0.98]',
  danger: 'bg-danger text-white hover:bg-danger/90 active:scale-[0.98]',
  invert: 'bg-white text-accent-strong hover:bg-white/90 active:scale-[0.98]',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-7 text-base',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
