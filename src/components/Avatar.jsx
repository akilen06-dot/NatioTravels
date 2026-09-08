import { UserCircle } from '@phosphor-icons/react'

// A person's photo, or a plain placeholder if they don't have one. Real
// users are never assigned a random stock photo at signup — no photo
// uploaded means no photo shown, not a fake one.
// `className` should carry sizing/shape (h-*, w-*, rounded-full, etc.) —
// it's applied to whichever of the two (real image or placeholder) renders.
export default function Avatar({ src, alt = '', className = '', draggable }) {
  if (!src) {
    return (
      <span className={`inline-flex items-center justify-center bg-bg-sunken text-ink-faint ${className}`}>
        <UserCircle weight="fill" className="h-[65%] w-[65%]" />
      </span>
    )
  }
  return <img src={src} alt={alt} className={className} draggable={draggable} />
}
