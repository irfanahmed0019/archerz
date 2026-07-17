import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_workshops",
  title: "List ARCHERZ workshops",
  description:
    "List workshops / events / hackathons hosted by the ARCHERZ association at GPTC Attingal. Returns title, slug, status, event date, and register URL.",
  inputSchema: {
    only_published: z
      .boolean()
      .optional()
      .describe("If true (default), only return workshops that are published on the site."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_published = true, limit = 20 }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    let query = client
      .from("workshops")
      .select("slug,title,code,status,event_date,duration,is_featured,is_published,register_url")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (only_published) query = query.eq("is_published", true);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { workshops: data ?? [] },
    };
  },
});
