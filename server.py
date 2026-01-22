"""
WebSocket proxy server for Grok Voice Agent API.
Handles browser WebSocket connections and forwards to xAI with proper auth.

Usage:
    pip install fastapi uvicorn websockets
    export XAI_API_KEY=your_key
    python server.py
"""

import asyncio
import json
import os
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import websockets

app = FastAPI()

# Allow CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3030"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

XAI_WS_URL = "wss://api.x.ai/v1/realtime"


@app.websocket("/ws")
async def websocket_proxy(ws: WebSocket):
    """Proxy WebSocket connection to xAI with proper authentication."""
    await ws.accept()

    api_key = os.environ.get("XAI_API_KEY")
    if not api_key:
        await ws.send_json({"type": "error", "error": {"message": "XAI_API_KEY not set"}})
        await ws.close()
        return

    xai_ws: Optional[websockets.WebSocketClientProtocol] = None

    try:
        # Connect to xAI with auth header
        xai_ws = await websockets.connect(
            XAI_WS_URL,
            additional_headers={"Authorization": f"Bearer {api_key}"},
        )
        print("Connected to xAI")

        async def forward_to_xai():
            """Forward messages from browser to xAI."""
            try:
                while True:
                    data = await ws.receive_text()
                    msg = json.loads(data)
                    msg_type = msg.get("type", "")
                    # Log non-audio messages (audio is too noisy)
                    if msg_type != "input_audio_buffer.append":
                        print(f"  → xAI: {msg_type}")
                    await xai_ws.send(data)
            except WebSocketDisconnect:
                print("Browser disconnected")

        async def forward_to_browser():
            """Forward messages from xAI to browser."""
            try:
                async for message in xai_ws:
                    msg = json.loads(message)
                    msg_type = msg.get("type", "")
                    # Log non-audio-delta messages
                    if "audio" not in msg_type or "delta" not in msg_type:
                        print(f"  ← xAI: {msg_type}")
                    await ws.send_text(message)
            except websockets.exceptions.ConnectionClosed:
                print("xAI connection closed")

        # Run both directions concurrently
        await asyncio.gather(forward_to_xai(), forward_to_browser())

    except Exception as e:
        print(f"Error: {e}")
        await ws.send_json({"type": "error", "error": {"message": str(e)}})
    finally:
        if xai_ws:
            await xai_ws.close()
        await ws.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
