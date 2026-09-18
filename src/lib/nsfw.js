'use client'

/**
 * NSFWJS client-side pre-filter.
 *
 * A free, open-source (TensorFlow.js) model that runs entirely in the browser —
 * no API, no cost. It's a CHEAP FIRST FILTER only: it blocks the obvious stuff
 * before it ever uploads. It is NOT a guarantee (it can be imperfect and a
 * determined user could bypass client code) — the real guarantee is Cloudinary
 * manual moderation, which never delivers an image until an admin approves it.
 *
 * IMPORTANT: tfjs + nsfwjs are loaded from a CDN at RUNTIME (not bundled). They
 * are big libraries whose transitive deps conflict with next-pwa's webpack, so
 * bundling them breaks `next build`. Loading them lazily from a CDN keeps the
 * build clean and only pays the download cost the first time a member uploads.
 *
 * Everything here FAILS OPEN: if the model can't load, we let the upload proceed
 * (manual moderation will still catch anything bad) rather than block a real
 * member behind a broken model download.
 */

const TF_SRC = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'
const NSFW_SRC = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js'

// Block thresholds — tuned to reject clear adult content while tolerating normal
// travel/beach photos.
const BLOCK = { Porn: 0.6, Hentai: 0.6, Sexy: 0.9 }

let _modelPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function getModel() {
  if (typeof window === 'undefined') return null
  if (!_modelPromise) {
    _modelPromise = (async () => {
      await loadScript(TF_SRC)
      await loadScript(NSFW_SRC)
      if (!window.tf || !window.nsfwjs) throw new Error('nsfw libraries unavailable')
      await window.tf.ready()
      return window.nsfwjs.load() // default hosted MobileNetV2 model
    })().catch((err) => {
      console.warn('[nsfw] model load failed — failing open', err)
      _modelPromise = null
      return null
    })
  }
  return _modelPromise
}

function verdictFromPredictions(predictions) {
  const scores = {}
  for (const p of predictions) scores[p.className] = p.probability
  for (const [cls, threshold] of Object.entries(BLOCK)) {
    if ((scores[cls] ?? 0) >= threshold) {
      return { safe: false, reason: `This image looks like it may contain ${cls.toLowerCase()} content and can't be uploaded.` }
    }
  }
  return { safe: true }
}

function loadImageEl(blobOrFile) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    const url = URL.createObjectURL(blobOrFile)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

/**
 * @param {Blob|File} blobOrFile
 * @returns {Promise<{ safe: boolean, reason?: string }>}
 */
export async function checkImageBlob(blobOrFile) {
  try {
    const model = await getModel()
    if (!model) return { safe: true } // fail open
    const img = await loadImageEl(blobOrFile)
    const predictions = await model.classify(img)
    return verdictFromPredictions(predictions)
  } catch (err) {
    console.warn('[nsfw] image check failed — failing open', err)
    return { safe: true }
  }
}

/**
 * Samples a few frames across the video and blocks if any frame looks unsafe.
 * @param {Blob|File} blobOrFile
 * @returns {Promise<{ safe: boolean, reason?: string }>}
 */
export async function checkVideoBlob(blobOrFile) {
  try {
    const model = await getModel()
    if (!model) return { safe: true }

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(blobOrFile)
    video.src = url

    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve
      video.onerror = reject
    })

    const duration = video.duration && isFinite(video.duration) ? video.duration : 0
    const points = duration ? [0.2, 0.5, 0.8].map((f) => f * duration) : [0]
    const canvas = document.createElement('canvas')

    try {
      for (const t of points) {
        await new Promise((resolve) => {
          video.onseeked = resolve
          video.currentTime = t
        })
        canvas.width = video.videoWidth || 224
        canvas.height = video.videoHeight || 224
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        const predictions = await model.classify(canvas)
        const verdict = verdictFromPredictions(predictions)
        if (!verdict.safe) return verdict
      }
      return { safe: true }
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.warn('[nsfw] video check failed — failing open', err)
    return { safe: true }
  }
}
