import * as faceapi from '@vladmandic/face-api'

const MODEL_URL = '/models'

// A euclidean distance below this between two face descriptors is
// considered a match. 0.6 is the threshold face-api.js's own docs and most
// production uses of this model settle on.
const MATCH_THRESHOLD = 0.6

let loadPromise = null

// Loads the three models we need (tiny face detector, landmarks for
// alignment, and the recognition net that produces a 128-d descriptor) from
// /public/models. Safe to call repeatedly — only fetches once.
export function loadFaceModels() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
  }
  return loadPromise
}

// Runs detection + landmark alignment + descriptor extraction on an
// <img> or <video> element (or an already-loaded HTMLImageElement built
// from a data URL — see dataUrlToImage below). Returns the 128-d
// Float32Array descriptor, or null if no face was found.
export async function getFaceDescriptor(mediaElement) {
  const result = await faceapi
    .detectSingleFace(mediaElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  return result?.descriptor ?? null
}

export function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Couldn't load that image."))
    img.src = dataUrl
  })
}

// True if the two descriptors are close enough to be the same person.
export function matchesFace(descriptorA, descriptorB) {
  const distance = faceapi.euclideanDistance(descriptorA, descriptorB)
  return { match: distance < MATCH_THRESHOLD, distance }
}
