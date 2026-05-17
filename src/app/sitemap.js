import { connectDB } from '@/lib/mongodb'
import TravelStory from '@/models/TravelStory'

const BASE = 'https://sisterroam.com'

const STATIC_PAGES = [
  { url: BASE,                   lastModified: '2026-05-01', changeFrequency: 'weekly',  priority: 1.0 },
  { url: `${BASE}/about`,        lastModified: '2026-05-01', changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/stories`,      lastModified: '2026-05-01', changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE}/browse`,       lastModified: '2026-05-01', changeFrequency: 'daily',   priority: 0.8 },
  { url: `${BASE}/pricing`,      lastModified: '2026-05-01', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/how-it-works`, lastModified: '2026-05-01', changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/privacy`,      lastModified: '2026-05-01', changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${BASE}/terms`,        lastModified: '2026-05-01', changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${BASE}/cookies`,      lastModified: '2026-05-01', changeFrequency: 'yearly',  priority: 0.3 },
]

export default async function sitemap() {
  try {
    await connectDB()

    const stories = await TravelStory.find({ isPublished: true })
      .select('slug updatedAt')
      .lean()

    const storyPages = stories.map((s) => ({
      url:             `${BASE}/stories/${s.slug}`,
      lastModified:    s.updatedAt?.toISOString().split('T')[0] ?? '2026-05-01',
      changeFrequency: 'monthly',
      priority:        0.6,
    }))

    return [...STATIC_PAGES, ...storyPages]
  } catch {
    return STATIC_PAGES
  }
}
