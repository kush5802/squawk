'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Lobby from '@/components/Lobby'
import JoinModal from '@/components/JoinModal'

const Room = dynamic(() => import('@/components/Room'), { ssr: false })

type Stage = 'lobby' | 'join' | 'room'

export default function Page() {
  const [stage, setStage] = useState<Stage>('lobby')
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null)
  const [session, setSession] = useState<{ token: string; name: string; role: 'listener' | 'squawker'; roomId: string; roomName: string } | null>(null)

  function handleSelectRoom(roomId: string, roomName: string) {
    setSelectedRoom({ id: roomId, name: roomName })
    setStage('join')
  }

  function handleJoin(name: string, role: 'listener' | 'squawker', token: string) {
    if (!selectedRoom) return
    setSession({ token, name, role, roomId: selectedRoom.id, roomName: selectedRoom.name })
    setStage('room')
  }

  function handleLeave() {
    setSession(null)
    setSelectedRoom(null)
    setStage('lobby')
  }

  function handleBack() {
    setSelectedRoom(null)
    setStage('lobby')
  }

  return (
    <main>
      {stage === 'lobby' && (
        <Lobby onSelectRoom={handleSelectRoom} />
      )}
      {stage === 'join' && selectedRoom && (
        <>
          {/* Show lobby dimmed behind modal */}
          <Lobby onSelectRoom={() => {}} />
          <JoinModal
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
            onJoin={handleJoin}
            onBack={handleBack}
          />
        </>
      )}
      {stage === 'room' && session && (
        <Room
          token={session.token}
          myName={session.name}
          myRole={session.role}
          roomName={session.roomName}
          onLeave={handleLeave}
        />
      )}
    </main>
  )
}
