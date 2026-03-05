import { NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL
    ?.replace('wss://', 'https://')
    .replace('ws://', 'http://')

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ 'fi-blr': 0, 'fi-2025': 0 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    const rooms = await svc.listRooms()
    const counts: Record<string, number> = { 'fi-blr': 0, 'fi-2025': 0 }
    for (const r of rooms) {
      if (r.name in counts) counts[r.name] = r.numParticipants
    }
    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({ 'fi-blr': 0, 'fi-2025': 0 })
  }
}
