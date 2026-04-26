'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [sent,    setSent]    = useState(false)
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit(data) {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      setEmail(data.email)
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-bold text-brand">SisterRoam</span>
              <span className="text-pink text-xl" aria-hidden="true">♀</span>
            </Link>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-lighter flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-teal" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Check your inbox</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                We sent a password reset link to{' '}
                <span className="font-medium text-gray-700">{email}</span>.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-gray-400">
                Can't find it? Check your spam or junk folder.
              </p>
              <Button variant="ghost" fullWidth href="/login" className="mt-2">
                Back to login
              </Button>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot password?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-danger-lighter border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern:  { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                  })}
                />

                <Button type="submit" fullWidth loading={loading}>
                  Send reset link
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                <Link href="/login" className="text-brand font-medium hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
