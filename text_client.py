"""
Quick text + audio client that talks to the local Grok proxy (server.py).
Usage:
    python text_client.py "hello there"

Requires:
- server.py running on port 8000
- XAI_API_KEY set in the environment for the proxy
"""

import asyncio
import base64
import json
import sys
import wave
from pathlib import Path
from time import perf_counter

import websockets


VOICE = "Rex"
DEFAULT_MESSAGE = "hello"
OUTPUT_WAV = Path("reply.wav")

# Match the app's default personality (all sliders at 50).
PERSONALITY_PROMPT = (
    "You are a voice assistant with the following personality: balanced and adaptable. "
    "Respond naturally in conversation. Your personality should influence your tone, word choice, "
    "and emotional expression. Use appropriate vocal cues like [sigh], [laugh], [whisper] when they fit your personality."
)


class GrokTextClient:
    def __init__(self, message: str = DEFAULT_MESSAGE, voice: str = VOICE, outfile: Path = OUTPUT_WAV):
        self.message = message
        self.voice = voice
        self.outfile = outfile
        self.audio_chunks: list[bytes] = []
        self.full_reply: list[str] = []
        self.uri = "ws://localhost:8000/ws"
        self._t_start: float | None = None
        self._t_end: float | None = None

    async def run(self):
        print(f"Connecting to {self.uri} ...")
        async with websockets.connect(self.uri) as ws:
            await self.configure_session(ws)
            await self.send_message(ws)
            await self.request_response(ws)
            await self.consume(ws)

    async def configure_session(self, ws):
        await ws.send(
            json.dumps(
                {
                    "type": "session.update",
                    "session": {
                        "voice": self.voice,
                        "instructions": PERSONALITY_PROMPT,
                        "turn_detection": {"type": "server_vad"},
                        "audio": {
                            "input": {"format": {"type": "audio/pcm", "rate": 24000}},
                            "output": {"format": {"type": "audio/pcm", "rate": 24000}},
                        },
                    },
                }
            )
        )

    async def send_message(self, ws):
        await ws.send(
            json.dumps(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [{"type": "input_text", "text": self.message}],
                    },
                }
            )
        )

    async def request_response(self, ws):
        await ws.send(
            json.dumps(
                {
                    "type": "response.create",
                    "response": {"modalities": ["text", "audio"]},
                }
            )
        )
        print("Sent message, awaiting reply...\n")
        self._t_start = perf_counter()

    async def consume(self, ws):
        async for raw in ws:
            data = json.loads(raw)
            t = data.get("type", "")

            if t in {"response.text.delta", "response.output_audio_transcript.delta"}:
                delta = data.get("delta") or data.get("text_delta")
                if delta:
                    self.full_reply.append(delta)
                    print(delta, end="", flush=True)

            if t in {"response.output_audio.delta", "response.audio.delta"}:
                delta = data.get("delta")
                encoded = delta if isinstance(delta, str) else delta.get("data") if delta else None
                if encoded:
                    self.audio_chunks.append(base64.b64decode(encoded))

            if t == "response.done":
                print("\n\nComplete.")
                self._t_end = perf_counter()
                self.save_audio()
                self.report_latency()
                break

    def save_audio(self):
        if not self.audio_chunks:
            return
        pcm = b"".join(self.audio_chunks)
        with wave.open(str(self.outfile), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit PCM
            wf.setframerate(24000)
            wf.writeframes(pcm)
        print(f"Saved audio to {self.outfile.resolve()}")

    def report_latency(self):
        if self._t_start is None or self._t_end is None:
            return
        elapsed = self._t_end - self._t_start
        print(f"Generation time: {elapsed:.2f}s")


if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MESSAGE
    client = GrokTextClient(message=message)
    asyncio.run(client.run())
