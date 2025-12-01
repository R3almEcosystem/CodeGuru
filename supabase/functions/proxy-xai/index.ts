// supabase/functions/proxy-xai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Validate Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized: Missing token", { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  // Validate JWT using Supabase service role key
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!verifyRes.ok) {
    return new Response("Unauthorized: Invalid token", { status: 401 });
  }

  const { user } = await verifyRes.json();
  if (!user) {
    return new Response("Unauthorized: No user", { status: 401 });
  }

  // Forward request to xAI
  const payload = await req.json();

  const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  // Stream response back directly
  return new Response(xaiResponse.body, {
    status: xaiResponse.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
});