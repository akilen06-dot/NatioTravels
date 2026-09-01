import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import HeroScrollVideoReveal from '../components/HeroScrollVideoReveal'

export default function Start() {
  const navigate = useNavigate()

  return (
    <div className="relative">
      <div className="fixed left-5 top-5 z-30">
        <Logo size={30} />
      </div>

      <div className="fixed right-5 top-5 z-30">
        <Button variant="invert" size="sm" onClick={() => navigate('/auth')}>
          Start
        </Button>
      </div>

      <HeroScrollVideoReveal
        bottomText={
          <div className="flex flex-col items-center gap-8">
            <span>Ready to meet your people?</span>
            <Button size="lg" className="min-w-[200px]" onClick={() => navigate('/auth')}>
              Start
            </Button>
          </div>
        }
      />
    </div>
  )
}
