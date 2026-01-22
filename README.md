# Grok Voice Chat
A tiny Next.js + FastAPI setup for real‑time, personality‑tuned voice chat with xAI Grok.

## Quick Start
1) (Optional) Create a Python env with conda: `conda create -n grok-voice python=3.11 && conda activate grok-voice`
2) Install Python deps: `pip install -r requirements.txt`
3) Copy env file for API: `cp .env.local.example .env.local` then set `XAI_API_KEY`
4) Run proxy (port 8000): `python server.py`
5) Send a quick test message + save audio: `python text_client.py "hello how are you"`
6) Install node deps (once): `npm install`
7) Start the app (port 3030): `npm run dev`
8) Open http://localhost:3030, click **Start Conversation**, allow mic.

### Text client
- CLI helper to send a text prompt and save the reply audio: `python text_client.py "hello world"` (writes `reply.wav`).

## Notes
- Requires mic access; best in Chromium-based browsers.
- If the connection fails, ensure the server proxy is running and the api key is valid.
