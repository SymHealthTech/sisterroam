import { redirect } from 'next/navigation'

export default async function AppBlogPostPage({ params }) {
  const { slug } = await params
  redirect(`/blog/${slug}`)
}
