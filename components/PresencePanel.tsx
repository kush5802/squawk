'use client'

import { useParticipants } from '@livekit/components-react'

interface PresencePanelProps {
  myName: string
  myRole: 'listener' | 'squawker'
}

export default function PresencePanel({ myName, myRole }: PresencePanelProps) {
  const participants = useParticipants()

  const squawkers = participants.filter(p => p.identity.startsWith('squawker-'))
  const listeners = participants.filter(p => p.identity.startsWith('listener-'))

  function getDisplayName(identity: string, name: string | undefined): string {
    return name || identity.split('-').slice(1, -1).join(' ')
  }

  function isSpeaking(p: typeof participants[0]): boolean {
    return p.isSpeaking
  }

  function initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
      {/* Header */}
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
        {/* Squawkers */}
        <GroupLabel label="Squawkers" count={squawkers.length} />
        {squawkers.length === 0 && (
          <div style={{ padding: '10px 16px', fontSize: 11, color: '#444', fontStyle: 'italic' }}>No squawkers online</div>
        )}
        {squawkers.map(p => (
          <ParticipantRow
            key={p.identity}
            name={getDisplayName(p.identity, p.name)}
            role="squawker"
            speaking={isSpeaking(p)}
            isMe={p.name === myName && myRole === 'squawker'}
          />
        ))}

        {/* Listeners */}
        <GroupLabel label="Listeners" count={listeners.length} />
        {listeners.length === 0 && (
          <div style={{ padding: '10px 16px', fontSize: 11, color: '#444', fontStyle: 'italic' }}>No listeners online</div>
        )}
        {listeners.map(p => (
          <ParticipantRow
            key={p.identity}
            name={getDisplayName(p.identity, p.name)}
            role="listener"
            speaking={false}
            isMe={p.name === myName && myRole === 'listener'}
          />
        ))}
      </div>
    </div>
  )
}

function GroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      padding: '10px 16px 6px',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
      color: 'var(--muted)', textTransform: 'uppercase',
      display: 'flex', justifyContent: 'space-between',
    }}>
      <span>{label}</span>
      <span style={{ color: '#444', fontWeight: 400 }}>{count}</span>
    </div>
  )
}

function ParticipantRow({ name, role, speaking, isMe }: {
  name: string; role: string; speaking: boolean; isMe: boolean
}) {
  const ini = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', transition: 'background 0.12s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        background: role === 'squawker' ? 'rgba(232,200,74,0.15)' : 'rgba(74,232,122,0.1)',
        color: role === 'squawker' ? 'var(--accent)' : 'var(--green)',
      }}>
        {ini}
      </div>
      <div style={{ flex: 1, fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--text)' }}>
        {name}{isMe ? <span style={{ color: 'var(--muted)', fontSize: 10 }}> (you)</span> : ''}
      </div>
      <div
        className={speaking ? 'pulse-red' : ''}
        style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: speaking ? 'var(--red)' : 'var(--green)',
          transition: 'background 0.2s',
        }}
      />
    </div>
  )
}
