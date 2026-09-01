import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle, IdentificationCard, UploadSimple } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Field from '../../components/Field'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'

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
  const setDraftField = useStore((s) => s.setDraftField)
  const [dob, setDob] = useState('')
  const [captured, setCaptured] = useState(false)
  const [touchedDob, setTouchedDob] = useState(false)

  const age = useMemo(() => ageFromDob(dob), [dob])
  const underage = touchedDob && dob && age !== null && age < 18
  const dobValid = dob && age !== null && age >= 18

  function handleContinue() {
    if (!dobValid || !captured) return
    setDraftField('dob', dob)
    navigate('/onboarding/face-scan')
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={5}
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
          {!captured ? (
            <div className="mt-2 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-bg-sunken p-8 text-center">
              <IdentificationCard size={36} className="text-ink-faint" />
              <p className="max-w-[220px] text-[13px] text-ink-muted">
                Frame your passport photo page or government ID inside the card.
              </p>
              <div className="flex w-full flex-col gap-2.5">
                <Button variant="secondary" onClick={() => setCaptured(true)} className="w-full">
                  <Camera size={18} />
                  Take photo
                </Button>
                <Button variant="ghost" onClick={() => setCaptured(true)} className="w-full">
                  <UploadSimple size={17} />
                  Upload from gallery
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-bg-sunken p-4">
              <CheckCircle size={22} weight="fill" className="text-success" />
              <div>
                <p className="text-[14px] font-medium text-ink">Photo captured</p>
                <p className="text-[12.5px] text-ink-muted">
                  We'll match this against a live face scan next.
                </p>
              </div>
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
