'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword,  setShowPassword]  = useState(false)
  const [authError,     setAuthError]     = useState('')
  const [loading,       setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit(data) {
    setLoading(true)
    setAuthError('')
    try {
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok) {
        setAuthError(
          result?.error === 'CredentialsSignin'
            ? 'Invalid email or password. Please try again.'
            : 'Login failed. Please try again.'
        )
        return
      }

      // Fetch fresh session to check onboardingCompleted
      const sessionRes  = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()

      if (sessionData?.user?.onboardingCompleted) {
        router.replace('/feed')
      } else {
        router.replace('/onboarding/profile')
      }
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    try {
      const result = await signIn('google', {
        callbackUrl: '/feed',
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'AccessDenied') {
          toast.error('Your account has been suspended. Contact support.')
        } else {
          toast.error('Google sign in failed. Please try again.')
        }
        setGoogleLoading(false)
        return
      }

      // Middleware will redirect to /onboarding/profile if onboarding incomplete
      router.push(result?.url || '/feed')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="stacked" theme="light" size="lg" href="/" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-4">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Error alert */}
          {authError && (
            <div className="flex items-start gap-2.5 bg-danger-lighter border border-danger/20 text-danger rounded-xl p-3.5 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Password <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <Link href="/forgot-password" className="text-xs text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  className={cn(
                    'w-full h-[44px] sm:h-[40px] px-3 pr-10 rounded-lg border bg-white text-sm',
                    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
                    errors.password ? 'border-danger' : 'border-gray-200',
                  )}
                  {...register('password', { required: 'Password is required' })}
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
              {errors.password && (
                <p className="text-xs text-danger mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Log in
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

          <Button variant="ghost" fullWidth onClick={handleGoogleLogin} loading={googleLoading} type="button">
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand font-medium hover:underline">Join free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
