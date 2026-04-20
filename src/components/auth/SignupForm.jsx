'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState('form')
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    })
    if (!res.ok) {
      toast.error('Failed to send OTP')
      return
    }
    setStep('otp')
    toast.success('OTP sent to your email')
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {step === 'form' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Priya Sharma"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="priya@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
          />
          <Button type="submit" size="full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>
      ) : (
        <OtpStep email={getValues('email')} formData={getValues()} />
      )}
    </div>
  )
}

function OtpStep({ email, formData }) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function verifyOtp() {
    setLoading(true)
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, ...formData }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Invalid OTP'); return }
    toast.success('Account created!')
    router.push('/onboarding/profile')
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-gray-600">Enter the 6-digit code sent to <b>{email}</b></p>
      <input
        className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-200 rounded-xl py-4 focus:outline-none focus:border-brand"
        maxLength={6}
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
      />
      <Button size="full" onClick={verifyOtp} isLoading={loading} disabled={otp.length < 6}>
        Verify & Continue
      </Button>
    </div>
  )
}
