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
