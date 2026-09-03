import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle, IdentificationCard, UploadSimple } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/Button'
import CameraCapture from '../../components/CameraCapture'
import { useStore } from '../../lib/store'
import { readAndResizeImage } from '../../lib/imageFile'

const currentYear = new Date().getFullYear()

function ageFromDob(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function IdentityVerification() {
  const navigate = useNavigate()
  const draft = useStore((s) => s.draft)
  const setDraftField = useStore((s) => s.setDraftField)
  const [dob, setDob] = useState('')
  const [touchedDob, setTouchedDob] = useState(false)
  const [mode, setMode] = useState('idle') // idle | camera | uploading
  const [cameraError, setCameraError] = useState('')
  const fileInputRef = useRef(null)
  const cameraRef = useRef(null)

  const age = useMemo(() => ageFromDob(dob), [dob])
  const underage = touchedDob && dob && age !== null && age < 18
  const dobValid = dob && age !== null && age >= 18
  const captured = !!draft.idPhoto

  function handleContinue() {
    if (!dobValid || !captured) return
    setDraftField('dob', dob)
    setDraftField('idCaptured', true)
    navigate('/onboarding/photo')
  }

  function handleCapture() {
    const dataUrl = cameraRef.current?.captureFrame()
    if (!dataUrl) return
    setDraftField('idPhoto', dataUrl)
    setMode('idle')
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMode('uploading')
    try {
      const dataUrl = await readAndResizeImage(file, { maxDim: 900, quality: 0.85 })
      setDraftField('idPhoto', dataUrl)
    } catch (err) {
      setCameraError(err.message || "Couldn't use that photo. Try another one.")
    } finally {
      setMode('idle')
    }
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={4}
      title="Verify your identity"
      subtitle="A passport or ID photo confirms you're a real, matching traveler before you can message anyone."
    >
      <div className="flex flex-col gap-6">
        <Field
          label="Date of birth"
          htmlFor="dob"
          error={underage ? 'You must be 18 or older to use Natio.' : undefined}
        >
          <DatePicker
            id="dob"
            value={dob}
            onChange={(next) => {
              setDob(next)
              setTouchedDob(true)
            }}
            placeholder="Select your date of birth"
            error={underage}
            captionLayout="dropdown"
            fromYear={currentYear - 100}
            toYear={currentYear}
            defaultMonth={new Date(currentYear - 25, 0)}
            disabledMatcher={{ after: new Date() }}
          />
        </Field>

        <div>
          <p className="text-[13.5px] font-medium text-ink">Passport or ID photo</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {mode === 'camera' ? (
            <div className="mt-2 flex flex-col items-center gap-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-bg-sunken">
                <CameraCapture
                  ref={cameraRef}
                  className="h-full w-full object-cover"
                  onError={(err) => {
                    setCameraError(err.message || 'Could not access your camera.')
                    setMode('idle')
                  }}
                />
                <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70" />
              </div>
              <div className="flex w-full gap-2.5">
                <Button variant="ghost" onClick={() => setMode('idle')} className="w-full">
                  Cancel
                </Button>
                <Button onClick={handleCapture} className="w-full">
                  <Camera size={18} />
                  Capture
                </Button>
              </div>
            </div>
          ) : !captured ? (
            <div className="mt-2 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-bg-sunken p-8 text-center">
              <IdentificationCard size={36} className="text-ink-faint" />
              <p className="max-w-[220px] text-[13px] text-ink-muted">
                Frame your passport photo page or government ID inside the card.
              </p>
              {cameraError && <p className="text-[12.5px] text-danger">{cameraError}</p>}
              <div className="flex w-full flex-col gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCameraError('')
                    setMode('camera')
                  }}
                  className="w-full"
                >
                  <Camera size={18} />
                  Take photo
                </Button>
                <Button
                  variant="ghost"
                  disabled={mode === 'uploading'}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <UploadSimple size={17} />
                  {mode === 'uploading' ? 'Uploading…' : 'Upload from gallery'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-bg-sunken p-4">
              <img src={draft.idPhoto} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[14px] font-medium text-ink">
                  <CheckCircle size={16} weight="fill" className="shrink-0 text-success" />
                  Photo captured
                </p>
                <p className="text-[12.5px] text-ink-muted">
                  We'll use this to confirm you're a real traveler.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftField('idPhoto', '')}
                className="shrink-0 text-[13px] font-medium text-accent-strong cursor-pointer"
              >
                Retake
              </button>
            </div>
          )}
        </div>

        <Button size="lg" disabled={!dobValid || !captured} onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  )
}
