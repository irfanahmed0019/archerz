import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthResult = {
  data?: {
    client?: { name?: string; client_id?: string; redirect_uris?: string[] } | null;
    scope?: string;
    redirect_url?: string;
    redirect_to?: string;
  } | null;
  error?: { message: string } | null;
};
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-hairline bg-surface p-8 font-mono text-sm">
        <div className="text-signal text-[11px] uppercase tracking-[0.24em]">
          [ AUTHORIZATION ERROR ]
        </div>
        <p className="mt-4 text-foreground">
          Could not load this authorization request:{" "}
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";
  const redirectUri = details?.client?.redirect_uris?.[0] ?? "unknown";
  const scope = details?.scope ?? "";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md border border-hairline bg-surface p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
          ARCHERZ // AUTHORIZE
        </div>
        <h1 className="mt-4 font-display text-3xl tracking-tight">
          Connect <span className="text-signal">{clientName}</span> to your account
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">
          {clientName} will be able to call ARCHERZ tools while you are signed in.
          It does not bypass this app's permissions or backend policies.
        </p>

        <dl className="mt-6 grid gap-3 border-t border-hairline pt-6 font-mono text-xs">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Redirect
            </dt>
            <dd className="mt-1 break-all text-foreground">{redirectUri}</dd>
          </div>
          {scope ? (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Scope
              </dt>
              <dd className="mt-1 break-all text-foreground">{scope}</dd>
            </div>
          ) : null}
        </dl>

        {error ? (
          <div
            role="alert"
            className="mt-6 border border-signal/40 bg-signal/5 p-3 font-mono text-xs text-signal"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="btn-brutal btn-brutal-hover justify-center disabled:opacity-50"
          >
            {busy ? "..." : "→ APPROVE"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="border border-hairline bg-background px-4 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-surface disabled:opacity-50"
          >
            Cancel connection
          </button>
        </div>
      </div>
    </main>
  );
}
