'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'

const DIAL_CODES = [
  { code: '+91',  country: 'India',               flag: '🇮🇳' },
  { code: '+1',   country: 'United States',        flag: '🇺🇸' },
  { code: '+44',  country: 'United Kingdom',       flag: '🇬🇧' },
  { code: '+61',  country: 'Australia',            flag: '🇦🇺' },
  { code: '+1',   country: 'Canada',               flag: '🇨🇦' },
  { code: '+971', country: 'UAE',                  flag: '🇦🇪' },
  { code: '+65',  country: 'Singapore',            flag: '🇸🇬' },
  { code: '+60',  country: 'Malaysia',             flag: '🇲🇾' },
  { code: '+62',  country: 'Indonesia',            flag: '🇮🇩' },
  { code: '+63',  country: 'Philippines',          flag: '🇵🇭' },
  { code: '+66',  country: 'Thailand',             flag: '🇹🇭' },
  { code: '+84',  country: 'Vietnam',              flag: '🇻🇳' },
  { code: '+81',  country: 'Japan',                flag: '🇯🇵' },
  { code: '+82',  country: 'South Korea',          flag: '🇰🇷' },
  { code: '+86',  country: 'China',                flag: '🇨🇳' },
  { code: '+92',  country: 'Pakistan',             flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh',           flag: '🇧🇩' },
  { code: '+94',  country: 'Sri Lanka',            flag: '🇱🇰' },
  { code: '+977', country: 'Nepal',                flag: '🇳🇵' },
  { code: '+966', country: 'Saudi Arabia',         flag: '🇸🇦' },
  { code: '+974', country: 'Qatar',                flag: '🇶🇦' },
  { code: '+973', country: 'Bahrain',              flag: '🇧🇭' },
  { code: '+968', country: 'Oman',                 flag: '🇴🇲' },
  { code: '+965', country: 'Kuwait',               flag: '🇰🇼' },
  { code: '+49',  country: 'Germany',              flag: '🇩🇪' },
  { code: '+33',  country: 'France',               flag: '🇫🇷' },
  { code: '+39',  country: 'Italy',                flag: '🇮🇹' },
  { code: '+34',  country: 'Spain',                flag: '🇪🇸' },
  { code: '+31',  country: 'Netherlands',          flag: '🇳🇱' },
  { code: '+46',  country: 'Sweden',               flag: '🇸🇪' },
  { code: '+47',  country: 'Norway',               flag: '🇳🇴' },
  { code: '+45',  country: 'Denmark',              flag: '🇩🇰' },
  { code: '+358', country: 'Finland',              flag: '🇫🇮' },
  { code: '+41',  country: 'Switzerland',          flag: '🇨🇭' },
  { code: '+43',  country: 'Austria',              flag: '🇦🇹' },
  { code: '+32',  country: 'Belgium',              flag: '🇧🇪' },
  { code: '+351', country: 'Portugal',             flag: '🇵🇹' },
  { code: '+30',  country: 'Greece',               flag: '🇬🇷' },
  { code: '+7',   country: 'Russia',               flag: '🇷🇺' },
  { code: '+380', country: 'Ukraine',              flag: '🇺🇦' },
  { code: '+48',  country: 'Poland',               flag: '🇵🇱' },
  { code: '+27',  country: 'South Africa',         flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria',              flag: '🇳🇬' },
  { code: '+254', country: 'Kenya',                flag: '🇰🇪' },
  { code: '+20',  country: 'Egypt',                flag: '🇪🇬' },
  { code: '+212', country: 'Morocco',              flag: '🇲🇦' },
  { code: '+55',  country: 'Brazil',               flag: '🇧🇷' },
  { code: '+52',  country: 'Mexico',               flag: '🇲🇽' },
  { code: '+54',  country: 'Argentina',            flag: '🇦🇷' },
  { code: '+56',  country: 'Chile',                flag: '🇨🇱' },
  { code: '+57',  country: 'Colombia',             flag: '🇨🇴' },
  { code: '+64',  country: 'New Zealand',          flag: '🇳🇿' },
]

function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
}

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2].map(s => (
        <div
          key={s}
          className={cn(
            'rounded-full transition-all duration-300',
            s === current  ? 'w-6 h-2.5 bg-brand'
            : s < current  ? 'w-2.5 h-2.5 bg-brand opacity-40'
            :                'w-2.5 h-2.5 bg-gray-200',
          )}
        />
      ))}
    </div>
  )
}

