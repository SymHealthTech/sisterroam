'use client'

/**
 * Holds the verification media (ID front/back + intro video) in the browser
 * while the member is away at the Dodo payment page, so nothing is uploaded to
 * Cloudinary until AFTER payment succeeds.
 *
 * We use IndexedDB (not memory or sessionStorage) because it survives the full
 * off-site redirect to Dodo and back, and can store Blobs directly. Everything
 * is wrapped in try/catch and fails soft — if storage is unavailable (private
 * window, blocked site data) the caller falls back to asking the member to
 * re-select their documents after payment.
 */

const DB_NAME = 'sisterroam'
const STORE = 'pendingVerification'
const KEY = 'current'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexeddb'))
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * @param {{ idFront?: Blob, idBack?: Blob, video?: Blob, videoName?: string, country?: string }} data
 * @returns {Promise<boolean>} whether it was saved
 */
export async function savePending(data) {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(data, KEY)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
    return true
  } catch {
    return false
  }
}

/**
 * Merge fields into the existing pending record (or create it).
 */
export async function mergePending(patch) {
  const current = (await loadPending()) ?? {}
  return savePending({ ...current, ...patch })
}

/**
 * @returns {Promise<null | { idFront?: Blob, idBack?: Blob, video?: Blob, videoName?: string, country?: string }>}
 */
export async function loadPending() {
  try {
    const db = await openDB()
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return data
  } catch {
    return null
  }
}

export async function clearPending() {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
    return true
  } catch {
    return false
  }
}

/** Whether all three required media blobs are present. */
export function hasAllMedia(data) {
  return !!(data?.idFront && data?.idBack && data?.video)
}
