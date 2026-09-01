const inputBase =
  'h-11 w-full rounded-xl border bg-bg-raised text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25'

export function fieldClasses(hasError, { icon = false } = {}) {
  return `${inputBase} ${icon ? 'pl-10 pr-3.5' : 'px-3.5'} ${hasError ? 'border-danger' : 'border-border-strong'}`
}
