'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import ImageUpload from '@/components/ui/ImageUpload'

/* ── Static data ─────────────────────────────────────────── */

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahrain','Bangladesh','Belgium','Bolivia','Bosnia and Herzegovina',
  'Brazil','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark',
  'Dominican Republic','Ecuador','Egypt','Ethiopia','Finland','France','Georgia',
  'Germany','Ghana','Greece','Guatemala','Hungary','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kuwait','Kyrgyzstan','Laos','Lebanon','Libya','Lithuania','Luxembourg',
  'Malaysia','Maldives','Malta','Mexico','Moldova','Mongolia','Morocco',
  'Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua',
  'Nigeria','Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru',
  'Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia',
  'Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa',
  'South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Tunisia','Turkey','Turkmenistan',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
  'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const COMMON_LANGUAGES = [
  'English','Hindi','Spanish','French','Arabic','Portuguese','Bengali','Russian',
  'Urdu','Indonesian','German','Japanese','Mandarin','Telugu','Marathi','Tamil',
  'Turkish','Korean','Italian','Gujarati','Punjabi','Swahili','Dutch','Polish',
  'Vietnamese','Ukrainian','Romanian','Greek','Thai','Malay','Kannada','Malayalam',
]

const EDUCATION_OPTIONS = [
  { value: 'high_school',        label: 'High School'          },
  { value: 'undergraduate',      label: 'Undergraduate'        },
  { value: 'postgraduate',       label: 'Postgraduate'         },
  { value: 'doctorate',          label: 'Doctorate'            },
  { value: 'other',              label: 'Other'                },
  { value: 'prefer_not_to_say',  label: 'Prefer not to say'   },
]

const TRAVELLER_CATEGORIES = [
  { value: 'solo_traveller',  label: 'Solo Traveller'   },
  { value: 'backpacker',      label: 'Backpacker'        },
  { value: 'cyclist',         label: 'Cyclist'           },
  { value: 'trekker',         label: 'Trekker'           },
  { value: 'runner',          label: 'Runner'            },
  { value: 'ultramarathon',   label: 'Ultra Runner'      },
  { value: 'road_tripper',    label: 'Road Tripper'      },
  { value: 'family_tourist',  label: 'Family Traveller'  },
]

/* ── Sub-components ──────────────────────────────────────── */

function TagInput({ label, tags, onChange, suggestions = [], placeholder, required }) {
  const [inputVal,        setInputVal]        = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = suggestions
    .filter(s => s.toLowerCase().startsWith(inputVal.toLowerCase()) && !tags.includes(s))
    .slice(0, 5)

  function addTag(tag) {
    const t = tag.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInputVal('')
    setShowSuggestions(false)
  }

  function removeTag(tag) { onChange(tags.filter(t => t !== tag)) }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputVal.trim()) addTag(inputVal)
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="min-h-[44px] flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent transition-colors">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-brand-lighter text-brand text-xs px-2.5 py-1 rounded-full font-medium">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="text-brand/60 hover:text-brand leading-none" aria-label={`Remove ${t}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowSuggestions(true) }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm outline-none placeholder:text-gray-400 bg-transparent py-0.5"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-10 relative">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-1">Type and press Enter or comma to add</p>
    </div>
  )
}

function SearchableSelect({ label, value, onChange, options, placeholder, required }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref}>
      {label && (
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full h-[44px] sm:h-[40px] flex items-center justify-between px-3 rounded-lg border bg-white text-sm transition-colors',
          open ? 'ring-2 ring-brand border-transparent' : 'border-gray-200 hover:border-gray-300',
          value ? 'text-gray-900' : 'text-gray-400',
        )}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20 relative">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(o => (
              <button
                key={o}
                type="button"
                onClick={() => { onChange(o); setOpen(false); setSearch('') }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-gray-50', value === o && 'text-brand font-medium')}
              >
                {o}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-4 text-sm text-gray-400 text-center">No results</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function GenderCard({ value, label, emoji, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'flex-1 flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all text-sm font-medium',
        selected
          ? 'border-brand bg-brand-lighter text-brand'
          : 'border-gray-100 hover:border-gray-200 text-gray-600',
      )}
    >
      <span className="text-2xl">{emoji}</span>
      {label}
    </button>
  )
}

/* ── Page ────────────────────────────────────────────────── */

