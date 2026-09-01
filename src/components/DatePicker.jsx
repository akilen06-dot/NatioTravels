import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isValid, parseISO } from 'date-fns'
import { CalendarBlank } from '@phosphor-icons/react'

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select a date',
  error = false,
  disabledMatcher,
  captionLayout = 'label',
  fromYear,
  toYear,
  defaultMonth,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  useEffect(() => {
    if (!open) return
    function handlePointer(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleSelect(date) {
    if (!date) return
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-bg-raised px-3.5 text-left text-[15px] outline-none transition-colors duration-200 cursor-pointer focus:border-accent focus:ring-2 focus:ring-accent/25 ${
          error ? 'border-danger' : 'border-border-strong'
        } ${selectedDate ? 'text-ink' : 'text-ink-faint'}`}
      >
        {selectedDate ? format(selectedDate, 'd MMM yyyy') : placeholder}
        <CalendarBlank size={18} className="shrink-0 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-border bg-bg-raised p-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.28)]">
          <DayPicker
            mode="single"
            autoFocus
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? defaultMonth}
            captionLayout={captionLayout}
            startMonth={fromYear ? new Date(fromYear, 0) : undefined}
            endMonth={toYear ? new Date(toYear, 11) : undefined}
            disabled={disabledMatcher}
            className="natio-calendar"
          />
        </div>
      )}
    </div>
  )
}
