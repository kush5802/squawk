'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  useLocalParticipant,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

interface SquawkerRoomProps {
  myName: string
  onTransmitChange: (transmitting: boolean) => void
  transmitting: boolean
}

export default function SquawkerControls({ myName, onTransmitChange, transmitting }: SquawkerRoomProps) {
  const { localParticipant } = useLocalParticipant()
  const pressedRef = useRef(false)

  const startTransmit = useCallback(async () => {
    if (pressedRef.current) return
    pressedRef.current = true
    onTransmitChange(true)
    try {
      await localParticipant.setMicrophoneEnabled(true)
    } catch (e) {
      console.error('Mic error:', e)
      pressedRef.current = false
      onTransmitChange(false)
    }
  }, [localParticipant, onTransmitChange])

  const stopTransmit = useCallback(async () => {
    if (!pressedRef.current) return
    pressedRef.current = false
    onTransmitChange(false)
    try {
      await localParticipant.setMicrophoneEnabled(false)
    } catch (e) {
      console.error('Mic error:', e)
    }
  }, [localParticipant, onTransmitChange])

  // Keyboard PTT — Space bar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        startTransmit()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        stopTransmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [startTransmit, stopTransmit])

  // Ensure mic is off on mount
  useEffect(() => {
    localParticipant.setMicrophoneEnabled(false).catch(() => {})
  }, [localParticipant])

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
      <button
        className={transmitting ? 'ptt-active' : ''}
        onMouseDown={startTransmit}
        onMouseUp={stopTransmit}
        onMouseLeave={stopTransmit}
        onTouchStart={startTransmit}
        onTouchEnd={stopTransmit}
        style={{
          width: '100%', padding: '18px 20px',
          background: 'var(--surface2)', border: '2px solid var(--border)',
          color: 'var(--muted)', fontFamily: 'inherit', fontSize: 12,
          fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 14, userSelect: 'none',
          transition: 'all 0.06s ease', outline: 'none',
        }}
      >
        <span style={{ fontSize: 18 }}>{transmitting ? '🔴' : '🎙'}</span>
        <span>{transmitting ? 'BROADCASTING...' : 'HOLD TO BROADCAST'}</span>
        <span style={{
          background: transmitting ? 'rgba(232,74,74,0.3)' : 'var(--surface)',
          border: `1px solid ${transmitting ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 3, padding: '2px 8px', fontSize: 11,
          color: transmitting ? 'var(--red)' : 'var(--text)',
        }}>SPACE</span>
      </button>
      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 8, letterSpacing: '0.05em' }}>
        Hold SPACE or hold the button · Release to cut mic
      </div>
    </div>
  )
}
