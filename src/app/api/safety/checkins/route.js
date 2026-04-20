export async function GET(request) {
  return Response.json({ message: 'GET ok' })
}

export async function POST(request) {
  return Response.json({ message: 'POST ok' })
}
