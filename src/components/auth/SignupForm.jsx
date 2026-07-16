'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { trackSignupCompleted } from '@/lib/analytics'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Democratic Republic Of Congo', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]

const EDUCATION_OPTIONS = [
  { value: 'high_school',   label: 'High School'        },
  { value: 'undergraduate', label: 'Undergraduate'      },
  { value: 'graduate',      label: 'Graduate'           },
  { value: 'postgraduate',  label: 'Postgraduate'       },
  { value: 'phd',           label: 'PhD / Doctorate'    },
  { value: 'vocational',    label: 'Vocational / Diploma' },
  { value: 'other',         label: 'Other'              },
]

export default function SignupForm() {
  const [step, setStep] = useState('form')
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)

  const { register, handleSubmit, getValues, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { gender: 'female' },
  })

  const selectedCountry = watch('country')

  useEffect(() => {
    if (!selectedCountry) { setCities([]); return }
    setValue('city', '')
    setLoadingCities(true)
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: selectedCountry }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error && Array.isArray(data.data)) {
          setCities(data.data.sort())
        } else {
          setCities([])
        }
      })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [selectedCountry, setValue])

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

          {/* Gender — female only, pre-selected */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Gender</label>
            <div className="flex items-center gap-2 h-[44px] sm:h-[40px] px-3 rounded-lg border border-brand/40 bg-brand/5 text-sm text-brand font-medium select-none">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/>
              </svg>
              Female
            </div>
            <input type="hidden" value="female" {...register('gender')} />
          </div>

          {/* Education */}
          <Select
            label="Education"
            placeholder="Select education level"
            options={EDUCATION_OPTIONS}
            error={errors.education?.message}
            {...register('education', { required: 'Education is required' })}
          />

          {/* Country */}
          <Select
            label="Country"
            placeholder="Select your country"
            options={COUNTRIES.map(c => ({ value: c, label: c }))}
            error={errors.country?.message}
            {...register('country', { required: 'Country is required' })}
          />

          {/* City — appears after country is selected */}
          {selectedCountry && (
            loadingCities ? (
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">City</label>
                <div className="h-[44px] sm:h-[40px] rounded-lg border border-gray-200 bg-gray-50 flex items-center px-3 text-sm text-gray-400">
                  Loading cities…
                </div>
              </div>
            ) : cities.length > 0 ? (
              <Select
                label="City"
                placeholder="Select your city"
                options={cities.map(c => ({ value: c, label: c }))}
                error={errors.city?.message}
                {...register('city', { required: 'City is required' })}
              />
            ) : (
              <Input
                label="City"
                placeholder="Enter your city"
                error={errors.city?.message}
                {...register('city', { required: 'City is required' })}
              />
            )
          )}

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
    trackSignupCompleted()
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
