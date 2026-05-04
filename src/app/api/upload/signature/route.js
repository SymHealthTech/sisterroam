import { auth } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'

export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') ?? 'sisterroam'
    const type   = searchParams.get('type') ?? ''
    const tags   = type ? [type] : []

    const payload = await generateUploadSignature(folder, tags)
    return Response.json(payload)
  } catch (err) {
    console.error('[GET /api/upload/signature]:', err.message)
    return Response.json({ error: 'Failed to generate upload signature' }, { status: 500 })
  }
}
