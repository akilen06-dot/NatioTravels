import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import Stats from './sections/Stats'
import HowItWorks from './sections/HowItWorks'
import Safety from './sections/Safety'
import Pricing from './sections/Pricing'
import Testimonial from './sections/Testimonial'
import FinalCta from './sections/FinalCta'
import Footer from './sections/Footer'

export default function Landing() {
  const { hash } = useLocation()

  // Nav/Footer links to #how-it-works etc. land here as a fresh page load
  // (from /terms, /about, ...). The browser's native "scroll to #hash on
  // load" fires before React has painted the target section, so it silently
  // finds nothing — this re-does that scroll once the section actually
  // exists in the DOM.
  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <div>
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Safety />
      <Pricing />
      <Testimonial />
      <FinalCta />
      <Footer />
    </div>
  )
}
