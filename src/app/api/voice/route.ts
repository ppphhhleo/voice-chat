import { NextRequest, NextResponse } from "next/server";

// REST-based alternative: Single request/response for text-to-speech
// This bypasses WebSocket browser limitations
export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not set" }, { status: 500 });
  }

  const { text, instructions } = await req.json();

  // Use the REST chat completions API with audio output as fallback
  // The realtime WebSocket may require server-side handling
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      text: data.choices?.[0]?.message?.content || "",
      // Audio would need separate TTS call
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}
