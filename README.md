# Grok Voice Chat

Real-time voice chat with xAI Grok featuring a 3D avatar with lip-sync and personality-driven expressions.

## Quick Start

1. Copy env file: `cp .env.local.example .env.local` and set `XAI_API_KEY`
2. Install dependencies: `npm install`
3. Start the app: `npm run dev`
4. Open http://localhost:3000, click **Start Conversation**, allow mic

## Architecture

```
Browser ──WebSocket──> xAI Realtime API (wss://api.x.ai/v1/realtime)
   │
   └──> Next.js API (/api/token) generates ephemeral tokens
```

- **Direct connection**: Browser connects directly to xAI using ephemeral tokens (no proxy needed)
- **Secure**: API key stays server-side; only short-lived tokens are sent to browser
- **Avatar**: TalkingHead library provides 3D avatar with lip-sync and expressions

## Features

- Real-time voice conversation with Grok
- 3D avatar with lip-sync synchronized to audio responses
- Personality sliders (Big Five traits) that affect avatar mood and AI behavior
- Multiple voice options
- Text input fallback

## Notes

- Requires microphone access; works best in Chromium-based browsers
- Avatar model loaded from `/public/avatars/brunette.glb`
