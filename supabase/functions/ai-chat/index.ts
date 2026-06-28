// Lovable AI chat edge function. Replaces base44.integrations.Core.InvokeLLM.
// Accepts { prompt?: string, messages?: [{role,content}] } and returns { text }.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, messages } = body as { prompt?: string; messages?: { role: string; content: string }[] };

    const chatMessages = messages && messages.length
      ? messages
      : [{ role: "user", content: prompt || "Xin chào" }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: chatMessages,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(
        JSON.stringify({ error: `AI gateway ${aiRes.status}`, detail: errText }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
