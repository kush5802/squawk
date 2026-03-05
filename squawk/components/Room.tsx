'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useSpeakingParticipants,
  useDataChannel,
} from '@livekit/components-react'
import '@livekit/components-styles'
import SquawkerControls from './SquawkerControls'
import PresencePanel from './PresencePanel'

interface RoomProps {
  token: string
  myName: string
  myRole: 'listener' | 'squawker'
  roomName: string
  onLeave: () => void
}

// Feed entry = either a voice log or a chat message
interface FeedEntry {
  id: number
  time: string
  sender: string
  type: 'voice' | 'chat'
  // voice only
  durationMs?: number
  // chat only
  text?: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function SquawkTerminal({ myName, myRole, roomName, onLeave }: { myName: string; myRole: 'listener' | 'squawker'; roomName: string; onLeave: () => void }) {
  const [transmitting, setTransmitting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const feedRef = useRef<HTMLDivElement>(null)
  const transmitStartRef = useRef<number | null>(null)
  const idRef = useRef(0)

  // Clock
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Active speaker from LiveKit
  const speaking = useSpeakingParticipants()
  useEffect(() => {
    if (speaking.length > 0) {
      const s = speaking[0]
      setActiveSpeaker(s.name || s.identity.split('-').slice(1, -1).join(' '))
    } else {
      setActiveSpeaker(null)
    }
  }, [speaking])

  // ── LiveKit Data Channel for chat ──────────────────────────────
  const { send } = useDataChannel('chat', (msg) => {
    // Incoming chat message from another participant
    try {
      const parsed = JSON.parse(decoder.decode(msg.payload))
      appendFeed({
        type: 'chat',
        sender: parsed.sender,
        text: parsed.text,
      })
    } catch {}
  })

  // ── Feed helpers ───────────────────────────────────────────────
  function nowStr() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function appendFeed(entry: Omit<FeedEntry, 'id' | 'time'>) {
    setFeed(prev => [...prev, { ...entry, id: idRef.current++, time: nowStr() }])
  }

  // Scroll to bottom on new entry
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [feed])

  // ── Transmit change ────────────────────────────────────────────
  const handleTransmitChange = useCallback((active: boolean) => {
    setTransmitting(active)
    if (active) {
      transmitStartRef.current = Date.now()
    } else {
      const dur = transmitStartRef.current ? Date.now() - transmitStartRef.current : 0
      transmitStartRef.current = null
      appendFeed({ type: 'voice', sender: myName, durationMs: dur })
    }
  }, [myName])

  // ── Chat send ──────────────────────────────────────────────────
  function sendChat() {
    const text = chatInput.trim()
    if (!text) return
    // Send to all other participants via LiveKit data channel
    const payload = encoder.encode(JSON.stringify({ sender: myName, text }))
    send(payload, { reliable: true })
    // Add to own feed immediately
    appendFeed({ type: 'chat', sender: myName, text })
    setChatInput('')
  }

  const isOnAir = transmitting || activeSpeaker !== null
  const onAirName = transmitting ? myName : activeSpeaker

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <RoomAudioRenderer />

      {/* TOP BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)' }}>
          SQUAWK <span style={{ color: 'var(--muted)', fontWeight: 300 }}>/ {roomName}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
            {myRole === 'squawker' && muted && (
              <span style={{ color: 'var(--red)', marginLeft: 8 }}>· MUTED</span>
            )}
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

      {/* MAIN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: FEED + CHAT */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>

          {/* Feed header */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
            color: 'var(--muted)', textTransform: 'uppercase',
            display: 'flex', justifyContent: 'space-between',
            background: 'var(--surface)', flexShrink: 0,
          }}>
            <span>Feed & Chat</span>
            <span>{feed.filter(e => e.type === 'voice').length} squawks · {feed.filter(e => e.type === 'chat').length} messages</span>
          </div>

          {/* Active speaker banner */}
          {isOnAir && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #150a0a, #1e0a0a)',
              borderBottom: '1px solid rgba(232,74,74,0.3)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
                {[8, 18, 24, 14, 20].map((h, i) => (
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{onAirName}</div>
              </div>
            </div>
          )}

          {/* Feed scroll */}
          <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {feed.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%',
                color: 'var(--muted)', fontSize: 12, gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>📡</span>
                <span>Room is live — nothing yet</span>
                {myRole === 'squawker' && (
                  <span style={{ fontSize: 11, color: '#444' }}>Hold SPACE to broadcast · Type below to chat</span>
                )}
                {myRole === 'listener' && (
                  <span style={{ fontSize: 11, color: '#444' }}>Type below to send a message</span>
                )}
              </div>
            ) : feed.map(entry => (
              <div key={entry.id} style={{
                padding: '11px 20px', borderBottom: '1px solid #131313',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, paddingTop: 2, minWidth: 60 }}>
                  {entry.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 3,
                    color: entry.type === 'chat' ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {entry.sender.toUpperCase()}
                    {entry.type === 'voice' && (
                      <span style={{ color: '#444', fontWeight: 400, marginLeft: 8 }}>
                        🎙 voice · {((entry.durationMs ?? 0) / 1000).toFixed(1)}s
                      </span>
                    )}
                    {entry.type === 'chat' && (
                      <span style={{ color: '#444', fontWeight: 400, marginLeft: 8 }}>💬 chat</span>
                    )}
                  </div>
                  {entry.type === 'chat' && (
                    <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.5 }}>
                      {entry.text}
                    </div>
                  )}
                  {entry.type === 'voice' && (
                    <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>
                      Voice squawk transmitted
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input — available to everyone */}
          <div style={{
            borderTop: '1px solid var(--border)', background: 'var(--surface)',
            padding: '12px 16px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: myRole === 'squawker' ? 0 : 0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                placeholder="Type a message and press Enter..."
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13,
                  padding: '10px 12px', outline: 'none', letterSpacing: '0.02em',
                }}
              />
              <button
                onClick={sendChat}
                style={{
                  padding: '10px 16px', background: 'var(--surface2)',
                  border: '1px solid var(--border)', color: 'var(--accent)',
                  fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                SEND
              </button>
            </div>
            {myRole === 'listener' && (
              <div style={{ fontSize: 10, color: '#444', marginTop: 6, letterSpacing: '0.04em' }}>
                🎧 Listener — you can chat but not broadcast audio
              </div>
            )}
          </div>

          {/* PTT controls for squawkers */}
          {myRole === 'squawker' && (
            <SquawkerControls
              myName={myName}
              transmitting={transmitting}
              onTransmitChange={handleTransmitChange}
              muted={muted}
              onMuteToggle={() => setMuted(m => !m)}
            />
          )}
        </div>

        {/* RIGHT: PRESENCE */}
        <PresencePanel myName={myName} myRole={myRole} />
      </div>
    </div>
  )
}

export default function Room({ token, myName, myRole, roomName, onLeave }: RoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!livekitUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontFamily: 'monospace' }}>
        NEXT_PUBLIC_LIVEKIT_URL is not configured.
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onLeave}
    >
      <SquawkTerminal myName={myName} myRole={myRole} roomName={roomName} onLeave={onLeave} />
    </LiveKitRoom>
  )
}
