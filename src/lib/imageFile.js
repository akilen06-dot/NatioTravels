// There's no real object storage in this app — every file, image or not,
// ends up inlined as a data URL in a Postgres text column (or localStorage
// in mock mode). Fine at prototype scale, but this cap keeps a stray large
// upload from bloating a row or blowing the localStorage quota.
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

// Reads any file (PDF, doc, zip, etc.) as-is into a data URL, size-capped
// since — unlike images — it isn't resized down first.
export function readFileAsDataUrl(file, { maxBytes = MAX_ATTACHMENT_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`That file is too big to send (max ${Math.round(maxBytes / 1024 / 1024)}MB).`))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Couldn't read that file."))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

// Reads an image file and downscales it to a JPEG data URL. Keeps uploaded
// photos small enough to live comfortably in localStorage (this prototype
// has no real backend/object storage) while still looking sharp in the UI.
export function readAndResizeImage(file, { maxDim = 960, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file is not an image.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Couldn't read that file."))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Couldn't load that image."))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
