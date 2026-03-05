import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { name, role, passcode, room } = await req.json()

  if (!name || !role || !room) {
    return NextResponse.json({ error: 'Name, role and room are required' }, { status: 400 })
  }

  // Validate room is one of the allowed rooms
  const allowedRooms = ['fi-blr', 'fi-2025']
  if (!allowedRooms.includes(room)) {
    return NextResponse.json({ error: 'Invalid room' }, { status: 400 })
  }

  // Squawkers must provide the correct passcode
  if (role === 'squawker') {
    const correctPasscode = process.env.SQUAWK_ROOM_PASSCODE
    if (!correctPasscode || passcode !== correctPasscode) {
      return NextResponse.json({ error: 'Invalid squawker passcode' }, { status: 403 })
    }
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit not configured' }, { status: 500 })
  }

  const identity = `${role}-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: '8h',
  })

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: role === 'squawker',
    canSubscribe: true,
    canPublishData: true, // both roles can send chat data
  })

  const token = await at.toJwt()
  return NextResponse.json({ token, identity, roomName: room })
}
