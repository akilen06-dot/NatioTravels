import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImageSquare, UploadSimple } from '@phosphor-icons/react'
import { useStore } from '../../lib/store'
import { readAndResizeImage } from '../../lib/imageFile'

export default function NewPost() {
  const navigate = useNavigate()
  const createPost = useStore((s) => s.createPost)
  const fileInputRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [loadingUpload, setLoadingUpload] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setLoadingUpload(true)
    try {
      const dataUrl = await readAndResizeImage(file)
      setPhoto(dataUrl)
    } catch (err) {
      setError(err.message || "Couldn't use that photo. Try another one.")
    } finally {
      setLoadingUpload(false)
    }
  }

  async function handleShare() {
    if (!photo) {
      setError('Add a photo to share.')
      return
    }
    await createPost({ photo, caption: caption.trim() })
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
        <h1 className="text-[15px] font-semibold text-ink">New post</h1>
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
        <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-dashed border-border-strong bg-bg-sunken">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint">
              <ImageSquare size={32} />
              <span className="text-[13px]">No photo selected</span>
            </div>
          )}
          {loadingUpload && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[13px] font-medium text-white">
              Preparing photo…
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingUpload}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-60 cursor-pointer"
        >
          <UploadSimple size={17} weight="bold" />
          Choose from your device
        </button>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </div>

      <p className="mt-8 text-[13.5px] font-medium text-ink">Caption</p>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
        placeholder="Write a caption"
        className="mt-2 w-full resize-none rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25"
      />

      <button
        type="button"
        onClick={handleShare}
        disabled={loadingUpload}
        className="mt-6 h-11 w-full rounded-full bg-accent-strong text-[15px] font-medium text-white transition-colors duration-200 hover:bg-accent-strong/90 disabled:opacity-60 cursor-pointer"
      >
        Share
      </button>
    </div>
  )
}
