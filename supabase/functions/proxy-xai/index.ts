// supabase/functions/proxy-xai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY")!;
const SUPABASE_URL = "https://gsljjtirhyzmbzzucufu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGpqdGlyaHl6bWJ6enVjdWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAwMDAwMDAsImV4cCI6MjAzNzU2ODAwMH0.YOUR_ANON_KEY_HERE";

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

  // Get the user's Bearer token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const userToken = authHeader.split(" ")[1];

  // Verify the user token using the anon key (this is the ONLY way that works now)
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${userToken}`,
    },
  });

  if (!verifyRes.ok) {
    return new Response("Invalid token", { status: 401, headers: corsHeaders });
  }

  const user = await verifyRes.json();
  if (!user?.id) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // Forward to xAI
  const payload = await req.json();

  const xaiRes = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return new Response(xaiRes.body, {
    status: xaiRes.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});