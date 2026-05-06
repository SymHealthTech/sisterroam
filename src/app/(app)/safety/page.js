'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import SosButton from '@/components/safety/SosButton'
import Avatar from '@/components/ui/Avatar'
import {
  Shield, CheckCircle, Clock, Circle, XCircle,
  ChevronDown, ChevronRight, Phone, AlertTriangle,
  MapPin, User, Edit2,
} from 'lucide-react'
import { cn, formatDateRange } from '@/lib/utils'
import toast from 'react-hot-toast'

/* ─── Constants ─────────────────────────────────────────────── */

const RELATIONSHIPS = ['Partner', 'Spouse', 'Parent', 'Sibling', 'Friend', 'Colleague', 'Other']

const SAFETY_TIPS = [
  {
    title: 'Before you arrive',
    tips: [
      'Share your travel itinerary with someone you trust.',
      "Research your host's profile and read their reviews carefully.",
      'Save local emergency numbers for your destination.',
      "Tell a friend or family member your host's full name and address.",
      'Ensure your phone is charged and your charger is packed.',
    ],
  },
  {
    title: 'When you arrive',
    tips: [
      'Note your surroundings, nearby exits, and public spaces.',
      "Text your emergency contact that you've arrived safely.",
      'Use the check-in button in the app to confirm your safe arrival.',
      "Trust your instincts — if something feels wrong, it's okay to leave.",
    ],
  },
  {
    title: 'During your stay',
    tips: [
      'Keep your valuables secure and your passport on your person.',
      "Don't share personal financial details with your host.",
      'Check in with the app daily — your safety matters to us.',
      'Be cautious about sharing your precise location with strangers.',
    ],
  },
  {
    title: 'If you feel uncomfortable',
    tips: [
      "Trust your instincts — you don't need a reason to leave.",
      'Politely excuse yourself if you can; your safety comes first.',
      'Contact a trusted friend or family member right away.',
      'Use the SOS button in a genuine emergency.',
      'You can always report a concern confidentially to SisterRoam.',
    ],
  },
  {
    title: 'In an emergency',
    tips: [
      'Call local emergency services immediately — 100 (India) / 911 (US) / 112 (EU).',
      'Activate the SOS button above to alert your emergency contact and the SisterRoam team.',
      'Get to a safe, public place before calling for help if possible.',
    ],
  },
]

/* ─── CheckinRow ─────────────────────────────────────────────── */

