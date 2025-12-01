// supabase/functions/proxy-xai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;  // ← changed name
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://gsljjtirhyzmbzzucufu.supabase.co";

console.log("proxy-xai started — keys loaded:", { hasXaiKey: !!XAI_API_KEY, hasServiceKey: !!SERVICE_ROLE_KEY });

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders, status: 204 });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Missing token", { status: 401, headers: corsHeaders });
  }

  const token = auth.split(" ")[1];

  // Verify JWT using service_role key
  const verify = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!verify.ok) {
    console.error("JWT verify failed:", await verify.text());
    return new Response("Invalid token", { status: 401, headers: corsHeaders });
  }

  const payload = await req.json();

  const xai = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return new Response(xai.body, {
    status: xai.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});