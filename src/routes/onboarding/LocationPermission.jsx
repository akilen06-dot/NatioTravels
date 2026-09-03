import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPinLine } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'
import { requestGeolocation, fuzzCoordinates, reverseGeocode } from '../../lib/geocode'

export default function LocationPermission() {
  const navigate = useNavigate()
  const setDraftField = useStore((s) => s.setDraftField)
  const [status, setStatus] = useState('idle') // idle | requesting | granted | denied

  function proceed() {
    navigate('/onboarding/verify')
  }

  async function handleAllow() {
    setStatus('requesting')
    try {
      const raw = await requestGeolocation()
      const fuzzed = fuzzCoordinates(raw)
      setDraftField('lat', fuzzed.lat)
      setDraftField('lng', fuzzed.lng)

      const place = await reverseGeocode(fuzzed)
      if (place?.city) setDraftField('city', place.city)

      setStatus('granted')
    } catch {
      // Denied, unsupported, or timed out — proceed without a location fix.
      // The app still works; Discover just won't have a real distance yet.
      setStatus('denied')
    } finally {
      setTimeout(proceed, 500)
    }
  }

  return (
    <OnboardingLayout
      step={2}
      totalSteps={4}
      title="Turn on location"
      subtitle="We use your location to show nearby travelers of your nationality. Your exact position is never shared, only an approximate distance."
    >
      <div className="flex flex-col items-center rounded-2xl border border-border bg-bg-sunken p-7 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent-strong">
          <MapPinLine size={26} />
        </span>
        <p className="mt-4 text-[15px] font-medium text-ink">Allow "Natio" to use your location?</p>
        <p className="mt-1.5 text-[13.5px] text-ink-muted">
          Only while you're using the app.
        </p>

        {status === 'idle' ? (
          <div className="mt-5 flex w-full flex-col gap-2.5">
            <Button onClick={handleAllow} className="w-full">
              Allow while using app
            </Button>
            <Button variant="ghost" onClick={proceed} className="w-full">
              Not now
            </Button>
          </div>
        ) : status === 'requesting' ? (
          <p className="mt-5 text-[13.5px] font-medium text-ink-muted">Requesting location…</p>
        ) : status === 'granted' ? (
          <p className="mt-5 text-[13.5px] font-medium text-success">Location enabled</p>
        ) : (
          <p className="mt-5 text-[13.5px] font-medium text-ink-muted">Continuing without location</p>
        )}
      </div>
    </OnboardingLayout>
  )
}