function CheckinRow({ checkin, onConfirm }) {
  const now       = new Date()
  const scheduled = new Date(checkin.scheduledAt)

  let status
  if (checkin.confirmedAt)        status = 'done'
  else if (checkin.isMissed)      status = 'missed'
  else if (scheduled <= now)      status = 'pending'
  else                            status = 'upcoming'

  const TYPE_LABELS = { arrival: 'Arrival check-in', morning: 'Morning check-in', departure: 'Departure check-in' }
  const timeStr = scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const confirmedStr = checkin.confirmedAt
    ? new Date(checkin.confirmedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  const statusColor = {
    done:     'text-teal-dark',
    pending:  'text-amber-dark',
    upcoming: 'text-gray-400',
    missed:   'text-danger-dark',
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      {status === 'done'     && <CheckCircle className="w-5 h-5 text-teal shrink-0" />}
      {status === 'pending'  && <Clock className="w-5 h-5 text-amber shrink-0" />}
      {status === 'upcoming' && <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
      {status === 'missed'   && <XCircle className="w-5 h-5 text-danger shrink-0" />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{TYPE_LABELS[checkin.checkinType]}</p>
        <p className={cn('text-xs mt-0.5', statusColor[status])}>
          {status === 'done'     && `Confirmed at ${confirmedStr}`}
          {status === 'pending'  && `Expected by ${timeStr}`}
          {status === 'upcoming' && `Scheduled for ${timeStr}`}
          {status === 'missed'   && 'Missed — alert sent to emergency contact'}
        </p>
      </div>

      {status === 'pending' && (
        <button
          onClick={() => onConfirm(checkin._id, checkin.checkinType)}
          className="text-xs font-medium text-teal bg-teal-lighter px-3 py-1.5 rounded-lg whitespace-nowrap
                     hover:opacity-90 transition-opacity active:scale-95"
        >
          Confirm now
        </button>
      )}
    </div>
  )
}

/* ─── AccordionSection ───────────────────────────────────────── */

function AccordionSection({ title, tips, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-0 text-left"
      >
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <ChevronDown
          className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180')}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: isOpen ? tips.length * 64 + 'px' : '0px' }}
      >
        <ul className="pb-4 space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-light shrink-0 mt-1.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─── SOS Modal ──────────────────────────────────────────────── */

function SosModal({ alertId, coords, emergencyContactName, onCancel, onKeepActive }) {
  const [cancelling, setCancelling] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    try {
      await fetch('/api/safety/sos/cancel', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ alertId }),
      })
    } catch {
      // ignore — still close modal
    }
    setCancelling(false)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-danger px-6">
      <Shield className="w-16 h-16 text-white mb-5 opacity-90" />
      <h2 className="text-2xl font-bold text-white text-center mb-3">SOS Alert Sent</h2>
      <p className="text-white/80 text-center text-sm max-w-xs leading-relaxed mb-2">
        {emergencyContactName
          ? `Your location has been sent to ${emergencyContactName} and the SisterRoam safety team.`
          : 'Your alert has been sent to the SisterRoam safety team.'}
      </p>
      {!coords && (
        <p className="text-white/60 text-xs text-center mb-2">
          Location unavailable — alert sent without location.
        </p>
      )}

      <div className="w-full max-w-xs mt-8 space-y-3">
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-3.5 border-2 border-white text-white rounded-xl font-medium
                     hover:bg-white/10 transition-colors disabled:opacity-60"
        >
          {cancelling ? 'Cancelling…' : 'I am safe — cancel alert'}
        </button>
        <button
          onClick={onKeepActive}
          className="w-full py-3.5 bg-white text-danger rounded-xl font-medium
                     hover:bg-white/90 transition-colors"
        >
          I need help — keep alert active
        </button>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function SafetyPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [activeRequest, setActiveRequest] = useState(null)
  const [checkins, setCheckins]           = useState([])
  const [user, setUser]                   = useState(null)
  const [loading, setLoading]             = useState(true)

  const [emergencyOpen,  setEmergencyOpen]  = useState(false)
  const [contactForm,    setContactForm]    = useState({ name: '', phone: '', relationship: '', email: '' })
  const [savingContact,  setSavingContact]  = useState(false)

  const [sosModal,  setSosModal]  = useState(null)  // { alertId, coords } | null
  const [sosCoords, setSosCoords] = useState(null)

  const [openAccordions, setOpenAccordions] = useState([])

  const geoRequestedRef = useRef(false)

  /* ── Fetch data ── */
  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [reqRes, userRes] = await Promise.all([
        fetch('/api/requests?activeToday=true'),
        fetch('/api/users'),
      ])
      const [reqJson, userJson] = await Promise.all([reqRes.json(), userRes.json()])

      const active = reqJson.success && reqJson.data?.length ? reqJson.data[0] : null
      setActiveRequest(active)
      if (userJson.success) {
        setUser(userJson.data)
        setContactForm({
          name:         userJson.data.emergencyContactName         ?? '',
          phone:        userJson.data.emergencyContactPhone        ?? '',
          relationship: userJson.data.emergencyContactRelationship ?? '',
          email:        userJson.data.emergencyContactEmail        ?? '',
        })
      }

      if (active) {
        const cr   = await fetch(`/api/safety/checkins?requestId=${active._id}`)
        const cj   = await cr.json()
        setCheckins(cj.success ? cj.data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  /* ── Pre-fetch geolocation on mount for faster SOS ── */
  useEffect(() => {
    if (geoRequestedRef.current) return
    if (typeof window === 'undefined' || !navigator.geolocation) return
    geoRequestedRef.current = true
    navigator.geolocation.getCurrentPosition(
      pos => setSosCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setSosCoords(null),
      { enableHighAccuracy: true, maximumAge: 30000 }
    )
  }, [])

  /* ── SOS handler ── */
  async function handleSosActivate() {
    let coords = null
    if (navigator.geolocation) {
      await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => { coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve() },
          () => resolve(),
          { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
        )
      })
    }
    if (!coords) coords = sosCoords

    try {
      const res  = await fetch('/api/safety/sos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coordinates: coords || null, requestId: activeRequest?._id }),
      })
      const json = await res.json()
      if (json.success) {
        setSosModal({ alertId: json.data.alertId, coords })
      } else {
        toast.error('Could not send SOS. Please call emergency services directly.')
      }
    } catch {
      toast.error('Could not send SOS. Please call emergency services directly.')
    }
  }

  /* ── Checkin confirm ── */
  async function handleConfirmCheckin(checkinId, checkinType) {
    const res  = await fetch('/api/safety/checkins/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ requestId: activeRequest._id, checkinType }),
    })
    const json = await res.json()
    if (json.success) {
      setCheckins(prev => prev.map(c =>
        c._id === checkinId ? { ...c, confirmedAt: new Date().toISOString() } : c
      ))
      toast.success('Check-in confirmed! Stay safe.')
    } else {
      toast.error('Could not confirm check-in.')
    }
  }

  /* ── Save emergency contact ── */
  async function handleSaveContact(e) {
    e.preventDefault()
    setSavingContact(true)
    const res  = await fetch('/api/users', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        emergencyContactName:         contactForm.name,
        emergencyContactPhone:        contactForm.phone,
        emergencyContactRelationship: contactForm.relationship,
        emergencyContactEmail:        contactForm.email,
      }),
    })
    const json = await res.json()
    setSavingContact(false)
    if (json.success) {
      setUser(json.data)
      setEmergencyOpen(false)
      toast.success('Emergency contact saved.')
    } else {
      toast.error('Could not save emergency contact.')
    }
  }

  /* ── Accordion toggle ── */
  function toggleAccordion(idx) {
    setOpenAccordions(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const host = activeRequest?.hostId

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <AppLayout title="Safety">
      {/* SOS confirmation modal — full screen, rendered outside normal flow */}
      {sosModal && (
        <SosModal
          alertId={sosModal.alertId}
          coords={sosModal.coords}
          emergencyContactName={user?.emergencyContactName}
          onCancel={() => setSosModal(null)}
          onKeepActive={() => setSosModal(null)}
        />
      )}

      <div className="max-w-[720px] mx-auto px-4 py-6 space-y-5">

        {/* ── Active Stay ──────────────────────────────────────── */}
        {!loading && activeRequest && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex gap-0">
              <div className="w-1 bg-teal shrink-0" />
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-teal shrink-0" />
                  <p className="text-xs font-medium text-teal-dark uppercase tracking-wide">Active stay</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar src={host?.profilePhotoUrl} name={host?.fullName} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Staying with {host?.fullName ?? 'your host'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {host?.city && `${host.city} · `}
                      {formatDateRange(activeRequest.checkInDate, activeRequest.checkOutDate)}
                    </p>
                  </div>
                </div>

                {/* Check-in Timeline */}
                {checkins.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Check-in timeline
                    </p>
                    {checkins.map(c => (
                      <CheckinRow key={c._id} checkin={c} onConfirm={handleConfirmCheckin} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SOS Section ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-danger" />
            <h2 className="text-sm font-semibold text-gray-900">Emergency SOS Button</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Hold the button for 3 seconds to send your location and an emergency alert to your
            emergency contact and the SisterRoam safety team.
          </p>

          {!loading && user && !user.emergencyContactEmail && (
            <div className="flex items-start gap-2.5 bg-amber-lighter rounded-xl p-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber-dark leading-relaxed">
                No emergency contact email set — SOS will only notify the SisterRoam safety team.{' '}
                <button
                  onClick={() => { setEmergencyOpen(true); document.getElementById('emergency-contact-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="underline font-medium"
                >
                  Add one below
                </button>
                {' '}for full protection.
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <SosButton onActivate={handleSosActivate} />
            <p className="text-xs text-gray-400 text-center">Hold for 3 seconds to activate</p>
          </div>
        </div>

        {/* ── Emergency Contact ─────────────────────────────────── */}
        <div id="emergency-contact-section" className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand" />
              <h2 className="text-sm font-semibold text-gray-900">Emergency Contact</h2>
            </div>
            {user?.emergencyContactName && !emergencyOpen && (
              <button
                onClick={() => setEmergencyOpen(true)}
                className="text-xs text-brand font-medium flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {!user?.emergencyContactName && !emergencyOpen && (
            <div className="flex items-start gap-3 bg-amber-lighter rounded-xl p-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <p className="text-xs text-amber-dark leading-relaxed">
                Add an emergency contact so we can alert them if you activate SOS.
              </p>
            </div>
          )}

          {user?.emergencyContactName && !emergencyOpen && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Name</span>
                <span className="text-xs font-medium text-gray-800">{user.emergencyContactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Phone</span>
                <span className="text-xs font-medium text-gray-800">{user.emergencyContactPhone || '—'}</span>
              </div>
              {user.emergencyContactEmail && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Email</span>
                  <span className="text-xs font-medium text-gray-800">{user.emergencyContactEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Relationship</span>
                <span className="text-xs font-medium text-gray-800">{user.emergencyContactRelationship || '—'}</span>
              </div>
            </div>
          )}

          {(emergencyOpen || !user?.emergencyContactName) && (
            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone (with country code) *</label>
                <input
                  required
                  value={contactForm.phone}
                  onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(used to send SOS alerts)</span>
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Relationship *</label>
                <select
                  required
                  value={contactForm.relationship}
                  onChange={e => setContactForm(p => ({ ...p, relationship: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand
                             transition-colors bg-white"
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingContact}
                  className="flex-1 py-2.5 bg-brand text-white text-sm font-medium rounded-xl
                             hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {savingContact ? 'Saving…' : 'Save contact'}
                </button>
                {emergencyOpen && (
                  <button
                    type="button"
                    onClick={() => setEmergencyOpen(false)}
                    className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl
                               hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* ── Report Section ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-amber" />
            <h2 className="text-sm font-semibold text-gray-900">Safety Concern?</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            All reports are reviewed by our safety team within 24 hours and treated confidentially.
          </p>
          <Link
            href="/safety/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-danger-lighter text-danger
                       text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Make a report <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Safety Tips Accordion ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Safety Tips</h2>
          <p className="text-xs text-gray-400 mb-3">Tap a section to expand.</p>
          {SAFETY_TIPS.map((section, idx) => (
            <AccordionSection
              key={idx}
              title={section.title}
              tips={section.tips}
              isOpen={openAccordions.includes(idx)}
              onToggle={() => toggleAccordion(idx)}
            />
          ))}
        </div>

      </div>
    </AppLayout>
  )
}
