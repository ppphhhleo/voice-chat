import { NextResponse } from "next/server";

// Server-side endpoint to get ephemeral token for WebSocket auth
// This keeps the API key secret from the client
export async function POST() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "XAI_API_KEY not set" }, { status: 500 });
  }

  try {
    // Get ephemeral token from xAI for browser WebSocket auth
    const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: 300 }, // 5 minute expiry
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI token error:", error);
      return NextResponse.json({ error: `Failed to get token: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    // Response contains { client_secret: { value: "...", expires_at: ... } }
    return NextResponse.json({ token: data.client_secret?.value || data.token || apiKey });
  } catch (err) {
    console.error("Token fetch error:", err);
    // Fallback to API key if ephemeral tokens not supported
    return NextResponse.json({ token: apiKey });
  }
}
