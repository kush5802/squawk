import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { name, role, passcode } = await req.json()

  if (!name || !role) {
    return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
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

  const roomName = 'squawk-main'
  const identity = `${role}-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: '8h',
  })

  // Listeners can only subscribe (receive audio), not publish
  // Squawkers can publish (send audio) and subscribe
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: role === 'squawker',
    canSubscribe: true,
    canPublishData: role === 'squawker',
  })

  const token = await at.toJwt()

  return NextResponse.json({ token, identity, roomName })
}
