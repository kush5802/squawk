'use client'

import { useState } from 'react'

interface JoinModalProps {
  roomId: string
  roomName: string
  onJoin: (name: string, role: 'listener' | 'squawker', token: string) => void
  onBack: () => void
}

export default function JoinModal({ roomId, roomName, onJoin, onBack }: JoinModalProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'listener' | 'squawker'>('listener')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Please enter your name'); return }
    if (role === 'squawker' && !passcode.trim()) { setError('Squawkers need the passcode'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/livekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, role, passcode: passcode.trim(), room: roomId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join')
        setLoading(false)
        return
      }

      onJoin(trimmed, role, data.token)
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        width: 420, padding: 40, position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.1em',
            cursor: 'pointer', padding: 0, marginBottom: 20, textTransform: 'uppercase',
          }}
        >
          ← BACK TO ROOMS
        </button>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 4 }}>
          {roomName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 28 }}>
          SQUAWK / FLASH NEWS TERMINAL
        </div>

        {/* Name */}
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', marginBottom: 8 }}>
          YOUR NAME
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="e.g. John Smith"
          maxLength={30}
          autoFocus
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'inherit', fontSize: 14,
            padding: '11px 14px', marginBottom: 24, outline: 'none', letterSpacing: '0.05em',
          }}
        />

        {/* Role */}
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', marginBottom: 10 }}>
          JOIN AS
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {(['listener', 'squawker'] as const).map(r => (
            <div
              key={r}
              onClick={() => { setRole(r); setError('') }}
              style={{
                padding: '16px', cursor: 'pointer', transition: 'all 0.12s',
                border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`,
                background: role === r ? 'rgba(232,200,74,0.05)' : 'var(--bg)',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{r === 'listener' ? '🎧' : '🎙️'}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4, textTransform: 'capitalize' }}>{r}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.5 }}>
                {r === 'listener' ? 'Receive audio only. Cannot broadcast.' : 'Broadcast headlines. Hold SPACE to transmit.'}
              </div>
            </div>
          ))}
        </div>

        {/* Passcode (squawker only) */}
        {role === 'squawker' && (
          <>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--muted)', marginBottom: 8 }}>
              SQUAWKER PASSCODE
            </label>
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter passcode"
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 14,
                padding: '11px 14px', marginBottom: 24, outline: 'none',
              }}
            />
          </>
        )}

        {error && (
          <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 16, letterSpacing: '0.05em' }}>
            ⚠ {error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', border: 'none',
            background: loading ? '#555' : 'var(--accent)',
            color: '#0a0a0a', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'CONNECTING...' : `→ JOIN ${roomName}`}
        </button>
      </div>
    </div>
  )
}
