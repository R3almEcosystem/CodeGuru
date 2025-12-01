// supabase/functions/proxy-xai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const SUPABASE_URL = "https://gsljjtirhyzmbzzucufu.supabase.co"; // Hardcoded — no longer needed as secret

console.log("proxy-xai loaded | XAI:", !!XAI_API_KEY, "| Service key:", !!SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Missing Bearer token", { status: 401, headers: corsHeaders });
  }

  const token = authHeader.split(" ")[1];

  // Verify user token with service_role key
  const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY!,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!verifyResponse.ok) {
    const error = await verifyResponse.text();
    console.error("JWT verification failed:", verifyResponse.status, error);
    return new Response("Invalid token", { status: 401, headers: corsHeaders });
  }

  const verifyData = await verifyResponse.json();
  if (!verifyData.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // Forward to xAI
  const payload = await req.json();

  const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return new Response(xaiResponse.body, {
    status: xaiResponse.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});