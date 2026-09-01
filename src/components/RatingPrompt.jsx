import { useState } from 'react'
import { Star } from '@phosphor-icons/react'
import Button from './Button'
import { useStore } from '../lib/store'

export default function RatingPrompt({ groupId, groupName }) {
  const rateGroup = useStore((s) => s.rateGroup)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-bg-raised p-5 text-center">
        <p className="text-[14px] font-medium text-ink">Thanks for rating your meetup.</p>
      </div>
    )
  }

  function handleSubmit() {
    if (!rating) return
    rateGroup(groupId, rating, comment.trim())
    setSubmitted(true)
  }

  return (
    <div className="rounded-2xl border border-accent-strong bg-accent-tint p-5">
      <p className="text-[14.5px] font-medium text-ink">How was {groupName}?</p>
      <p className="mt-1 text-[13px] text-ink-muted">Rate your experience at this meetup.</p>

      <div className="mt-4 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="cursor-pointer p-0.5"
          >
            <Star
              size={28}
              weight={n <= (hovered || rating) ? 'fill' : 'regular'}
              className={n <= (hovered || rating) ? 'text-coral' : 'text-ink-faint'}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Anything you'd like to share? (optional)"
        className="mt-4 w-full resize-none rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25"
      />

      <Button size="sm" className="mt-3" disabled={!rating} onClick={handleSubmit}>
        Submit rating
      </Button>
    </div>
  )
}
