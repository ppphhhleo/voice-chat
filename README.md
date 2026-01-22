# Grok Voice Chat
A tiny Next.js + FastAPI setup for real‑time, personality‑tuned voice chat with xAI Grok.

## Quick Start
1) Install Python deps: `pip install -r requirements.txt`
2) Copy env file for API: `cp .env.local.example .env.local` then set `XAI_API_KEY`
3) Run proxy (port 8000): `python server.py`
4) Install node deps (once): `npm install`
5) Start the app (port 3030): `npm run dev`
6) Open http://localhost:3030, click **Start Conversation**, allow mic.

## Notes
- Requires mic access; best in Chromium-based browsers.
- If the connection fails, ensure the server proxy is running and the api key is valid.
