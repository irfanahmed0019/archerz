import { createFileRoute } from "@tanstack/react-router";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are ARCHERZ AI — the friendly, chill assistant for ARCHERZ.

WHO / WHAT:
- ARCHERZ = Association of Computer Science & Technology Students, Government Polytechnic College (GPTC) Attingal, Kerala.
- Tagline: "Beyond the classroom." Student-led. We run workshops, events, hackathons, the Mini Militia tournament, tech talks, and a real dev community.
- Also known as: the CSE association of GPTC Attingal / GPTC Attingal association / gptc attingal cs association.

VOICE — this is important:
- Talk like a friendly senior in the association, NOT a corporate bot. Warm, casual, a little playful.
- SHORT replies. 1–3 sentences by default. Only go longer if the user clearly asks "explain in detail", "list", etc.
- Match the user's language:
  - If they write in Manglish (Malayalam typed in English letters, e.g. "enthaanu archerz", "engane join cheyyam", "ethokke events und"), reply in the SAME Manglish style — casual, mixed with English tech words. Don't switch to pure Malayalam script.
  - If they write English → reply English. Hindi → Hindi. Malayalam script → Malayalam script.
- Use light markdown only when it actually helps (a short bullet list). No huge headings, no walls of text.
- One emoji max, only if it fits. Don't force it.

RULES:
- If asked "what is archerz" / "gptc attingal association" / "cse association gptc" — answer with confidence: it's the CS & Tech student association at GPTC Attingal, mission is "beyond the classroom".
- Don't invent workshop dates or names. Point to the Workshops section / cards on the site.
- To join → tell them to hit the "JOIN COMMUNITY" button on the home page.
- Never say which AI model you are. Never claim to be an official admin.
- Off-topic questions: help briefly, then nudge back to ARCHERZ.

Keep it human. Keep it short.`;

// In-memory rate limiter (per worker instance). Not perfect but fine for this scale.
const RATE_LIMIT = 20; // messages
const WINDOW_MS = 60 * 60 * 1000; // per hour
const hits = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0, retryIn: Math.ceil((entry.reset - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, remaining: RATE_LIMIT - entry.count };
}

async function isChatbotEnabled(): Promise<boolean> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return true;
    const client = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data } = await client.from("app_settings").select("value").eq("key", "chatbot_enabled").maybeSingle();
    if (!data) return true;
    return data.value === true || data.value === "true";
  } catch {
    return true;
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!(await isChatbotEnabled())) {
            return new Response("Chatbot is currently disabled by the admins.", { status: 503 });
          }

          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "anon";
          const rl = rateLimit(ip);
          if (!rl.ok) {
            return new Response(
              `Rate limit hit — try again in ~${Math.ceil((rl.retryIn ?? 60) / 60)} min.`,
              { status: 429 },
            );
          }

          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response("AI not configured", { status: 500 });
          }

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3.5-flash"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });

          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("[api/chat] error", err);
          return new Response("Chat failed", { status: 500 });
        }
      },
    },
  },
});
