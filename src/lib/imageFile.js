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
