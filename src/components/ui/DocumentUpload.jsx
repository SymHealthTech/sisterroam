/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileCheck, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

async function compressImage(file, maxPx = 1920) {
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
      canvas.toBlob(resolve, 'image/webp', 0.88)
    }
    img.src = url
  })
}

const STATUS_CONFIG = {
  not_uploaded: { label: 'Not uploaded', variant: 'basic'    },
  uploaded:     { label: 'Uploaded',     variant: 'pending'  },
  under_review: { label: 'Under review', variant: 'pending'  },
  verified:     { label: 'Verified',     variant: 'verified' },
}

function DocumentSlot({ label, documentType, initialStatus = 'not_uploaded', onUploadComplete }) {
  const [status,    setStatus]    = useState(initialStatus)
  const [preview,   setPreview]   = useState(null)   // { file, url }
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview({ file, url: URL.createObjectURL(file) })
  }

  function clearPreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function uploadFile() {
    if (!preview?.file) return
    setUploading(true)
    try {
      const compressed = await compressImage(preview.file)
      const fd = new FormData()
      fd.append('file',  compressed, 'document.webp')
      fd.append('type',  'id_document')
      fd.append('extra', documentType)

      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setStatus('uploaded')
      clearPreview()
      onUploadComplete?.({ documentType, url: data.url, publicId: data.publicId })
      toast.success(`${label} uploaded`)
    } catch (err) {
      toast.error(err.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const { label: statusLabel, variant } = STATUS_CONFIG[status]

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <Badge variant={variant} size="sm">{statusLabel}</Badge>
      </div>

      {status === 'verified' && (
        <div className="flex items-center gap-2 text-sm text-teal">
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Document verified</span>
        </div>
      )}

      {status === 'under_review' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Being reviewed by our team</span>
        </div>
      )}

      {status !== 'verified' && status !== 'under_review' && (
        <>
          {preview ? (
            <div className="space-y-3">
              <div className="relative">
               
              
                <img
                  src={preview.url}
                  alt={`${label} preview`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-100"
                />
                <button
                  onClick={clearPreview}
                  disabled={uploading}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                </button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={clearPreview} disabled={uploading}>
                  Re-select
                </Button>
                <Button variant="primary" size="sm" className="flex-1" loading={uploading} onClick={uploadFile}>
                  Upload
                </Button>
              </div>
            </div>
          ) : (
            <>
              {status === 'uploaded' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileCheck className="w-4 h-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>Document uploaded. Awaiting review.</span>
                </div>
              )}

              <label className="block border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-brand transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" aria-hidden="true" />
                <p className="text-xs font-medium text-gray-600">
                  {status === 'uploaded' ? 'Upload a new photo' : 'Click to upload'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG or HEIC · Max 10 MB · auto-compressed</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="sr-only"
                  onChange={onFileChange}
                />
              </label>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function DocumentUpload({ userId, onUploadComplete, frontStatus, backStatus }) {
  return (
    <div className="space-y-3">
      <DocumentSlot
        label="Front of ID"
        documentType="id_front"
        initialStatus={frontStatus ?? 'not_uploaded'}
        onUploadComplete={onUploadComplete}
      />
      <DocumentSlot
        label="Back of ID"
        documentType="id_back"
        initialStatus={backStatus ?? 'not_uploaded'}
        onUploadComplete={onUploadComplete}
      />
    </div>
  )
}
