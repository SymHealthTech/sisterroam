export async function GET(request) {
  return Response.json({ message: 'GET ok' })
}

export async function PATCH(request) {
  return Response.json({ message: 'PATCH ok' })
}

export async function DELETE(request) {
  return Response.json({ message: 'DELETE ok' })
}
