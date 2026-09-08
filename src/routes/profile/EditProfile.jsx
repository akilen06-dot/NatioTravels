import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from '@phosphor-icons/react'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { useStore } from '../../lib/store'
import { readAndResizeImage } from '../../lib/imageFile'

export default function EditProfile() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const updateProfile = useStore((s) => s.updateProfile)
  const fileInputRef = useRef(null)
  const [photo, setPhoto] = useState(currentUser.photo)
  const [bio, setBio] = useState(currentUser.bio || '')
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
      setPhoto(dataUrl)
    } catch (err) {
      setError(err.message || "Couldn't use that photo. Try another one.")
    } finally {
      setLoadingUpload(false)
    }
  }

  function handleSave() {
    updateProfile({ photo, bio: bio.trim() })
    navigate('/profile')
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[15px] font-semibold text-ink">Edit profile</h1>
        <div className="w-8" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          <Avatar src={photo} className="h-24 w-24 rounded-full object-cover" />
          {loadingUpload && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loadingUpload}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-strong text-white shadow-md transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-60 cursor-pointer"
          >
            <Camera size={15} weight="fill" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingUpload}
          className="mt-3 text-[13.5px] font-medium text-accent-strong cursor-pointer disabled:opacity-60"
        >
          Change profile photo
        </button>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </div>

      <p className="mt-8 text-[13.5px] font-medium text-ink">Bio</p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        maxLength={150}
        placeholder="Tell other travelers a bit about you"
        className="mt-2 w-full resize-none rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      <p className="mt-1 text-right text-[12px] text-ink-faint">{bio.length}/150</p>

      <Button size="lg" className="mt-4 w-full" onClick={handleSave} disabled={loadingUpload}>
        Save
      </Button>
    </div>
  )
}
