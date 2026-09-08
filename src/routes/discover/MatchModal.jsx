import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { useStore } from '../../lib/store'

export default function MatchModal({ traveler, onClose }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const currentUser = useStore((s) => s.currentUser)

  return (
    <AnimatePresence>
      {traveler && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-bg-raised p-7 text-center"
          >
            <p className="text-[13px] font-medium uppercase tracking-wide text-accent-strong">
              It's a match
            </p>
            <div className="mt-4 flex items-center justify-center">
              <Avatar
                src={currentUser?.photo}
                className="h-20 w-20 -mr-4 rounded-full border-4 border-bg-raised object-cover"
              />
              <Avatar
                src={traveler.photo}
                className="h-20 w-20 rounded-full border-4 border-bg-raised object-cover"
              />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-ink">
              You and {traveler.name} matched
            </h2>
            <p className="mt-1.5 text-[14px] text-ink-muted">
              Say hello, they're {traveler.distanceKm} km away right now.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                className="w-full"
                onClick={() => {
                  onClose()
                  navigate(`/messages/match-${traveler.id}`)
                }}
              >
                Send a message
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Keep browsing
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
