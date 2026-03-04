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

  // ── Core mic control — single source of truth ──────────────────
  // ONLY this function touches the mic. Nothing else.
  const setMic = useCallback(async (on: boolean) => {
    try {
      await localParticipant.setMicrophoneEnabled(on)
    } catch (e) {
      console.error('Mic error:', e)
    }
  }, [localParticipant])

  const showWarning = useCallback(() => {
    setShowMuteWarning(true)
    if (warningTimer.current) clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setShowMuteWarning(false), 2500)
  }, [])

  // ── Start transmitting ─────────────────────────────────────────
  const startTransmit = useCallback(async () => {
    if (pressedRef.current) return   // already pressed
    if (muted) { showWarning(); return }  // blocked by mute
    pressedRef.current = true
    onTransmitChange(true)
    await setMic(true)  // actually open mic
  }, [muted, showWarning, onTransmitChange, setMic])

  // ── Stop transmitting ──────────────────────────────────────────
  const stopTransmit = useCallback(async () => {
    if (!pressedRef.current) return
    pressedRef.current = false
    onTransmitChange(false)
    await setMic(false)  // actually close mic
  }, [onTransmitChange, setMic])

  // ── When mute is toggled ON, kill mic immediately ──────────────
  useEffect(() => {
    if (muted) {
      // Force mic off regardless of press state
      pressedRef.current = false
      onTransmitChange(false)
      setMic(false)
    }
  }, [muted, onTransmitChange, setMic])

  // ── Kill mic when tab loses focus or becomes hidden ────────────
  useEffect(() => {
    const killMic = () => {
      if (pressedRef.current) {
        pressedRef.current = false
        onTransmitChange(false)
        setMic(false)
      }
    }

    // Tab switch / minimise
    const onVisibilityChange = () => {
      if (document.hidden) killMic()
    }

    // Window blur (clicking another app)
    const onBlur = () => killMic()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
    }
  }, [onTransmitChange, setMic])

  // ── Keyboard PTT — Space bar ───────────────────────────────────
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

  // ── Ensure mic is off on mount and unmount ─────────────────────
  useEffect(() => {
    setMic(false)
    return () => { setMic(false) }  // also kill on component unmount
  }, [setMic])

  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>

      {/* Mute warning */}
      {showMuteWarning && (
        <div style={{
          marginBottom: 10, padding: '10px 14px',
          background: 'rgba(232,74,74,0.12)', border: '1px solid var(--red)',
          borderRadius: 3, fontSize: 12, color: 'var(--red)',
          fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
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
          onTouchStart={(e) => { e.preventDefault(); startTransmit() }}
          onTouchEnd={(e) => { e.preventDefault(); stopTransmit() }}
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
          ? 'Muted — mic is fully off · click UNMUTE to enable'
          : 'Hold SPACE or button · mic only opens while held · releases on tab switch'}
      </div>
    </div>
  )
}
