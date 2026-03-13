'use client'

import { useState } from 'react'
import { useParticipants } from '@livekit/components-react'

interface PresencePanelProps {
  myName: string
  myRole: 'listener' | 'squawker'
  roomId: string
  passcode: string // squawkers pass this so kick can be verified server-side
}

export default function PresencePanel({ myName, myRole, roomId, passcode }: PresencePanelProps) {
  const participants = useParticipants()
  const [kicking, setKicking] = useState<string | null>(null)

  const squawkers = participants.filter(p => p.identity.startsWith('squawker-'))
  const listeners = participants.filter(p => p.identity.startsWith('listener-'))

  function getDisplayName(p: typeof participants[0]): string {
    return p.name || p.identity.split('-').slice(1, -1).join(' ')
  }

  function isMe(p: typeof participants[0]): boolean {
    return p.name === myName
  }

  async function kickParticipant(identity: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from the room?`)) return
    setKicking(identity)
    try {
      await fetch('/api/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, identity, passcode }),
      })
    } catch {}
    setKicking(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
        color: 'var(--muted)', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span>Room</span>
        <span style={{ color: '#444' }}>{participants.length} online</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <GroupLabel label="Squawkers" count={squawkers.length} />
        {squawkers.length === 0 && <EmptyNote text="No squawkers online" />}
        {squawkers.map(p => (
          <ParticipantRow
            key={p.identity}
            name={getDisplayName(p)}
            role="squawker"
            speaking={p.isSpeaking}
            isMe={isMe(p)}
            canKick={myRole === 'squawker' && !isMe(p)}
            kicking={kicking === p.identity}
            onKick={() => kickParticipant(p.identity, getDisplayName(p))}
          />
        ))}

        <GroupLabel label="Listeners" count={listeners.length} />
        {listeners.length === 0 && <EmptyNote text="No listeners online" />}
        {listeners.map(p => (
          <ParticipantRow
            key={p.identity}
            name={getDisplayName(p)}
            role="listener"
            speaking={false}
            isMe={isMe(p)}
            canKick={myRole === 'squawker'}
            kicking={kicking === p.identity}
            onKick={() => kickParticipant(p.identity, getDisplayName(p))}
          />
        ))}
      </div>
    </div>
  )
}

function GroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      padding: '10px 16px 6px', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase',
      display: 'flex', justifyContent: 'space-between',
    }}>
      <span>{label}</span>
      <span style={{ color: '#444', fontWeight: 400 }}>{count}</span>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <div style={{ padding: '8px 16px', fontSize: 11, color: '#444', fontStyle: 'italic' }}>{text}</div>
}

function ParticipantRow({ name, role, speaking, isMe, canKick, kicking, onKick }: {
  name: string; role: string; speaking: boolean; isMe: boolean
  canKick: boolean; kicking: boolean; onKick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const ini = name.split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 16px', transition: 'background 0.1s',
        background: hovered ? '#0f0f0f' : 'transparent',
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 3, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
        background: role === 'squawker' ? 'rgba(232,200,74,0.15)' : 'rgba(74,232,122,0.1)',
        color: role === 'squawker' ? 'var(--accent)' : 'var(--green)',
      }}>
        {ini}
      </div>

      <div style={{ flex: 1, fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}{isMe && <span style={{ color: 'var(--muted)', fontSize: 10 }}> (you)</span>}
      </div>

      {/* Kick button — visible on hover for squawkers only, hidden for self */}
      {canKick && hovered && !kicking && (
        <button
          onClick={onKick}
          title={`Remove ${name}`}
          style={{
            background: 'none', border: '1px solid #3a1a1a',
            color: '#e84a4a', fontFamily: 'inherit', fontSize: 9,
            fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px',
            cursor: 'pointer', textTransform: 'uppercase', flexShrink: 0,
            borderRadius: 2,
          }}
        >
          REMOVE
        </button>
      )}
      {kicking && (
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>...</span>
      )}

      {/* Speaking dot */}
      {!hovered && (
        <div
          className={speaking ? 'pulse-red' : ''}
          style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: speaking ? 'var(--red)' : 'var(--green)',
          }}
        />
      )}
    </div>
  )
}
