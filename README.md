# SQUAWK — Flash News Terminal

Internal push-to-talk squawk box for broadcasting flash headlines to a group. Squawkers hold SPACE to transmit live audio; listeners receive it automatically.

---

## Setup (5 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Get LiveKit credentials (free)

1. Go to [cloud.livekit.io](https://cloud.livekit.io) and create a free account
2. Create a new project
3. Copy your **API Key**, **API Secret**, and **WebSocket URL** from the project dashboard

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
SQUAWK_ROOM_PASSCODE=yourfirmpasscode
```

- `SQUAWK_ROOM_PASSCODE` — only people with this passcode can join as Squawkers. Share it only with your 3–4 broadcasters.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add your environment variables in the Vercel dashboard under **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `LIVEKIT_API_KEY` | from LiveKit dashboard |
| `LIVEKIT_API_SECRET` | from LiveKit dashboard |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your-project.livekit.cloud` |
| `SQUAWK_ROOM_PASSCODE` | your chosen passcode |

---

## How it works

### Roles

| | Listener | Squawker |
|---|---|---|
| Hear broadcasts | ✅ | ✅ |
| Broadcast audio | ❌ | ✅ |
| Requires passcode | No | Yes |

### Push-to-Talk
- Squawkers: **Hold SPACE** (keyboard) or **hold the button** on screen to go live
- Releasing immediately cuts the mic — no open mic, no background noise
- A red "ON AIR" indicator shows when someone is broadcasting

### Presence
- Right panel shows who is online, split by Squawkers and Listeners
- Speaking indicator turns red in real-time when a squawker is transmitting

### Log
- Every transmission is timestamped and logged with the squawker's name and duration

---

## Scaling

LiveKit free tier supports up to 100 concurrent participants. For 30–35 people this is completely free. If you grow beyond that, their paid plans are very affordable.

---

## Tech Stack

- **Next.js 14** — framework, hosted on Vercel
- **LiveKit** — WebRTC audio infrastructure (handles all peer connections)
- **No database required** — all state is real-time via LiveKit

---

## Customisation

- Change room name: edit `roomName` in `app/api/livekit/route.ts`
- Change PTT key: edit `e.code === 'Space'` in `components/SquawkerControls.tsx`
- Add multiple rooms: extend the API route to accept a `room` parameter
