import { redirect } from 'next/navigation'

export default async function AppStoryPage({ params }) {
  const { slug } = await params
  redirect(`/stories/${slug}`)
}
