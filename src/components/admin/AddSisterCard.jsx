'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserPlus, Eye, EyeOff, Check, X, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AddSisterCard() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [created, setCreated] = useState(null) // { fullName, email } after success

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setServerError(json.error ?? 'Could not create the account')
        return
      }
      setCreated({ fullName: json.data.fullName, email: json.data.email })
      reset()
      setShowPassword(false)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — click to expand */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-6 text-left hover:bg-gray-50/60 transition-colors"
        aria-expanded={open}
      >
        <div className="w-11 h-11 rounded-xl bg-brand-lighter text-brand flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900">Add a new sister</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create an account directly — no email verification needed
          </p>
        </div>
        <span className="text-xs font-medium text-brand shrink-0">
          {open ? 'Close' : 'Add'}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-5">
          {/* Success banner */}
          {created && (
            <div className="mb-5 flex items-start gap-2.5 bg-teal-lighter/60 border border-teal/20 rounded-xl p-3.5">
              <Check className="w-4 h-4 text-teal-dark shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-teal-dark">
                <p className="font-medium">Account created for {created.fullName}</p>
                <p className="text-xs mt-0.5">
                  She can log in with <b>{created.email}</b> and the password you set,
                  then complete her profile and change her password from settings.
                </p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 bg-danger-lighter border border-danger/20 rounded-xl p-3.5">
              <X className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-danger">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              required
              placeholder="Her real name"
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />

            <Input
              label="Email"
              type="email"
              required
              placeholder="her@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 8 chars with a number"
                helper="Share this with her securely — she can change it after logging in."
                error={errors.password?.message}
                className="pr-10"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: v => /\d/.test(v) || 'Password must contain at least one number',
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-[34px] sm:top-[32px] text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={isSubmitting}>
                Create account
              </Button>
              {created && (
                <button
                  type="button"
                  onClick={() => setCreated(null)}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Add another
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
