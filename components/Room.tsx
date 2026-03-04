'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useSpeakingParticipants,
} from '@livekit/components-react'
import '@livekit/components-styles'
import SquawkerControls from './SquawkerControls'
import PresencePanel from './PresencePanel'

interface RoomProps {
  token: string
  myName: string
  myRole: 'listener' | 'squawker'
  onLeave: () => void
}

interface LogEntry {
  id: number
  time: string
  speaker: string
  durationMs: number
}

function SquawkTerminal({ myName, myRole, onLeave }: { myName: string; myRole: 'listener' | 'squawker'; onLeave: () => void }) {
  const [transmitting, setTransmitting] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const transmitStartRef = useRef<number | null>(null)
  const idRef = useRef(0)
  const speaking = useSpeakingParticipants()

  // Clock
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Track active speaker from LiveKit
  useEffect(() => {
    if (speaking.length > 0) {
      const s = speaking[0]
      setActiveSpeaker(s.name || s.identity.split('-').slice(1, -1).join(' '))
    } else {
      setActiveSpeaker(null)
    }
  }, [speaking])

  // When transmit ends, log it
  const handleTransmitChange = useCallback((active: boolean) => {
    setTransmitting(active)
    if (active) {
      transmitStartRef.current = Date.now()
    } else {
      const dur = transmitStartRef.current ? Date.now() - transmitStartRef.current : 0
      transmitStartRef.current = null
      const t = new Date()
      const timeStr = t.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLog(prev => [{
        id: idRef.current++,
        time: timeStr,
        speaker: myName,
        durationMs: dur,
      }, ...prev])
    }
  }, [myName])

  // Scroll log to top on new entry
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0
  }, [log])

  const isOnAir = transmitting || (activeSpeaker !== null && activeSpeaker !== myName)
  const onAirName = transmitting ? myName : activeSpeaker

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* RoomAudioRenderer is invisible — renders audio for all participants */}
      <RoomAudioRenderer />

      {/* TOP BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)' }}>
          SQUAWK <span style={{ color: 'var(--muted)', fontWeight: 300 }}>/ TRADING FLOOR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* ON AIR / STANDBY indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className={isOnAir ? 'pulse-red' : ''}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOnAir ? 'var(--red)' : '#333',
                transition: 'background 0.2s',
              }}
            />
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.15em',
              color: isOnAir ? 'var(--red)' : 'var(--muted)',
            }}>
              {isOnAir ? 'ON AIR' : 'STANDBY'}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>{time} GMT</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {myName} · {myRole.toUpperCase()}
          </span>
          <button
            onClick={onLeave}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
              fontFamily: 'inherit', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
              padding: '5px 12px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            LEAVE
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: FEED + CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

          {/* Feed header */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
            color: 'var(--muted)', textTransform: 'uppercase',
            display: 'flex', justifyContent: 'space-between',
            background: 'var(--surface)', flexShrink: 0,
          }}>
            <span>Squawk Log</span>
            <span>{log.length} transmissions</span>
          </div>

          {/* Active speaker banner */}
          {isOnAir && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #150a0a, #1e0a0a)',
              borderBottom: '1px solid rgba(232,74,74,0.3)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
                {[10, 20, 28, 16, 22].map((h, i) => (
                  <div key={i} className="wave-bar" style={{
                    width: 3, height: h, background: 'var(--red)',
                    borderRadius: 2, transformOrigin: 'bottom',
                  }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 2 }}>
                  ● LIVE BROADCAST
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {onAirName}
                </div>
              </div>
            </div>
          )}

          {/* Log entries */}
          <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {log.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: 'var(--muted)', fontSize: 12, gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>📡</span>
                <span>No squawks yet — room is live</span>
                {myRole === 'squawker' && (
                  <span style={{ fontSize: 11, color: '#444' }}>Hold SPACE or the button below to broadcast</span>
                )}
              </div>
            ) : log.map(entry => (
              <div
                key={entry.id}
                className={entry.id === 0 ? 'flash-in' : ''}
                style={{
                  padding: '14px 20px', borderBottom: '1px solid #131313',
                  display: 'flex', gap: 14,
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, paddingTop: 2, minWidth: 60 }}>
                  {entry.time}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {entry.speaker.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Voice squawk broadcast
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 10 }}>
                      {(entry.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PTT controls (squawker) or listener notice */}
          {myRole === 'squawker' ? (
            <SquawkerControls
              myName={myName}
              transmitting={transmitting}
              onTransmitChange={handleTransmitChange}
            />
          ) : (
            <div style={{
              padding: '16px 20px', borderTop: '1px solid var(--border)',
              background: 'var(--surface)', fontSize: 11,
              color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.05em', flexShrink: 0,
            }}>
              🎧 Listener mode — squawks will play automatically
            </div>
          )}
        </div>

        {/* RIGHT: PRESENCE */}
        <PresencePanel myName={myName} myRole={myRole} />
      </div>
    </div>
  )
}

export default function Room({ token, myName, myRole, onLeave }: RoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!livekitUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontFamily: 'monospace' }}>
        NEXT_PUBLIC_LIVEKIT_URL is not set. Check your .env.local file.
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={myRole === 'squawker'}
      video={false}
      onDisconnected={onLeave}
    >
      <SquawkTerminal myName={myName} myRole={myRole} onLeave={onLeave} />
    </LiveKitRoom>
  )
}
