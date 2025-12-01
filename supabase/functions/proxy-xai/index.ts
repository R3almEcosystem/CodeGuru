// supabase/functions/proxy-xai/index.ts — Production-Ready, Streaming Proxy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");

if (!XAI_API_KEY) {
  console.error("CRITICAL: XAI_API_KEY missing — check Supabase secrets!");
  Deno.exit(1);
}

serve(async (req: Request) => {
  try {
    // Method check
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Auth header validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized: Invalid token format", { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // JWT Verify (using Supabase auth endpoint — fixed for 2025 from )
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyData.user) {
      console.warn("JWT verification failed:", verifyData);
      return new Response("Unauthorized: Invalid JWT", { status: 401 });
    }

    // Parse payload
    let payload;
    try {
      payload = await req.json();
    } catch {
      return new Response("Bad Request: Invalid JSON", { status: 400 });
    }

    // Proxy to xAI (full streaming support)
    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!xaiResponse.ok) {
      const errBody = await xaiResponse.text();
      console.error("xAI API Error:", xaiResponse.status, errBody);
      return new Response(errBody, { status: xaiResponse.status });
    }

    // Stream back (preserves SSE format for frontend)
    return new Response(xaiResponse.body, {
      status: xaiResponse.status,
      statusText: xaiResponse.statusText,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",  // For SSE streaming
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});