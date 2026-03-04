'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'

interface SquawkerControlsProps {
  myName: string
  onTransmitChange: (transmitting: boolean) => void
  transmitting: boolean
  muted: boolean
  onMuteToggle: () => void
}

export default function SquawkerControls({
  myName, onTransmitChange, transmitting, muted, onMuteToggle
}: SquawkerControlsProps) {
  const { localParticipant } = useLocalParticipant()
  const pressedRef = useRef(false)
  const [showMuteWarning, setShowMuteWarning] = useState(false)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showWarning = useCallback(() => {
    setShowMuteWarning(true)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setShowMuteWarning(false), 2500)
  }, [])

  const startTransmit = useCallback(async () => {
    if (pressedRef.current) return
    if (muted) { showWarning(); return }
    pressedRef.current = true
    onTransmitChange(true)
    try {
      await localParticipant.setMicrophoneEnabled(true)
    } catch (e) {
      console.error('Mic error:', e)
      pressedRef.current = false
      onTransmitChange(false)
    }
  }, [localParticipant, onTransmitChange, muted, showWarning])

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

  // If muted mid-broadcast, force stop immediately
  useEffect(() => {
    if (muted && pressedRef.current) stopTransmit()
  }, [muted, stopTransmit])

  // Keyboard PTT — Space bar (ignored if typing in chat)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' && !e.repeat &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
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
    <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>

      {/* Mute warning popup */}
      {showMuteWarning && (
        <div style={{
          marginBottom: 10, padding: '10px 14px',
          background: 'rgba(232,74,74,0.12)', border: '1px solid var(--red)',
          borderRadius: 3, fontSize: 12, color: 'var(--red)',
          fontWeight: 600, letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🔇 You are muted — click UNMUTE before broadcasting
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {/* PTT button */}
        <button
          className={transmitting ? 'ptt-active' : ''}
          onMouseDown={startTransmit}
          onMouseUp={stopTransmit}
          onMouseLeave={stopTransmit}
          onTouchStart={startTransmit}
          onTouchEnd={stopTransmit}
          style={{
            flex: 1, padding: '16px 12px',
            background: muted ? '#0f0f0f' : 'var(--surface2)',
            border: `2px solid ${muted ? '#1e1e1e' : 'var(--border)'}`,
            color: muted ? '#3a3a3a' : 'var(--muted)',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: muted ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            userSelect: 'none', transition: 'all 0.06s ease', outline: 'none',
          }}
        >
          <span style={{ fontSize: 16 }}>{transmitting ? '🔴' : muted ? '🚫' : '🎙'}</span>
          <span>{transmitting ? 'BROADCASTING...' : muted ? 'MUTED' : 'HOLD TO BROADCAST'}</span>
          {!muted && (
            <span style={{
              background: transmitting ? 'rgba(232,74,74,0.3)' : 'var(--surface)',
              border: `1px solid ${transmitting ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: 3, padding: '2px 7px', fontSize: 10,
              color: transmitting ? 'var(--red)' : 'var(--text)',
            }}>SPACE</span>
          )}
        </button>

        {/* Mute toggle */}
        <button
          onClick={onMuteToggle}
          style={{
            padding: '16px 14px', flexShrink: 0,
            background: muted ? 'rgba(232,74,74,0.1)' : 'var(--surface2)',
            border: `2px solid ${muted ? 'var(--red)' : 'var(--border)'}`,
            color: muted ? 'var(--red)' : 'var(--muted)',
            fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.12s', outline: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {muted ? '🔇 UNMUTE' : '🔈 MUTE'}
        </button>
      </div>

      <div style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 8, letterSpacing: '0.04em' }}>
        {muted
          ? 'You are muted — click UNMUTE to enable broadcasting'
          : 'Hold SPACE or the button · Release to cut mic'}
      </div>
    </div>
  )
}
