import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react'
import { countryCodes } from '../lib/countryCodes'

export default function PhoneField({
  id,
  dialCode,
  onDialCodeChange,
  number,
  onNumberChange,
  error = false,
  placeholder = '555 010 2837',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  const selectedCountry = countryCodes.find((c) => c.dial === dialCode)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countryCodes
    return countryCodes.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q),
    )
  }, [query])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    function handlePointer(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex h-11 items-stretch overflow-hidden rounded-xl border bg-bg-raised transition-colors duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 ${
          error ? 'border-danger' : 'border-border-strong'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 text-[14.5px] text-ink transition-colors duration-200 hover:bg-bg-sunken cursor-pointer"
        >
          <span className="font-mono text-[13px] text-ink-muted">
            {selectedCountry?.iso2 ?? '--'}
          </span>
          {dialCode || '+--'}
          <CaretDown size={13} className="text-ink-faint" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(e) => onNumberChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink placeholder:text-ink-faint outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-2xl border border-border bg-bg-raised p-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.28)]">
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="h-9 w-full rounded-lg border border-border bg-bg-sunken pl-8 pr-3 text-[13.5px] text-ink placeholder:text-ink-faint outline-none focus:border-accent"
            />
          </div>
          <ul role="listbox" className="mt-2 max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-[13px] text-ink-muted">No matches</li>
            )}
            {filtered.map((c) => (
              <li key={c.iso2}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.dial === dialCode}
                  onClick={() => {
                    onDialCodeChange(c.dial)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors duration-200 cursor-pointer hover:bg-bg-sunken ${
                    c.dial === dialCode ? 'text-accent-strong font-medium' : 'text-ink'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-[12.5px] text-ink-muted">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