export default function OnboardingProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [saving,          setSaving]          = useState(false)
  const [showHobbies,     setShowHobbies]     = useState(false)
  const [showSocial,      setShowSocial]      = useState(false)
  const [bioLength,       setBioLength]       = useState(0)

  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [fullName,        setFullName]        = useState('')
  const [age,             setAge]             = useState('')
  const [gender,          setGender]          = useState('')
  const [city,            setCity]            = useState('')
  const [country,         setCountry]         = useState('')
  const [languages,       setLanguages]       = useState([])
  const [education,       setEducation]       = useState('')
  const [occupation,      setOccupation]      = useState('')
  const [bio,             setBio]             = useState('')
  const [countriesVisited,setCountriesVisited]= useState([])
  const [categories,      setCategories]      = useState([])
  const [hobbies,         setHobbies]         = useState([])
  const [instagram,       setInstagram]       = useState('')
  const [linkedin,        setLinkedin]        = useState('')
  const [facebook,        setFacebook]        = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
    if (session?.user) {
      setFullName(session.user.fullName ?? '')
      setProfilePhotoUrl(session.user.profilePhotoUrl ?? '')
    }
  }, [session, status, router])

  function toggleCategory(val) {
    setCategories(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    )
  }

  async function saveProfile(navigateAfter) {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          age:               age ? Number(age) : undefined,
          gender:            gender || undefined,
          city:              city || undefined,
          country:           country || undefined,
          languages,
          education:         education || undefined,
          occupation:        occupation || undefined,
          bio:               bio || undefined,
          countriesVisited,
          travellerCategories: categories,
          hobbies,
          instagramUrl:      instagram || undefined,
          linkedinUrl:       linkedin  || undefined,
          facebookUrl:       facebook  || undefined,
          profilePhotoUrl:   profilePhotoUrl || undefined,
          onboardingStep:    3,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save profile')
        return
      }
      router.push(navigateAfter)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleContinue() {
    if (!fullName.trim()) { toast.error('Full name is required'); return }
    if (!gender)          { toast.error('Please select your gender'); return }
    saveProfile('/onboarding/role')
  }

  if (status === 'loading') return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-brand">SisterRoam</span>
            <span className="text-pink" aria-hidden="true">♀</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Step 2 of 3</span>
            <div className="flex gap-1">
              {[1,2,3].map(s => (
                <div key={s} className={cn('w-5 h-1.5 rounded-full', s <= 2 ? 'bg-brand' : 'bg-gray-200')} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Build your profile</h1>
        <p className="text-sm text-gray-500 mb-8">Help the community get to know you</p>

        <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleContinue() }}>

          {/* Profile photo */}
          <div className="flex flex-col items-center">
            <ImageUpload
              currentImageUrl={profilePhotoUrl}
              name={fullName}
              onUploadComplete={({ url }) => setProfilePhotoUrl(url)}
            />
            <p className="text-xs text-gray-400 mt-2">Add a clear photo of yourself</p>
          </div>

          {/* Full name */}
          <Input
            label="Full name"
            name="fullName"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your real name"
          />

          {/* Age */}
          <Input
            label="Age"
            name="age"
            type="number"
            required
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="e.g. 28"
            min={18}
            max={99}
          />

          {/* Gender */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Gender <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              <GenderCard value="female"     label="Female"     emoji="♀️"  selected={gender === 'female'}     onClick={setGender} />
              <GenderCard value="non-binary" label="Non-binary" emoji="⚧️"  selected={gender === 'non-binary'} onClick={setGender} />
              <GenderCard value="other"      label="Other"      emoji="🌈"  selected={gender === 'other'}      onClick={setGender} />
            </div>
          </div>

          {/* City */}
          <Input
            label="Home city"
            name="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
          />

          {/* Country */}
          <SearchableSelect
            label="Home country"
            value={country}
            onChange={setCountry}
            options={COUNTRIES}
            placeholder="Select your country"
          />

          {/* Languages */}
          <TagInput
            label="Languages spoken"
            tags={languages}
            onChange={setLanguages}
            suggestions={COMMON_LANGUAGES}
            placeholder="Type a language and press Enter…"
          />

          {/* Education */}
          <Select
            label="Education"
            name="education"
            value={education}
            onChange={e => setEducation(e.target.value)}
            placeholder="Select education level"
            options={EDUCATION_OPTIONS}
          />

          {/* Occupation */}
          <Input
            label="Occupation"
            name="occupation"
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            placeholder="e.g. Software engineer (optional)"
          />

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">About you</label>
              <span className={cn('text-[11px]', bioLength > 480 ? 'text-amber' : 'text-gray-400')}>
                {bioLength}/500
              </span>
            </div>
            <Textarea
              name="bio"
              value={bio}
              rows={3}
              placeholder="Tell hosts and guests a little about yourself…"
              maxLength={500}
              onChange={e => { setBio(e.target.value); setBioLength(e.target.value.length) }}
            />
          </div>

          {/* Countries visited */}
          <TagInput
            label="Countries visited"
            tags={countriesVisited}
            onChange={setCountriesVisited}
            suggestions={COUNTRIES}
            placeholder="Type a country and press Enter…"
          />

          {/* Traveller categories */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Traveller type</label>
            <div className="flex flex-wrap gap-2">
              {TRAVELLER_CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleCategory(value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all',
                    categories.includes(value)
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowHobbies(v => !v)}
              className="flex items-center gap-1.5 text-sm text-brand font-medium"
            >
              <ChevronRight className={cn('w-4 h-4 transition-transform', showHobbies && 'rotate-90')} />
              {showHobbies ? 'Hide hobbies & interests' : 'Add hobbies & interests'}
            </button>
            {showHobbies && (
              <div className="mt-3">
                <TagInput
                  tags={hobbies}
                  onChange={setHobbies}
                  placeholder="e.g. Photography, Yoga, Cooking…"
                />
              </div>
            )}
          </div>

          {/* Social links — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowSocial(v => !v)}
              className="flex items-center gap-1.5 text-sm text-brand font-medium"
            >
              <ChevronRight className={cn('w-4 h-4 transition-transform', showSocial && 'rotate-90')} />
              {showSocial ? 'Hide social links' : 'Add social media links'}
            </button>
            {showSocial && (
              <div className="mt-3 space-y-3">
                <Input
                  label="Instagram"
                  name="instagram"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
                <Input
                  label="LinkedIn"
                  name="linkedin"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                />
                <Input
                  label="Facebook"
                  name="facebook"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourname"
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Sticky footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto space-y-2">
          <Button fullWidth loading={saving} onClick={handleContinue}>
            Continue
          </Button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveProfile('/onboarding/role')}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 text-center transition-colors"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  )
}
