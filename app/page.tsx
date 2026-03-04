'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import JoinModal from '@/components/JoinModal'

// Room uses WebRTC APIs — must be client-side only
const Room = dynamic(() => import('@/components/Room'), { ssr: false })

export default function Page() {
  const [session, setSession] = useState<{
    token: string
    name: string
    role: 'listener' | 'squawker'
  } | null>(null)

  function handleJoin(name: string, role: 'listener' | 'squawker', token: string) {
    setSession({ token, name, role })
  }

  function handleLeave() {
    setSession(null)
  }

  return (
    <main>
      {!session ? (
        <JoinModal onJoin={handleJoin} />
      ) : (
        <Room
          token={session.token}
          myName={session.name}
          myRole={session.role}
          onLeave={handleLeave}
        />
      )}
    </main>
  )
}
