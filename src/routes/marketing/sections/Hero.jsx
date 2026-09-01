import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { ShieldCheck, UsersThree } from '@phosphor-icons/react'
import Button from '../../../components/Button'

const GROUP_PHOTO =
  'https://images.unsplash.com/photo-1758272133483-281d50324455?w=900&h=675&fit=crop&q=80'

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pt-16 pb-20 md:grid-cols-2 md:pt-24 md:pb-28">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-6xl">
          Find people from home, anywhere you travel.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted md:text-lg">
          Verified travelers of your nationality, nearby right now. Match
          one-on-one or join a group meetup, safely.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/start">
            <Button size="lg">Get started</Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto aspect-[4/3] w-full max-w-[480px] overflow-hidden rounded-3xl border border-border bg-bg-raised shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <img
          src={GROUP_PHOTO}
          alt="A group of friends toasting drinks together outdoors"
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-5 pt-16 text-white">
          <div className="flex items-center gap-2 text-lg font-semibold">
            Real meetups, real people
            <ShieldCheck size={18} weight="fill" className="text-accent" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/85">
            <UsersThree size={14} />
            Verified travelers, wherever you land
          </div>
        </div>
      </motion.div>
    </section>
  )
}
