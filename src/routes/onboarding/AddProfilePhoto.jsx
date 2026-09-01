import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, UserCircle } from '@phosphor-icons/react'
import OnboardingLayout from '../../components/OnboardingLayout'
import Button from '../../components/Button'
import { useStore } from '../../lib/store'
import { readAndResizeImage } from '../../lib/imageFile'

export default function AddProfilePhoto() {
  const navigate = useNavigate()
  const draft = useStore((s) => s.draft)
  const setDraftField = useStore((s) => s.setDraftField)
  const fileInputRef = useRef(null)
  const [error, setError] = useState('')
  const [loadingUpload, setLoadingUpload] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setLoadingUpload(true)
    try {
      const dataUrl = await readAndResizeImage(file, { maxDim: 500, quality: 0.85 })
      setDraftField('photo', dataUrl)
    } catch (err) {
      setError(err.message || "Couldn't use that photo. Try another one.")
    } finally {
      setLoadingUpload(false)
    }
  }

  function handleContinue() {
    navigate('/onboarding/plan')
  }

  return (
    <OnboardingLayout
      step={5}
      totalSteps={5}
      title="Add a profile photo"
      subtitle="Help other travelers recognize you. You can always change this later."
      onSkip={handleContinue}
      skipLabel="Skip for now"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-bg-sunken">
            {draft.photo ? (
              <img src={draft.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle size={72} className="text-ink-faint" />
            )}
          </div>
          {loadingUpload && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loadingUpload}
            aria-label={draft.photo ? 'Change photo' : 'Add photo'}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent-strong text-white shadow-md transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-60 cursor-pointer"
          >
            <Camera size={16} weight="fill" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingUpload}
          className="mt-4 text-[13.5px] font-medium text-accent-strong cursor-pointer disabled:opacity-60"
        >
          {draft.photo ? 'Choose a different photo' : 'Upload from your gallery'}
        </button>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </div>

      <Button size="lg" className="mt-10 w-full" onClick={handleContinue} disabled={loadingUpload}>
        Continue
      </Button>
    </OnboardingLayout>
  )
}
