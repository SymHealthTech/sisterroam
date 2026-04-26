import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ── Core ────────────────────────────────────────────────────────────────────

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Name / Avatar ───────────────────────────────────────────────────────────

export function getInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const AVATAR_PALETTE = [
  { bg: '#EEEDFE', text: '#5D1A8B' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#7F77DD', text: '#ffffff' },
  { bg: '#D4537E', text: '#ffffff' },
  { bg: '#1D9E75', text: '#ffffff' },
  { bg: '#5D1A8B', text: '#ffffff' },
]

export function generateAvatarColor(name) {
  if (!name) return AVATAR_PALETTE[0]
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

// ── Date / Time ─────────────────────────────────────────────────────────────

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function formatDateRange(checkIn, checkOut) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const opts = { month: 'short' }
  const startMonth = start.toLocaleString('en-GB', opts)
  const endMonth = end.toLocaleString('en-GB', opts)
  const year = end.getFullYear()

  if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${endMonth} ${year}`
  }
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${year}`
}

export function nightsBetween(checkIn, checkOut) {
  return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000)
}

// ── Content ─────────────────────────────────────────────────────────────────

export function calculateReadTime(content) {
  const words = content.trim().split(/\s+/).length
  const mins = Math.ceil(words / 200)
  return `${mins} min read`
}

// ── Validation ───────────────────────────────────────────────────────────────

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

// ── Currency ─────────────────────────────────────────────────────────────────

export function detectCurrency() {
  if (typeof navigator === 'undefined') return 'USD'
  return navigator.language === 'en-IN' ? 'INR' : 'USD'
}

export function formatCurrency(amount, currency = 'USD') {
  return currency === 'INR' ? `₹${amount}` : `$${amount}`
}

// ── Geo ──────────────────────────────────────────────────────────────────────

export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = [...countryCode.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// ── OTP ──────────────────────────────────────────────────────────────────────

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}
