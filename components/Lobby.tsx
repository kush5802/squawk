'use client'

import { useState, useEffect } from 'react'

export const ROOMS = [
  {
    id: 'fi-blr',
    name: 'FI BLR',
    description: 'Fixed Income — Bangalore Desk',
  },
  {
    id: 'fi-2025',
    name: 'FI 2025',
    description: 'Fixed Income — 2025 Coverage',
  },
]

interface LobbyProps {
  onSelectRoom: (roomId: string, roomName: string) => void
}

export default function Lobby({ onSelectRoom }: LobbyProps) {
  const [counts, setCounts] = useState<Record<string, number>>({ 'fi-blr': 0, 'fi-2025': 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/rooms')
        if (res.ok) setCounts(await res.json())
      } catch {}
      setLoading(false)
    }
    fetchCounts()
    // Refresh every 10 seconds
    const t = setInterval(fetchCounts, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--accent)', marginBottom: 8 }}>
          SQUAWK
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.15em' }}>
          SELECT A ROOM TO JOIN
        </div>
      </div>

      {/* Room cards */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 640 }}>
        {ROOMS.map(room => {
          const count = counts[room.id] ?? 0
          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id, room.name)}
              style={{
                flex: '1 1 260px', maxWidth: 300,
                background: 'var(--surface)', border: '1px solid var(--border)',
                padding: '28px 28px 24px', cursor: 'pointer',
                transition: 'all 0.15s', position: 'relative',
                borderTop: '2px solid var(--accent)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--accent)'
                el.style.background = 'rgba(232,200,74,0.04)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--surface)'
                el.style.borderTopColor = 'var(--accent)'
              }}
            >
              {/* Live dot */}
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className={count > 0 ? 'pulse-green' : ''} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: count > 0 ? 'var(--green)' : '#333',
                }} />
                <span style={{ fontSize: 10, color: count > 0 ? 'var(--green)' : '#444', letterSpacing: '0.08em' }}>
                  {loading ? '—' : count > 0 ? 'LIVE' : 'EMPTY'}
                </span>
              </div>

              {/* Room name */}
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text)', marginBottom: 8 }}>
                {room.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'IBM Plex Sans, sans-serif', marginBottom: 20, lineHeight: 1.5 }}>
                {room.description}
              </div>

              {/* Participant count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.06em' }}>
                  {loading ? '— online' : `${count} online`}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                  JOIN →
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 40, fontSize: 11, color: '#333', letterSpacing: '0.08em' }}>
        Counts refresh every 10 seconds
      </div>
    </div>
  )
}
