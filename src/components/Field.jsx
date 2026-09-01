export default function Field({ label, htmlFor, error, helper, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-[13.5px] font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : helper ? (
        <p className="text-[13px] text-ink-muted">{helper}</p>
      ) : null}
    </div>
  )
}
