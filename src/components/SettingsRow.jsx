import { CaretRight } from '@phosphor-icons/react'

export default function SettingsRow({ icon: Icon, label, hint, onClick, danger = false, trailing }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 px-1 py-3.5 text-left transition-colors duration-200 hover:bg-bg-sunken -mx-1 rounded-xl cursor-pointer"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          danger ? 'bg-danger-tint text-danger' : 'bg-bg-sunken text-ink-muted'
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14.5px] font-medium ${danger ? 'text-danger' : 'text-ink'}`}>
          {label}
        </span>
        {hint && <span className="block text-[12.5px] text-ink-muted">{hint}</span>}
      </span>
      {trailing ?? (!danger && <CaretRight size={15} className="shrink-0 text-ink-faint" />)}
    </button>
  )
}
