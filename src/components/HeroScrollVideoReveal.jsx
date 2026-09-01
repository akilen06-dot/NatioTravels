import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Compass, Play } from '@phosphor-icons/react'

gsap.registerPlugin(ScrollTrigger, SplitText)

const DEFAULT_TAGS = [
  { text: 'ID + face verified', background: '#1D3FC4', color: '#ffffff' },
  { text: 'Solo or group meetups', background: '#3B5FE0', color: '#ffffff' },
  { text: 'Location stays private', background: '#182A4F', color: '#ffffff' },
  { text: 'From $9.99 a trip', background: '#7092F5', color: '#0a0e1a' },
]

export default function HeroScrollVideoReveal({
  topText = (
    <>
      Every trip is better with someone
      <br />
      who already gets it
    </>
  ),
  headingText = (
    <>
      Strangers in a new city. <br />
      Not strangers to each other.
    </>
  ),
  tags = DEFAULT_TAGS,
  subText = 'And it gets a little less lonely from here.',
  videoSrc = 'https://res.cloudinary.com/dsuwzuaxp/video/upload/856381-hd_1920_1080_30fps_gsq11b.mp4',
  bottomText,
  className = '',
}) {
  const benefitRef = useRef(null)
  const videoWrapperRef = useRef(null)
  const videoBoxRef = useRef(null)
  const videoRef = useRef(null)
  const paraRef = useRef(null)
  const tagRefs = useRef([])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
      videoRef.current.play().catch(() => {})
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let lenis = null
    let lenisTicker = null
    if (!reduceMotion) {
      import('lenis')
        .then(({ default: Lenis }) => {
          lenis = new Lenis({ smoothWheel: true })
          lenis.on('scroll', ScrollTrigger.update)
          lenisTicker = (time) => lenis.raf(time * 1000)
          gsap.ticker.add(lenisTicker)
          gsap.ticker.lagSmoothing(0)
        })
        .catch(() => {})
    }

    let split = null
    let words = []
    try {
      split = new SplitText(paraRef.current, {
        type: 'words',
        wordsClass: 'reveal-word inline-block origin-left mr-[0.25em] will-change-transform',
      })
      words = split.words
    } catch {
      if (paraRef.current) words = Array.from(paraRef.current.querySelectorAll('.reveal-word'))
    }

    if (reduceMotion) {
      // Skip the scroll-driven reveal entirely: show everything in place.
      if (words.length) gsap.set(words, { opacity: 1, rotate: 0, yPercent: 0 })
      tagRefs.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' })
      })
      if (videoBoxRef.current) gsap.set(videoBoxRef.current, { clipPath: 'circle(150% at 50% 50%)' })
      return () => {
        if (split && split.revert) split.revert()
      }
    }

    if (words.length) gsap.set(words, { opacity: 0, rotate: 8, yPercent: 30 })

    const revealTl = gsap.timeline({
      scrollTrigger: {
        trigger: benefitRef.current,
        start: 'top 70%',
        end: 'top -10%',
        scrub: 1.5,
      },
    })

    if (words.length) {
      revealTl.to(words, {
        stagger: 0.2,
        opacity: 1,
        rotate: 0,
        yPercent: 0,
        ease: 'power1.inOut',
      })
    }

    tagRefs.current.forEach((tagEl) => {
      if (!tagEl) return
      revealTl.to(
        tagEl,
        {
          duration: 1,
          opacity: 1,
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          ease: 'circ.out',
        },
        '>-0.4',
      )
    })

    const mm = gsap.matchMedia()
    const pinConfig = (endDistance, startClip) => () => {
      gsap.set(videoBoxRef.current, { clipPath: startClip })
      const vpTl = gsap.timeline({
        scrollTrigger: {
          trigger: videoWrapperRef.current,
          start: 'top top',
          end: `+=${endDistance}`,
          scrub: 1.3,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          onRefresh: (self) => {
            if (self.spacer) self.spacer.style.backgroundColor = '#0d0f0d'
            if (self.pin) self.pin.style.backgroundColor = '#0d0f0d'
          },
          onToggle: (self) => {
            if (self.spacer) self.spacer.style.backgroundColor = '#0d0f0d'
            if (self.pin) self.pin.style.backgroundColor = '#0d0f0d'
          },
        },
      })
      vpTl.fromTo(
        videoBoxRef.current,
        { clipPath: startClip },
        { clipPath: 'circle(150% at 50% 50%)', ease: 'none' },
      )
    }

    mm.add('(max-width: 639.9px)', pinConfig(1500, 'circle(18% at 50% 50%)'))
    mm.add('(min-width: 640px) and (max-width: 1023.9px)', pinConfig(2000, 'circle(12% at 50% 50%)'))
    mm.add('(min-width: 1024px)', pinConfig(2500, 'circle(8% at 50% 50%)'))

    return () => {
      if (split && split.revert) split.revert()
      revealTl.scrollTrigger?.kill()
      revealTl.kill()
      mm.revert()
      if (lenis && lenisTicker) {
        gsap.ticker.remove(lenisTicker)
        lenis.destroy()
      }
    }
  }, [])

  return (
    <div
      className={`w-full min-h-screen bg-[#0d0f0d] text-[#f3f4f6] font-sans overflow-x-hidden ${className}`}
      style={{ backgroundColor: '#0d0f0d', color: '#f3f4f6' }}
    >
      <style>{`
        .pin-spacer { background-color: #0d0f0d !important; }
      `}</style>

      <section
        className="w-full min-h-screen flex justify-center items-center text-center px-4 sm:px-8 py-8 text-[clamp(1.8rem,4.5vw,4.5rem)] font-bold tracking-tight leading-tight text-white relative z-10 bg-[#0d0f0d]"
        style={{ backgroundColor: '#0d0f0d' }}
      >
        {topText}
      </section>

      <section
        ref={benefitRef}
        className="relative w-full min-h-[140vh] md:min-h-[160vh] pb-16 md:pb-20 bg-[#0d0f0d]"
        style={{ backgroundColor: '#0d0f0d' }}
      >
        <div
          className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col items-center text-center relative z-10 bg-[#0d0f0d]"
          style={{ backgroundColor: '#0d0f0d' }}
        >
          <div className="w-full mb-8 sm:mb-12 md:mb-14">
            <p
              ref={paraRef}
              className="text-[clamp(2rem,5vw,5rem)] font-extrabold tracking-tight leading-tight text-white overflow-visible"
            >
              {headingText}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 max-w-4xl mx-auto my-4 sm:my-6 mb-8 sm:mb-14">
            {tags.map((tag, idx) => (
              <div
                key={tag.id || `tag-${idx}`}
                ref={(el) => {
                  tagRefs.current[idx] = el
                }}
                className="px-5 sm:px-8 py-2.5 sm:py-4 rounded-full text-[clamp(0.95rem,2vw,1.8rem)] font-semibold tracking-tight opacity-0 shadow-2xl will-change-[clip-path,opacity]"
                style={{
                  backgroundColor: tag.background,
                  color: tag.color || '#ffffff',
                  clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
                }}
              >
                {tag.text}
              </div>
            ))}
          </div>

          {subText && (
            <p className="text-[clamp(0.95rem,1.5vw,1.35rem)] text-zinc-400 font-normal max-w-xl mt-2 sm:mt-4 px-4">
              {subText}
            </p>
          )}
        </div>

        <div className="relative w-full bg-[#0d0f0d]" style={{ backgroundColor: '#0d0f0d' }}>
          <div
            ref={videoWrapperRef}
            className="w-full h-screen flex justify-center items-center relative overflow-hidden bg-[#0d0f0d]"
            style={{ backgroundColor: '#0d0f0d' }}
          >
            <div
              className="absolute inset-0 w-full h-full pointer-events-none bg-[#0d0f0d]"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#0d0f0d', zIndex: 1 }}
            />

            <div
              ref={videoBoxRef}
              className="relative w-full h-full overflow-hidden flex justify-center items-center bg-[#0d0f0d] will-change-[clip-path]"
              style={{ backgroundColor: '#0d0f0d', zIndex: 2 }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 z-20 pointer-events-none animate-[spin_18s_linear_infinite] opacity-90 select-none">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <defs>
                    <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                  </defs>
                  <text fill="#ffffff" fontSize="8.2" letterSpacing="3" fontWeight="600">
                    <textPath href="#badge-circle" startOffset="0%">
                      NATIO · TRAVEL WITH PEOPLE · NATIO · TRAVEL WITH PEOPLE ·
                    </textPath>
                  </text>
                </svg>
                <Compass
                  size={28}
                  weight="light"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                />
              </div>

              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                crossOrigin="anonymous"
                className="w-full h-full object-cover bg-[#0d0f0d]"
                style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0d0f0d' }}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex justify-center items-center shadow-xl">
                  <Play size={22} weight="fill" className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full min-h-screen flex justify-center items-center text-center px-4 sm:px-8 py-8 text-[clamp(1.8rem,4.5vw,4.5rem)] font-bold tracking-tight leading-tight text-white relative z-10 bg-[#0d0f0d]"
        style={{ backgroundColor: '#0d0f0d' }}
      >
        {bottomText}
      </section>
    </div>
  )
}
