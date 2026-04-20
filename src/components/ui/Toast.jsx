'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          fontFamily: 'inherit',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
        error: { iconTheme: { primary: '#E24B4A', secondary: '#fff' } },
      }}
    />
  )
}
