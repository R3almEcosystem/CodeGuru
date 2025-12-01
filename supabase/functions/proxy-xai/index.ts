// supabase/functions/proxy-xai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const XAI_API_KEY = Deno.env.get("XAI_API_KEY")!;

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

  // Just forward the Authorization header (no verification needed)
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Missing Authorization", { status: 401, headers: corsHeaders });
  }

  const payload = await req.json();

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});