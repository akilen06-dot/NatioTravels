import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { CheckCircle, UserCircle, WarningCircle } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Button from '../../components/Button'
import CameraCapture from '../../components/CameraCapture'
import { useStore } from '../../lib/store'
import { loadFaceModels, getFaceDescriptor, dataUrlToImage, matchesFace } from '../../lib/faceApi'

const HOLD_STILL_MS = 2000

export default function FaceScan() {
  const navigate = useNavigate()
  const draft = useStore((s) => s.draft)
  const setDraftField = useStore((s) => s.setDraftField)
  // idle -> loading-models -> ready -> camera -> analyzing -> verified | no-face | mismatch | id-no-face | no-camera
  const [phase, setPhase] = useState('loading-models')
  const [error, setError] = useState('')
  const cameraRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    loadFaceModels()
      .then(() => !cancelled && setPhase('ready'))
      .catch(() => !cancelled && setError('Could not load face verification. Check your connection and try again.'))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'camera') return
    const t = setTimeout(runScan, HOLD_STILL_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function runScan() {
    setPhase('analyzing')
    try {
      const video = cameraRef.current?.getVideoElement()
      const liveDescriptor = video ? await getFaceDescriptor(video) : null
      if (!liveDescriptor) {
        setPhase('no-face')
        return
      }

      const idImage = await dataUrlToImage(draft.idPhoto)
      const idDescriptor = await getFaceDescriptor(idImage)
      if (!idDescriptor) {
        setPhase('id-no-face')
        return
      }

      const { match } = matchesFace(liveDescriptor, idDescriptor)
      setPhase(match ? 'verified' : 'mismatch')
    } catch {
      setPhase('no-face')
    }
  }

  function handleContinue() {
    setDraftField('faceVerified', true)
    navigate('/onboarding/photo')
  }

  const scanning = phase === 'camera' || phase === 'analyzing'
  const retryable = phase === 'no-face' || phase === 'mismatch'

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title="Face scan"
      subtitle="A live camera check confirms the person in front of the camera matches your ID photo."
    >
      <div className="flex flex-col items-center">
        <div className="relative flex h-52 w-52 items-center justify-center">
          {phase === 'camera' && !reduce && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent, var(--color-accent) 60deg, transparent 120deg)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div
            className={`absolute inset-[6px] flex items-center justify-center overflow-hidden rounded-full border-2 bg-bg-sunken ${
              phase === 'verified'
                ? 'border-success'
                : phase === 'mismatch' || phase === 'no-face' || phase === 'no-camera' || phase === 'id-no-face'
                  ? 'border-danger'
                  : 'border-border-strong'
            }`}
          >
            {scanning ? (
              <CameraCapture
                ref={cameraRef}
                className="h-full w-full object-cover"
                onError={(err) => {
                  setError(err.message || 'Could not access your camera.')
                  setPhase('no-camera')
                }}
              />
            ) : phase === 'verified' ? (
              <CheckCircle size={56} weight="fill" className="text-success" />
            ) : phase === 'mismatch' || phase === 'no-face' || phase === 'no-camera' || phase === 'id-no-face' ? (
              <WarningCircle size={56} className="text-danger" />
            ) : (
              <UserCircle size={64} className="text-ink-faint" />
            )}
          </div>
        </div>

        <p className="mt-6 text-[15px] font-medium text-ink">
          {phase === 'loading-models' && 'Preparing face verification…'}
          {phase === 'ready' && 'Center your face in the frame'}
          {phase === 'camera' && 'Hold still…'}
          {phase === 'analyzing' && 'Checking…'}
          {phase === 'verified' && 'Face verified'}
          {phase === 'no-face' && "Couldn't see your face clearly"}
          {phase === 'mismatch' && "Doesn't match your ID photo"}
          {phase === 'id-no-face' && "Couldn't read your ID photo"}
          {phase === 'no-camera' && 'Camera access needed'}
        </p>
        <p className="mt-1 max-w-[260px] text-center text-[13px] text-ink-muted">
          {phase === 'verified' && 'This matches your ID photo.'}
          {phase === 'no-face' && 'Make sure your face is well lit and centered, then try again.'}
          {phase === 'mismatch' && "The live scan doesn't look like the photo you captured. Try again, or go back and retake your ID photo."}
          {phase === 'id-no-face' && 'We could not detect a face in your ID photo. Go back and retake it.'}
          {phase === 'no-camera' && (error || 'Allow camera access in your browser to continue.')}
          {(phase === 'ready' || phase === 'loading-models') && 'Good lighting helps the scan complete faster.'}
        </p>

        <div className="mt-8 w-full">
          {phase === 'loading-models' && (
            <Button size="lg" className="w-full" disabled>
              Preparing…
            </Button>
          )}
          {phase === 'ready' && (
            <Button size="lg" className="w-full" onClick={() => setPhase('camera')}>
              Start face scan
            </Button>
          )}
          {scanning && (
            <Button size="lg" className="w-full" disabled>
              {phase === 'camera' ? 'Scanning…' : 'Checking…'}
            </Button>
          )}
          {phase === 'verified' && (
            <Button size="lg" className="w-full" onClick={handleContinue}>
              Continue
            </Button>
          )}
          {retryable && (
            <Button size="lg" className="w-full" onClick={() => setPhase('camera')}>
              Try again
            </Button>
          )}
          {phase === 'no-camera' && (
            <Button size="lg" className="w-full" onClick={() => setPhase('camera')}>
              Try again
            </Button>
          )}
          {phase === 'id-no-face' && (
            <Button size="lg" variant="secondary" className="w-full" onClick={() => navigate(-1)}>
              Go back
            </Button>
          )}
        </div>
      </div>
    </OnboardingLayout>
  )
}
