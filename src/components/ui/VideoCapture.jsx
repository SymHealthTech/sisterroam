'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, Upload, Square, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function VideoCapture({ onUploadComplete }) {
  const [tab, setTab] = useState('record')

  // Record tab
  const [camState,     setCamState]     = useState('idle') // idle | requesting | denied | granted
  const [camError,     setCamError]     = useState('')
  const [recording,    setRecording]    = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedUrl,  setRecordedUrl]  = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [recordDone,   setRecordDone]   = useState(false)

  // Upload tab
  const [selectedFile,  setSelectedFile]  = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDone,    setUploadDone]    = useState(false)

  const streamRef        = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const mimeTypeRef      = useRef('')
  const previewVideoRef  = useRef(null)
  const timerRef         = useRef(null)
  const fileInputRef     = useRef(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      clearInterval(timerRef.current)
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  // Attach live stream to preview video element
  useEffect(() => {
    if (camState === 'granted' && streamRef.current && previewVideoRef.current) {
      previewVideoRef.current.srcObject = streamRef.current
    }
  }, [camState])

  async function startCamera() {
    setCamState('requesting')
    setCamError('')

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCamError('insecure')
      setCamState('denied')
      return
    }

    // Check if Chrome has already hard-blocked the permission
    try {
      const [camPerm, micPerm] = await Promise.all([
        navigator.permissions.query({ name: 'camera' }),
        navigator.permissions.query({ name: 'microphone' }),
      ])
      if (camPerm.state === 'denied' || micPerm.state === 'denied') {
        setCamError('hard-blocked')
        setCamState('denied')
        return
      }
    } catch {
      // permissions API not supported — fall through to getUserMedia
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      setCamState('granted')
    } catch (err) {
      const name = err?.name ?? ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCamError('hard-blocked')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCamError('no-device')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCamError('in-use')
      } else {
        setCamError(name || 'unknown')
      }
      setCamState('denied')
    }
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []

    const supportedType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
    mimeTypeRef.current = supportedType

    let mr
    try {
      mr = supportedType
        ? new MediaRecorder(streamRef.current, { mimeType: supportedType })
        : new MediaRecorder(streamRef.current)
    } catch (err) {
      toast.error('Recording is not supported in this browser. Please use the "Upload file" tab instead.')
      setCamState('idle')
      return
    }

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'video/webm' })
      setRecordedBlob(blob)
      setRecordedUrl(URL.createObjectURL(blob))
    }
    mr.start(1000)
    mediaRecorderRef.current = mr
    setRecording(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function recordAgain() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedBlob(null)
    setRecordedUrl(null)
    setElapsed(0)
    setCamState('idle')
    setCamError('')
  }

  // Upload blob/file directly to Cloudinary (bypasses Next.js body size limit)
  async function uploadToCloudinary(blob, fileName) {
    const sigRes = await fetch('/api/upload/signature?folder=sisterroam/verifications/videos')
    if (!sigRes.ok) throw new Error('Could not start upload. Please try again.')
    const { signature, timestamp, apiKey, cloudName } = await sigRes.json()

    const fd = new FormData()
    fd.append('file', blob, fileName)
    fd.append('folder', 'sisterroam/verifications/videos')
    fd.append('timestamp', String(timestamp))
    fd.append('signature', signature)
    fd.append('api_key', apiKey)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ url: data.secure_url, publicId: data.public_id })
          } else {
            reject(new Error(data?.error?.message ?? 'Upload failed'))
          }
        } catch {
          reject(new Error('Upload failed. Please try again.'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.ontimeout = () => reject(new Error('Upload timed out. Try a shorter video.'))
      xhr.timeout = 300000 // 5 min — goes straight to Cloudinary, no server middleman
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)
      xhr.send(fd)
    })
  }

  async function uploadRecordedVideo() {
    if (!recordedBlob) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await uploadToCloudinary(recordedBlob, 'intro.webm')
      setRecordDone(true)
      onUploadComplete?.({ url: result.url, publicId: result.publicId })
      toast.success('Video uploaded!')
    } catch (err) {
      toast.error(err.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  function onFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large. Max 500MB.')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
    setUploadProgress(0)
    setUploadDone(false)
  }

  async function uploadSelectedFile() {
    if (!selectedFile) return
    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await uploadToCloudinary(selectedFile, selectedFile.name)
      setUploadDone(true)
      onUploadComplete?.({ url: result.url, publicId: result.publicId })
      toast.success('Video uploaded!')
    } catch (err) {
      toast.error(err.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const canStop = recording && elapsed >= 10

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-lg p-0.5 gap-0.5" role="tablist">
        {[
          { id: 'record', label: 'Record video' },
          { id: 'upload', label: 'Upload file' },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
              tab === t.id ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Record tab ── */}
      {tab === 'record' && (
        <div className="space-y-4">
          {camState === 'idle' && !recordedUrl && (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-gray-500 mb-4">Record a short intro video (minimum 10 seconds)</p>
              <Button variant="primary" onClick={startCamera}>Start recording</Button>
            </div>
          )}

          {camState === 'requesting' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-gray-500">Requesting camera access…</p>
            </div>
          )}

          {camState === 'denied' && (
            <div className="rounded-xl bg-danger-lighter p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-danger">Camera access blocked</p>
              </div>

              {camError === 'hard-blocked' && (
                <div className="text-xs text-gray-600 space-y-2">
                  <p>Chrome has blocked camera access for this site. To fix it:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Click the <strong>lock icon 🔒</strong> in the address bar</li>
                    <li>Click <strong>Site settings</strong></li>
                    <li>Set <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong></li>
                    <li>Reload the page, then come back here</li>
                  </ol>
                </div>
              )}

              {camError === 'insecure' && (
                <p className="text-xs text-gray-600">Camera requires an HTTPS connection. Make sure you are on <strong>https://sisterroam.com</strong>.</p>
              )}

              {camError === 'no-device' && (
                <p className="text-xs text-gray-600">No camera was detected on this device. Use the <strong>&quot;Upload file&quot;</strong> tab to submit a pre-recorded video.</p>
              )}

              {camError === 'in-use' && (
                <p className="text-xs text-gray-600">Your camera is already open in another app or browser tab. Close it and try again.</p>
              )}

              {!['hard-blocked','insecure','no-device','in-use'].includes(camError) && (
                <p className="text-xs text-gray-600">Could not access camera ({camError || 'unknown error'}). Use the <strong>&quot;Upload file&quot;</strong> tab instead.</p>
              )}

              {camError !== 'hard-blocked' && (
                <button
                  className="text-xs text-brand underline"
                  onClick={() => { setCamState('idle'); setCamError('') }}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {camState === 'granted' && !recordedUrl && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video ref={previewVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {recording && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                    <span aria-live="polite" aria-atomic="true">{formatTime(elapsed)}</span>
                  </div>
                )}
              </div>

              {!recording ? (
                <Button variant="primary" fullWidth onClick={startRecording}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 mr-1.5" aria-hidden="true" />
                  Start recording
                </Button>
              ) : (
                <Button
                  variant={canStop ? 'danger' : 'ghost'}
                  fullWidth
                  onClick={stopRecording}
                  disabled={!canStop}
                >
                  <Square className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {canStop ? 'Stop recording' : `Stop recording (${10 - elapsed}s min)`}
                </Button>
              )}
            </div>
          )}

          {recordedUrl && (
            <div className="space-y-3">
              {recordDone ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-teal mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Video uploaded successfully!</p>
                </div>
              ) : (
                <>
                  <div className="bg-black rounded-xl overflow-hidden aspect-video">
                    <video src={recordedUrl} controls playsInline className="w-full h-full object-cover" />
                  </div>
                  {uploading && (
                    <div className="space-y-1.5" aria-label={`Upload progress ${uploadProgress}%`}>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{uploadProgress}%</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={recordAgain} disabled={uploading}>
                      <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
                      Record again
                    </Button>
                    <Button variant="primary" className="flex-1" loading={uploading} onClick={uploadRecordedVideo}>
                      Use this video
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Upload tab ── */}
      {tab === 'upload' && (
        <div className="space-y-4">
          {uploadDone ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-teal mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Video uploaded successfully!</p>
            </div>
          ) : (
            <>
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {selectedFile ? selectedFile.name : 'Click to select a video'}
                </p>
                {selectedFile ? (
                  <p className="text-xs text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                ) : (
                  <p className="text-xs text-gray-400">MP4, MOV or AVI · Max 500 MB</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/avi"
                  className="sr-only"
                  onChange={onFileSelect}
                />
              </label>

              {uploading && (
                <div className="space-y-1.5" aria-label={`Upload progress ${uploadProgress}%`}>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-right">{uploadProgress}%</p>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={uploadSelectedFile}
                disabled={!selectedFile || uploading}
                loading={uploading}
              >
                Upload video
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