function DialCodePicker({ value, onChange }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const selected = DIAL_CODES.find(d => d.code === value && d.country === 'India')
    ?? DIAL_CODES.find(d => d.code === value)
    ?? DIAL_CODES[0]

  const filtered = DIAL_CODES.filter(d =>
    d.country.toLowerCase().includes(search.toLowerCase()) || d.code.includes(search)
  )

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-[44px] sm:h-[40px] flex items-center gap-1.5 px-3 border border-gray-200 rounded-lg bg-white text-sm hover:border-brand transition-colors whitespace-nowrap"
      >
        <span className="text-base">{selected.flag}</span>
        <span className="font-medium text-gray-700">{selected.code}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-white sticky top-0">
            <div className="flex items-center gap-2 h-8 px-2 border border-gray-200 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country…"
                className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(d => (
              <button
                key={`${d.code}-${d.country}`}
                type="button"
                onClick={() => { onChange(d.code); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left"
              >
                <span className="text-base">{d.flag}</span>
                <span className="font-medium text-gray-700 w-12 shrink-0">{d.code}</span>
                <span className="text-gray-500 truncate">{d.country}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OtpInput({ value, onChange, error }) {
  const inputRefs = useRef([])
  const digits    = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  function handleChange(index, raw) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next  = value.slice(0, index) + digit + value.slice(index + 1)
    onChange(next.slice(0, 6))
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = value.slice(0, index) + value.slice(index + 1)
        onChange(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const next = value.slice(0, index - 1) + value.slice(index)
        onChange(next)
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              'w-11 h-12 text-center text-xl font-semibold rounded-xl border-2 transition-colors',
              'focus:outline-none focus:border-brand',
              error ? 'border-danger bg-danger-lighter' : d ? 'border-brand' : 'border-gray-200',
            )}
          />
        ))}
      </div>
      {error && <p className="text-xs text-danger mt-3 text-center">{error}</p>}
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [step,          setStep]          = useState(1)
  const [dialCode,      setDialCode]      = useState('+91')
  const [otpValue,      setOtpValue]      = useState('')
  const [otpError,      setOtpError]      = useState('')
  const [countdown,     setCountdown]     = useState(60)
  const [showPassword,  setShowPassword]  = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData,      setFormData]      = useState({ fullName: '', email: '', password: '', phone: '' })

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password', '')

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 2) return
    setCountdown(60)
    const id = setInterval(() => {
      setCountdown(v => { if (v <= 1) { clearInterval(id); return 0 } return v - 1 })
    }, 1000)
    return () => clearInterval(id)
  }, [step])

  async function handleStep1(data) {
    setSubmitting(true)
    try {
      const fullPhone = data.phone
        ? `${dialCode}${data.phone.replace(/^0/, '')}`
        : ''

      const signupRes = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName: data.fullName,
          email:    data.email,
          password: data.password,
          phone:    fullPhone || undefined,
        }),
      })
      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        if (signupRes.status === 409 && signupData.error?.includes('Email')) {
          toast.error(
            <span>{signupData.error}. <Link href="/login" className="underline font-medium">Log in instead?</Link></span>
          )
        } else {
          toast.error(signupData.error ?? 'Sign up failed')
        }
        return
      }

      const otpRes = await fetch('/api/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email }),
      })

      if (!otpRes.ok) {
        const otpData = await otpRes.json()
        toast.error(otpData.error ?? 'Could not send verification code')
        return
      }

      toast.success(`Verification code sent to ${data.email}`)
      setFormData({ fullName: data.fullName, email: data.email, password: data.password, phone: fullPhone })
      setStep(2)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpVerify() {
    if (otpValue.length < 6) return
    setSubmitting(true)
    setOtpError('')
    try {
      const res  = await fetch('/api/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: formData.email, otp: otpValue }),
      })
      const data = await res.json()

      if (!res.ok) {
        setOtpError(data.error ?? 'Incorrect OTP')
        return
      }

      // Email is now verified — sign in and go to onboarding
      const result = await signIn('credentials', {
        email:    formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.replace('/onboarding/profile')
      } else {
        toast.error('Sign in failed. Please log in manually.')
        router.replace('/login')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function resendOtp() {
    setCountdown(60)
    setOtpValue('')
    setOtpError('')
    const res = await fetch('/api/otp/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: formData.email }),
    })
    if (res.ok) {
      toast.success('Verification code resent')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Could not resend code')
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    try {
      await signIn('google', {
        callbackUrl: '/onboarding/profile',
        redirect: true,
      })
    } catch {
      toast.error('Google sign in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[440px]">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo variant="icon" theme="light" size="md" href="/" />
          </div>

          <StepDots current={step} />

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Create your account</h1>
              <p className="text-sm text-gray-500 text-center mb-6">Join the SisterRoam community</p>

              <form onSubmit={handleSubmit(handleStep1)} className="space-y-4">
                <Input
                  label="Full name"
                  name="fullName"
                  required
                  placeholder="Your real name"
                  error={errors.fullName?.message}
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />

                <Input
                  label="Email"
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

                {/* Phone with dial code — optional, stored for emergency contact */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Phone number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <DialCodePicker value={dialCode} onChange={setDialCode} />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className={cn(
                        'flex-1 h-[44px] sm:h-[40px] px-3 rounded-lg border bg-white text-sm',
                        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
                        errors.phone ? 'border-danger' : 'border-gray-200',
                      )}
                      {...register('phone', {
                        pattern: { value: /^\d{7,15}$/, message: 'Enter a valid phone number' },
                      })}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">Used for emergency contact — not verified at sign-up</p>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Password <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars with a number"
                      className={cn(
                        'w-full h-[44px] sm:h-[40px] px-3 pr-10 rounded-lg border bg-white text-sm',
                        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
                        errors.password ? 'border-danger' : 'border-gray-200',
                      )}
                      {...register('password', {
                        required:  'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                        validate:  v => /\d/.test(v) || 'Password must contain at least one number',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm password */}
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat your password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate:  v => v === password || 'Passwords do not match',
                  })}
                />

                <Button type="submit" fullWidth loading={submitting} className="mt-2">
                  Continue
                </Button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400">or</span>
                </div>
              </div>

              <Button variant="ghost" fullWidth onClick={handleGoogleSignup} loading={googleLoading} type="button">
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-brand font-medium hover:underline">Log in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2 — Verify your email ── */}
          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Verify your email</h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-700">{maskEmail(formData.email)}</span>
              </p>

              <div className="space-y-6">
                <OtpInput value={otpValue} onChange={setOtpValue} error={otpError} />

                <p className="text-xs text-gray-400 text-center">
                  Can't find it? Check your spam or junk folder.
                </p>

                <Button
                  fullWidth
                  loading={submitting}
                  disabled={otpValue.length < 6}
                  onClick={handleOtpVerify}
                >
                  Verify email
                </Button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-400">Resend code in {countdown}s</p>
                  ) : (
                    <button onClick={resendOtp} className="text-sm text-brand font-medium hover:underline">
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
