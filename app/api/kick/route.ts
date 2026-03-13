import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { room, identity, passcode } = await req.json()

  // Only squawkers can kick — verify passcode server-side
  const correctPasscode = process.env.SQUAWK_ROOM_PASSCODE
  if (!correctPasscode || passcode !== correctPasscode) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL
    ?.replace('wss://', 'https://')
    .replace('ws://', 'http://')

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    await svc.removeParticipant(room, identity)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
  }
}
