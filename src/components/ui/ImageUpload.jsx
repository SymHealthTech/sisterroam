'use client'

import { useState, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

async function resizeToWebp(file, maxPx = 800) {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(resolve, 'image/webp', 0.85)
    }
    img.src = url
  })
}

export default function ImageUpload({ currentImageUrl, name, onUploadComplete }) {
  const [previewUrl,  setPreviewUrl]  = useState(null)
  const [rawFile,     setRawFile]     = useState(null)
  const [showCrop,    setShowCrop]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [offset,      setOffset]      = useState({ x: 0, y: 0 })
  const [dragStart,   setDragStart]   = useState(null)

  const fileInputRef = useRef(null)

  function openPicker() {
    fileInputRef.current?.click()
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setRawFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setOffset({ x: 0, y: 0 })
    setShowCrop(true)
  }

  function getClientXY(e) {
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX, y: src.clientY }
  }

  function onDragStart(e) {
    e.preventDefault()
    const { x, y } = getClientXY(e)
    setDragStart({ x: x - offset.x, y: y - offset.y })
  }

  function onDragMove(e) {
    if (!dragStart) return
    const { x, y } = getClientXY(e)
    setOffset({ x: x - dragStart.x, y: y - dragStart.y })
  }

  function onDragEnd() {
    setDragStart(null)
  }

  function cancelCrop() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setShowCrop(false)
    setPreviewUrl(null)
    setRawFile(null)
  }

  async function confirmUpload() {
    if (!rawFile) return
    setShowCrop(false)
    setUploading(true)
    try {
      const blob = await resizeToWebp(rawFile)
      const fd = new FormData()
      fd.append('file', blob, 'photo.webp')
      fd.append('type', 'profile_photo')

      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      onUploadComplete?.({ url: data.url, publicId: data.publicId })
      toast.success('Photo updated!')
    } catch (err) {
      toast.error(err.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(false)
      setPreviewUrl(null)
      setRawFile(null)
    }
  }

  return (
    <>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="Change profile photo"
        >
          <Avatar src={currentImageUrl} name={name} size="xl" />

          {/* Hover overlay */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            aria-hidden="true"
          >
            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Upload spinner */}
          {uploading && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50" aria-hidden="true">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={onFileChange}
        />
      </div>

      {/* Crop modal */}
      {showCrop && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Adjust photo"
        >
          <div className="absolute inset-0 bg-black/60" onClick={cancelCrop} aria-hidden="true" />

          <div className="relative bg-white rounded-[14px] w-full max-w-sm mx-4 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-base">Adjust photo</h2>
              <button
                onClick={cancelCrop}
                className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Crop area */}
            <div className="p-5 flex flex-col items-center">
              <div
                className="w-64 h-64 rounded-full overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing select-none border-2 border-brand/30"
                onMouseDown={onDragStart}
                onMouseMove={onDragMove}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
                onTouchStart={onDragStart}
                onTouchMove={onDragMove}
                onTouchEnd={onDragEnd}
                aria-label="Drag to reposition photo"
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover pointer-events-none"
                  style={{
                    transform:  `translate(${offset.x}px, ${offset.y}px)`,
                    transition: dragStart ? 'none' : 'transform 0.1s',
                  }}
                  draggable={false}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">Drag to reposition</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { cancelCrop(); setTimeout(openPicker, 50) }}
              >
                Re-select
              </Button>
              <Button variant="primary" className="flex-1" onClick={confirmUpload}>
                Use this photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
