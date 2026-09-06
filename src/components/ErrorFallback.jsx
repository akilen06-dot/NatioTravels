export default function ErrorFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <p className="text-[17px] font-semibold text-ink">Something went wrong</p>
      <p className="max-w-sm text-[14px] leading-relaxed text-ink-muted">
        This screen ran into an unexpected error. Reloading usually fixes it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-accent-strong px-5 py-2.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-accent-strong/90 cursor-pointer"
      >
        Reload
      </button>
    </div>
  )
}
