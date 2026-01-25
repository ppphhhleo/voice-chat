import { NextResponse } from "next/server";

const XAI_SECRETS_URL = "https://api.x.ai/v1/realtime/client_secrets";
const TOKEN_EXPIRY_SECONDS = 300;

export async function POST() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "XAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(XAI_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: TOKEN_EXPIRY_SECONDS },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`xAI token error [${response.status}]:`, body);
      return NextResponse.json(
        { success: false, error: `xAI returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    // xAI returns { value, expires_at } directly (not nested under client_secret)
    const token = data.value || data.client_secret?.value;

    if (!token) {
      console.error("xAI response missing token:", data);
      return NextResponse.json(
        { success: false, error: "Invalid token response from xAI" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });
  } catch (err) {
    console.error("Token fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reach xAI API" },
      { status: 502 }
    );
  }
}
