import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listWorkshopsTool from "./tools/list-workshops";
import getWorkshopTool from "./tools/get-workshop";

// OAuth issuer must be the direct Supabase host — not the .lovable.cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "archerz-mcp",
  title: "ARCHERZ",
  version: "0.1.0",
  instructions:
    "Tools for the ARCHERZ association (Association of Computer Science & Technology Students, GPTC Attingal). Use `list_workshops` to see workshops/events, `get_workshop` for full detail by slug, and `whoami` to confirm the signed-in ARCHERZ account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listWorkshopsTool, getWorkshopTool],
});
