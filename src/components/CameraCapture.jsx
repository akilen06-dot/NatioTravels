import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Requests the front camera and renders a live preview. Exposes
// captureFrame() (returns a JPEG data URL of the current frame) and
// getVideoElement() (for running live detection directly against the video)
// via ref, mirroring the imperative-trigger pattern SwipeCard already uses.
const CameraCapture = forwardRef(function CameraCapture({ onReady, onError, className = '' }, ref) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.(new Error('Camera access is not supported in this browser.'))
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        onReady?.()
      } catch (err) {
        onError?.(err)
      }
    }

    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useImperativeHandle(ref, () => ({
    captureFrame() {
      const video = videoRef.current
      if (!video || !video.videoWidth) return null
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      return canvas.toDataURL('image/jpeg', 0.9)
    },
    getVideoElement() {
      return videoRef.current
    },
  }))

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{ transform: 'scaleX(-1)' }}
    />
  )
})

export default CameraCapture
