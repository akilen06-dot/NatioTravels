import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { MapPinLine, ShieldCheck, X, Heart } from '@phosphor-icons/react'

const SwipeCard = forwardRef(function SwipeCard({ traveler, active, onSwiped }, ref) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const likeOpacity = useTransform(x, [20, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, -20], [1, 0])
  const [exiting, setExiting] = useState(null)

  const trigger = useCallback(
    (dir) => {
      if (exiting) return
      setExiting(dir)
    },
    [exiting],
  )

  useImperativeHandle(ref, () => ({ trigger }), [trigger])

  return (
    <motion.div
      style={{ x, rotate }}
      drag={!exiting && active ? 'x' : false}
      dragElastic={0.7}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) trigger('like')
        else if (info.offset.x < -110) trigger('pass')
      }}
      animate={exiting ? { x: exiting === 'like' ? 700 : -700, opacity: 0 } : { x: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (exiting) onSwiped(exiting)
      }}
      className={`absolute inset-0 overflow-hidden rounded-3xl border border-border bg-bg-raised shadow-[0_18px_50px_-12px_rgba(0,0,0,0.28)] ${active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
    >
      <img src={traveler.photo} alt="" className="h-full w-full object-cover" draggable={false} />

      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute left-5 top-6 rounded-lg border-2 border-success px-3 py-1 text-lg font-bold uppercase tracking-wide text-success"
      >
        Like
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute right-5 top-6 rounded-lg border-2 border-danger px-3 py-1 text-lg font-bold uppercase tracking-wide text-danger"
      >
        Pass
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-16 text-white">
        <div className="flex items-center gap-2 text-xl font-semibold">
          {traveler.name}, {traveler.age}
          <ShieldCheck size={19} weight="fill" className="text-accent" />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/85">
          <MapPinLine size={14} />
          {traveler.distanceKm} km away · {traveler.country}
        </div>
        <p className="mt-2 text-[13.5px] text-white/90">{traveler.bio}</p>
      </div>
    </motion.div>
  )
})

export default SwipeCard

export function SwipeButton({ variant, onClick, ...props }) {
  const isLike = variant === 'like'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLike ? 'Like' : 'Pass'}
      className={`inline-flex h-14 w-14 items-center justify-center rounded-full border cursor-pointer transition-colors duration-200 ${
        isLike
          ? 'border-success/40 text-success hover:bg-success/10'
          : 'border-danger/40 text-danger hover:bg-danger/10'
      } bg-bg-raised shadow-sm`}
      {...props}
    >
      {isLike ? <Heart size={24} weight="fill" /> : <X size={24} weight="bold" />}
    </button>
  )
}
